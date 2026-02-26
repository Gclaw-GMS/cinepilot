# CinePilot Enhancement Blueprint

> South Indian Cinema's First AI-Powered Pre-Production Suite

This document audits every feature in CinePilot, identifies where AI can transform each one, defines the target architecture, and proposes new features tailored to the South Indian film industry.

**Priority Key:** P0 = Must have (core value), P1 = Should have (competitive edge), P2 = Nice to have (premium tier)

---

## Architecture

Python backend has been removed. The new architecture is:

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│           Next.js 14 (App Router)                   │
│    React 18 · TypeScript · Tailwind CSS             │
│    Recharts · Framer Motion · Lucide Icons          │
├─────────────────────────────────────────────────────┤
│                  API LAYER                          │
│         Next.js API Routes (/app/api/)              │
│   Server Actions · Route Handlers · Middleware      │
├──────────┬──────────────┬───────────────────────────┤
│   DATA   │    CACHE     │           AI              │
│          │              │                           │
│ Postgres │    Redis     │      AIML API             │
│  (via    │  (sessions,  │  (GPT-4, Claude,          │
│  Prisma  │   query      │   Llama, Stable           │
│  or      │   cache,     │   Diffusion, Whisper      │
│  Drizzle)│   rate       │   — unified gateway)      │
│          │   limiting)  │                           │
└──────────┴──────────────┴───────────────────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS | UI, SSR, client components |
| **API** | Next.js API Routes (`/app/api/`) + Server Actions | All backend logic lives here. No separate backend server. |
| **Database** | PostgreSQL (via Prisma ORM or Drizzle ORM) | Persistent data: projects, scenes, crew, budget, schedules, users |
| **Cache** | Redis (Upstash or self-hosted) | Session management, API response caching, rate limiting, real-time pub/sub for collaboration |
| **AI** | AIML API (aimlapi.com) | Unified gateway to 200+ models: GPT-4o, Claude 3.5, Llama 3, Stable Diffusion XL, Whisper, etc. Single API key, one billing. |
| **Auth** | NextAuth.js or Clerk | JWT sessions, role-based access (Producer, Director, Line Producer, Department Head) |
| **File Storage** | Vercel Blob / AWS S3 / Cloudflare R2 | Script uploads, storyboard images, location photos, exports |
| **Notifications** | WhatsApp Business API + Resend (email) | Real crew communication |

### Why AIML API over direct OpenAI/Anthropic

- Single API key for 200+ models (GPT-4o, Claude 3.5 Sonnet, Llama 3.1, Mistral, Stable Diffusion, Whisper, etc.)
- Switch models per feature without managing multiple SDKs
- Image generation (storyboards, posters) and speech (dialogue coach) included
- Cost optimization: use cheaper models for simple tasks, premium models for script analysis

### Why Redis

- Cache expensive AI responses (script analysis results, budget predictions)
- Rate limit AI API calls per user/project
- Session storage for NextAuth
- Real-time collaboration via pub/sub (schedule updates, budget changes broadcast to team)
- Queue background jobs (PDF generation, batch notifications)

### Why PostgreSQL (not JSON files)

- Relational integrity: projects -> scenes -> characters -> shooting_days
- Multi-user concurrent access
- Full-text search on scripts and scene descriptions
- The `database/schema.sql` already defines 14 tables ready to use
- Migrate to Prisma/Drizzle models for type-safe queries in TypeScript

---

## Part 1: Feature Audit with AI Enhancements

### 1. Dashboard (`/`)

| Aspect | Detail |
|--------|--------|
| **Current State** | 4 KPI cards (Budget, Spent, Active Projects, Completion), Budget vs Spending area chart, Project Status pie chart, Scene Breakdown bar chart, Crew Allocation chart, Phase Progress chart, Recent Activity feed. |
| **Gaps** | All charts use hardcoded demo data. "Refresh" and "New Project" buttons are non-functional. Completion % is static (68%). No project filtering. Budget spent is simulated as `totalBudget * 0.72`. |

**AI Enhancements (P0)**

| Enhancement | Implementation |
|-------------|---------------|
| Daily Production Briefing | AIML API (GPT-4o) generates a natural-language morning briefing from PostgreSQL project data. Cached in Redis for 1 hour. |
| Predictive Risk Score | AIML API analyzes schedule, budget burn rate, weather, and crew availability from PostgreSQL to produce a risk score (0-100). Cache result in Redis, recompute on data change. |
| Anomaly Detection | Server Action queries PostgreSQL for budget/schedule patterns. AIML API flags unusual spikes. Results cached in Redis. |
| Smart KPIs | Replace hardcoded numbers with PostgreSQL aggregate queries. AI-generated trend insights via AIML API. |

---

### 2. Script Parsing & AI Breakdown (`/scripts`) -- MAJOR FEATURE

| Aspect | Detail |
|--------|--------|
| **Current State** | Drag-and-drop upload (PDF, DOCX, FDX, TXT). AI analysis button returns mock data. Script preview. Script comparison tab. Tags, safety warnings, cultural notes. |
| **Gaps** | Upload fallback generates fake text. Analysis is static mock. No script library or version history. No persistence. No real entity extraction. No traceability to line/page ranges. |
| **Target** | Production-grade "Script Ingest + Breakdown" pipeline: deterministic text extraction → language detection (Tamil/Tanglish/mixed) → staged AI breakdown (scene boundaries, characters, locations, props, VFX) → canonicalization → quality scoring → consistency/plot hole detection. Persistent script library with version history. Every extracted entity maps back to line/page ranges. Never generates fake text. See **N16** in Part 3 for the complete deep specification. |

**Design Principles (Non-Negotiable):**
1. Never generate fake script text. If extraction fails, store explicit error + request re-upload.
2. Separate "text extraction" (deterministic) from "semantic breakdown" (AI).
3. AI in stages with strict JSON schemas + validation + grounding.
4. Every extracted entity maps back to line/page ranges in the original script (traceability).
5. Chunking, caching, and versioning are first-class.

**AI Enhancements (P0)**

| Enhancement | Implementation |
|-------------|---------------|
| Deterministic Text Extraction | Per-format extraction: PDF (layout-preserving text + OCR fallback), DOCX (paragraph/run parsing), FDX (XML structure -- highest quality), TXT (line split). Store as `script_text_blocks` with page_number + line_start/end. Extraction quality score (0-100) computed from heading patterns, dialogue density, garbled character ratio. Below threshold → explicit error, never fake text. |
| Scene Boundary Detection | Deterministic heading regex first (INT/EXT variations, Tamil equivalents). AI fallback (AIML API GPT-4o or Claude 3.5) for messy/non-standard formats with strict JSON schema. Backend validates: sequential, non-overlapping, line ranges exist. Failed validation → auto-repair prompt (max 2 retries). Persist to `scenes` table with version_id + page/line mapping. |
| Per-Scene Entity Extraction | AIML API extracts characters (name + Tamil aliases + dialogue role), locations (name + aliases), props (category: weapon/vehicle/phone), VFX notes (explicit vs implied, severity), safety notes (stunts, water hazards, weapons). Run per-scene in parallel. Each entity grounded in scene text -- confidence scores per entity. Persist to `characters`, `scene_characters`, `locations`, `scene_locations`, `props`, `scene_props`, `vfx_notes` tables. |
| Tamil/Tanglish Canonicalization | Global deduplication: deterministic clustering (casefold + Levenshtein + Tamil transliteration), then AIML API merge suggestions. Produces canonical names + alias lists for characters and locations. Prevents downstream hallucination in Shot Hub and Schedule. |
| Version History & Diff | Script versions tracked in `script_versions` table with content_hash. Diff between versions: added/removed scenes, character changes, location changes. Deterministic diff + optional AI summary ("Version 3 added 4 scenes and renamed antagonist"). |
| Screenplay Quality Score | AIML API (GPT-4o) rates formatting consistency, pacing, dialogue/action balance, readability. Scores 0-100 per dimension + actionable quick fixes. Stored in `ai_analyses` table. |
| Character Consistency Check | AIML API (Claude 3.5 -- best for long-context) analyzes character appearances across all scenes. Finds name changes, personality contradictions, timeline issues. Triggered on user click, not on every upload. Stored as `warnings`. |
| Plot Hole Detection | Synopsis-first approach: AI generates 1-2 line summary per scene, then long-context model analyzes synopsis list for narrative logic issues. Flags stored as `warnings` with scene_refs + suggested fixes. |
| Safety/Cultural Notes | Production-aware annotations: stunts, water hazards, vehicles, weapons (safety). Region-specific customs, sensitive depiction warnings (cultural). Compliance flags for harmful stereotypes. |

**Pipeline Architecture**

```
Upload (PDF/DOCX/FDX/TXT) → Create Script Version → Background Job
  → Stage 1: Deterministic Text Extraction (per-format, page/line mapping)
  → Stage 2: Language Detection (Tamil/Tanglish/mixed) + Normalization
  → Stage 3A: Scene Boundary Detection (regex + AI fallback)
  → Stage 3B: Per-Scene Entity Extraction (parallel, AI)
  → Stage 3C: Global Canonicalization (dedup characters/locations)
  → Stage 3D: Breakdown Summary
  → Stage 4: Quality Score (AI)
  → Stage 5: Character Consistency (long-context AI, on-demand)
  → Stage 6: Plot Hole Detection (synopsis-first, on-demand)
  → Stage 7: Safety/Cultural Notes
  → Cache + Persist → UI
```

**Data Model (PostgreSQL)**

| Table | Key Columns |
|-------|------------|
| `scripts` | id, project_id, filename, file_ext, storage_key_original, script_status (uploaded/extracting/extracted/analyzing/ready/failed), active_version_id |
| `script_versions` | id, script_id, version_number, content_hash (sha256), extraction_method, extraction_quality_score (0-100), language_detected |
| `script_text_blocks` | id, version_id, block_index, page_number, line_start, line_end, raw_text, normalized_text |
| `ai_analyses` | id, version_id, model_used, prompt_version, analysis_type (breakdown/quality_score/consistency/plot_holes/cultural_notes), result_json |
| `scenes` (extended) | version_id, page_start, page_end, line_start, line_end, location_normalized, scene_text_ref |
| `characters` (extended) | version_id, first_appearance_scene_id |
| `scene_characters` (extended) | speaking_lines_count, appears_in_action |
| `locations` (script-level) | id, project_id, version_id, name_canonical, aliases_json, indoor_outdoor |
| `scene_locations` | scene_id, location_id, confidence |
| `props` | id, project_id, version_id, name_canonical, aliases_json, category |
| `scene_props` | scene_id, prop_id, confidence |
| `vfx_notes` | id, scene_id, severity, description |
| `warnings` | id, version_id, warning_type (safety/cultural/formatting/plot), severity, message, scene_id |

**Redis Keys:**
- `script_extract:{version_id}` -- extracted text/pages metadata
- `breakdown:{content_hash}:{prompt_version}:{model}` -- breakdown JSON
- `quality:{content_hash}:{prompt_version}:{model}` -- score JSON

**File Storage Layout:**
`scripts/{project_id}/{script_id}/{version_id}/original.{ext}` + `text.json` + `pages.json` + `analysis.json` + `errors.json`

**Downstream Feeds:**
- Shot Hub: consumes scenes + characters + locations for beat/shot generation
- Schedule: consumes scenes + estimated durations for day planning
- Location Scouter: consumes scene location_text for intent generation
- Budget/Call Sheets: consumes props, VFX, safety notes for resource planning

---

### 3. Shot Hub (`/shot-list`) -- MAJOR FEATURE

| Aspect | Detail |
|--------|--------|
| **Current State** | Scene description textarea, AI-generated shot list (falls back to 5 mock shots), inline editing, quick-add buttons, 4 scene templates. |
| **Gaps** | Save and Export PDF non-functional. Duration estimation is rough. No connection to projects. No structured beat/shot breakdown. No lens/lighting intelligence. No Tamil/Tanglish support. No storyboard generation. |
| **Target** | Full "Shot Hub": script → scenes → beats → shots pipeline. Each shot has INT/EXT, DAY/NIGHT, location, characters, action beat, camera angle, lens, movement, lighting, duration estimate, storyboard frame. Staged pipeline: deterministic extraction → LLM semantic parsing → fill-null AI pass → validation. Tamil/Tanglish supported. See **N15** in Part 3 for the complete deep specification. |

**Core Principle:** Do NOT rely on "one LLM call that invents everything." Use a staged pipeline -- deterministic extraction where possible (scene headings, character cues, INT/EXT tags), LLM for semantic parsing (beats, emotions, implied blocking), a fill-null AI pass for missing fields grounded in extracted context, and a validation pass to prevent hallucinated cast/locations not in script.

**AI Enhancements (P0)**

| Enhancement | Implementation |
|-------------|---------------|
| Scene → Beats → Shots Pipeline | AIML API (GPT-4o) segments each scene into beats (micro-actions), then generates 2-8 shots per beat. Deterministic extraction handles INT/EXT, DAY/NIGHT, character cues. LLM handles emotional beats, implied blocking, pacing. Cached in Redis keyed by `shotgen:{scene_hash}:{style}:{version}`. Persisted to PostgreSQL `shots` table with per-field confidence scores. |
| Fill-Null AI Suggestions | For any shot field left null (camera angle, lens, lighting, duration), a second AIML API pass proposes suggestions grounded in scene context + director style + available camera kit. Suggestions stored in `shot_suggestions` table, auto-applied on user request. Cached in Redis `fillnull:{shot_hash}:{style}:{version}`. Guardrails: must use only known characters, must not invent locations not in script. |
| Director Style Matching | Style profiles for Mani Ratnam (elegant staging, motivated movement, longer takes, lyrical inserts), Vetrimaaran (grounded realism, handheld, natural lighting, raw staging), Lokesh Kanagaraj (stylized mass moments, kinetic camera, punchy inserts, dramatic lighting). Injected into LLM prompts and used for rule-based weighting on durations and camera choices. Custom style prompt supported. Stored in PostgreSQL `projects.director_style_preset`. |
| Lens & Lighting Engine | Deterministic rule templates applied first (INT/EXT + time_of_day + mood → base recommendations), then AIML API for nuance. Constrained to project's camera/lens kit (`projects.default_camera_pkg`, `projects.default_lenses`). Flags constraints: "night ext needs generator", "rain risk: protect lens." Outputs stored in shot fields. |
| Shot Duration Estimation | Base duration by shot type (establishing WS: 4-10s, dialogue MS/OTS: 3-7s per line, reaction CU: 1-3s, action handheld: 1-2.5s), then AIML API adjusts for genre, director style, emotional tone. Aggregated totals per scene + per day cached in Redis `durations:{scene_hash}:{style}:{version}`. |
| Storyboard Generation | P0: key shots only (1-3 per scene: establishing, major reveal, hero entry, climax beat). AIML API (Stable Diffusion XL or DALL-E 3) renders rough frames from shot JSON → storyboard prompt. Images stored in file storage. Linked via `storyboard_frames` table. Full storyboard is P1. |
| Tamil/Tanglish Character Aliasing | Character dictionary with canonical names + Tamil spelling variants + nicknames. Scene-character mapping with confidence scores. Prevents hallucination of unknown characters in shot generation. |
| Save + Export | Full project linkage: project → script → scene → shots. Inline edits persist to `shots` table. PDF export: per-scene or full project, with shot table (shot #, description, characters, camera, lens, lighting, duration, notes) + optional storyboard thumbnails. CSV/JSON export for scheduling/budgeting integration. |

**Pipeline Architecture**

```
Script Ingest → Scene Extraction (regex + AI fallback)
  → Entity Extraction (characters, props -- Tamil/Tanglish)
  → Beat Segmentation (LLM) → Shot Generation (LLM, 2-8 per beat)
  → Fill-Null Pass (grounded AI suggestions) → Duration Estimation
  → Lens & Lighting Recommendations → Storyboard (key shots)
  → Validation Gate → Persist + Cache → UI
```

**Data Model Additions (PostgreSQL)**

| Table | Key Columns |
|-------|------------|
| `projects` (extended) | language_profile (tamil/tanglish/mixed), director_style_preset, style_prompt_custom, default_camera_pkg (jsonb), default_lenses (jsonb) |
| `characters` | id, project_id, name_canonical, aliases_json (Tamil variants) |
| `scene_characters` | scene_id, character_id, confidence |
| `shots` | id, project_id, scene_id, shot_index, beat_index, shot_text, int_ext, time_of_day, location_id, characters_json, action_tags_json, emotion_tags_json, camera (jsonb: shot_size/angle/movement/framing_notes), lens (jsonb: focal_length_mm/lens_type/aperture), lighting (jsonb: key_style/color_temp/fixtures), duration_estimate_sec, confidence_json, generated_by (manual/ai) |
| `shot_suggestions` | shot_id, suggestion_type, suggestion_json, model_used, created_at |
| `storyboard_frames` | id, shot_id, image_ref (S3/R2), prompt_used, model_used |

**Redis Keys:**
- `shotgen:{scene_hash}:{style}:{version}` -- cached shots JSON
- `fillnull:{shot_hash}:{style}:{version}` -- cached field suggestions
- `durations:{scene_hash}:{style}:{version}` -- cached duration totals

**Integration Points:**
- Location Scouter: shots inherit scene location; special sub-locations override via `location_text`
- Schedule: shot durations roll up to scene runtime estimates; equipment/lighting needs inform day grouping
- Budget: lighting fixtures and equipment suggestions feed into rental cost calculations; night EXT → generator cost flags

---

### 4. AI Scheduling Engine (`/schedule`) -- MAJOR FEATURE

| Aspect | Detail |
|--------|--------|
| **Current State** | Calendar view (5-day grid) and List view. Day detail panel. Unassigned scenes panel. Stats row. All hardcoded demo data. |
| **Gaps** | Entirely hardcoded. Only 5 days. No drag-and-drop. No save. No real optimization. No weather/travel/cost awareness. |
| **Target** | Full constraint-aware scheduling engine. HYBRID approach: deterministic solver for correctness + AIML API for structuring messy constraints, proposing fixes when infeasible, and summarizing rationale. Prevents "LLM schedule that sounds good but breaks reality." See **N14** in Part 3 for the complete deep specification. |

**AI Enhancements (P0)**

| Enhancement | Implementation |
|-------------|---------------|
| Constraint-Based Optimization | HYBRID: AIML API (GPT-4o) normalizes messy constraints into strict JSON. TypeScript constraint solver (or OR-Tools via serverless) assigns scenes to days respecting cast availability, permits, day limits. Persists to PostgreSQL `shooting_days` + `day_scenes`. Redis pub/sub streams progress to UI. |
| Weather-Aware Scheduling | OpenWeatherMap API fetches forecast per (location, date). Cached in Redis (TTL 6h, key: `weather:{location_id}:{date}`). EXT scenes penalized/forbidden on rainy days depending on mode (weather_safe / balanced / fast). "Backup Rain Plan" auto-generates indoor-only fallback schedule. |
| Cast Conflict Resolution | Hard constraint: PostgreSQL `cast_availability` table enforces availability windows. When infeasible, AIML API (ConflictResolver role) proposes minimal scene swaps/date moves. Changes broadcast via Redis pub/sub `schedule_updates:{project_id}`. Tamil film industry union turnaround rules (12h minimum) enforced as hard constraints. |
| Travel & Logistics Feasibility | Travel matrix built via OSRM between all candidate locations. Cached in Redis (TTL 7-30 days). Day-to-day travel penalized in objective function. "Impossible same-day moves" flagged when multi-location day travel exceeds threshold. India-reality: accounts for actual road conditions, not straight-line distance. |
| Cost-Optimized Scheduling | Objective factors: cast daily rates, crew overtime (Tamil industry union rules), equipment rental windows, permit costs per location/time, travel cost per km. `cost_min` mode prioritizes lowest total cost. Highlights "cost spike" days in UI. |
| Schedule Versioning | Multiple schedule versions per project. Modes: fast / balanced / cost_min / travel_min / weather_safe. Lock specific scenes, days, or assignments. Compare versions side-by-side. |
| LLM Schedule Narrator | AIML API (GPT-4o, ScheduleNarrator role) generates human-readable summary: "why this schedule", major constraints, tradeoffs, risks + backup suggestions. Strictly grounded in computed metrics -- never hallucinated logistics claims. |

**Pipeline Architecture**

```
Optimize Click → Job Setup → Data Assembly → Travel Matrix (OSRM)
  → Weather Fetch (OpenWeatherMap) → Constraint Normalization (LLM)
  → Feasibility Pre-Check → Solver (CP-SAT/Greedy) → Repair Loop (LLM + Solver)
  → Post-Solve Validation → Persist (PostgreSQL) → Broadcast (Redis Pub/Sub)
```

**Core Engine Modules:**
DataAssembler, ConstraintNormalizer (LLM), TravelMatrixBuilder, WeatherCacheService, FeasibilityChecker, Optimizer (solver), ConflictResolver (LLM + solver repair), Persister, Broadcaster (Redis pub/sub)

**Data Model Additions (PostgreSQL)**

| Table | Key Columns |
|-------|------------|
| `scenes` (extended) | estimated_duration_min, required_cast (jsonb), required_equipment (jsonb), location_tags (jsonb), continuity_group_id, constraints (jsonb) |
| `cast_availability` | cast_id, date, available_from, available_to, status (available/booked/hold), booking_notes |
| `crew_constraints` | project_id, max_day_minutes, turnaround_minutes, overtime_rules (jsonb), break_rules (jsonb) |
| `equipment_rentals` | equipment_id, date_from, date_to, daily_cost, constraints_json |
| `shooting_days` | id, project_id, schedule_version_id, date, location_id, call_time, wrap_time, total_planned_minutes, objective_scores_json, risk_flags_json |
| `day_scenes` | shooting_day_id, scene_id, order_in_day, assigned_location_id, planned_start, planned_end, flags_json |
| `schedule_versions` | id, project_id, mode, locked_items_json, status (draft/final), summary_text, created_at |

**Redis Keys:**
- `weather:{location_id}:{date}` -- weather JSON, TTL 6h
- `travel:{from_id}:{to_id}` -- routing result, TTL 7-30 days
- `schedule_job:{job_id}` -- job status/progress, TTL 24h
- `schedule_updates:{project_id}` -- pub/sub channel for live UI updates

---

### 5. Timeline (`/timeline`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Wrapper around ProductionTimeline Gantt component. Quick action buttons (all non-functional). |
| **Gaps** | All quick actions are stubs. No auto-scheduling. No export. |

**AI Enhancements (P1)**

| Enhancement | Implementation |
|-------------|---------------|
| Auto-Milestone Detection | AIML API analyzes PostgreSQL production plan and auto-creates milestones. Persisted to a `milestones` table. |
| Delay Prediction | AIML API analyzes shooting pace from PostgreSQL `day_scenes` vs remaining scenes. Prediction cached in Redis. |
| Critical Path Analysis | AIML API identifies critical path tasks. Highlighted in the Gantt UI. |
| What-If Scenarios | AIML API recalculates timeline with modified constraints. Results ephemeral (Redis cache, not persisted). |

---

### 6. Location Scouter (`/locations`) -- MAJOR FEATURE

| Aspect | Detail |
|--------|--------|
| **Current State** | Basic location cards with Tamil names, type icon, permit status, add modal. No map. No geo intelligence. No script integration. |
| **Gaps** | No edit/delete. No map integration. Permit status not editable. Hardcoded project filter. No scouting workflow. No real location discovery. |
| **Target** | Full "Script-Aware Location Scouter" -- select a scene, AI extracts location intent, generates ranked shortlist of real scout-worthy places with map pins, access scores, risk flags, and India-reality logistics. See **N13** in Part 3 for the complete deep specification. |

**AI Enhancements (P0)**

| Enhancement | Implementation |
|-------------|---------------|
| Scene-to-Location Intent | AIML API (GPT-4o) reads scene heading + action text from PostgreSQL `scenes` table, extracts keywords, constraints, vibe tags. Generates a `LocationIntent` draft (region, theme tags, isolation level, crowd preference). Cached in Redis. |
| Candidate Generation | Next.js API route queries OSM (Overpass API, later PostGIS) for matching geo features (water bodies, roads, building clusters) within the region bbox. Sample candidate points along shorelines/road segments. Store raw candidates in PostgreSQL `candidates` table with `point_geom` (PostGIS). |
| Reality Scoring (India Mode) | Server Action computes 5 scores per candidate from OSM metrics (no hallucination): visual match (0-100), access (0-100), locality vibe (0-100), usability (0-100), crowd risk (0-100). Weighted final score. Risk flags: seasonal water, poor access, restricted area, encroachment. All stored in PostgreSQL `candidates.scores_json` + `flags_json`. |
| Enrichment | Reverse geocode via Nominatim (cached in Redis, TTL 30 days). Travel time via OSRM. Satellite preview tiles. AIML API generates "why it matches" explanation bullets strictly grounded in computed metrics. |
| Director Intent Editor | UI with region selector, keyword chips, toggles (quiet/crowded, isolated/locality, parking needed), sliders (drive-time max, crowd tolerance). Saves as `SceneLocationRequest` in PostgreSQL linked to `scene_id`. |
| Map + List Shortlist | Map with pins + water/road polygon overlays. Ranked list with score chips, risk flags, nearest address. Filters: access >= X, crowd <= Y, drive time <= Z. Actions: Add to Scout Plan, Export PDF, Open in Google Maps. |
| Scout Feedback Loop | After real scouting, capture: reachable Y/N, road condition, crowd level, visuals 1-5, permissions difficulty, photos + notes. Stored in PostgreSQL `scout_feedback`. Feedback reweights city-specific scoring thresholds. |
| Verified Locations Library | Confirmed locations promoted to curated `verified_locations` table. Tagged with genre vibe (romance/thriller/rural/urban), day/night suitability, permit contacts. Becomes the long-term competitive moat. |
| Permit Intelligence | AIML API estimates permit timelines by location type. Tracked in PostgreSQL with deadline alerts. |
| Location Photo Analysis | Upload scouting photos to file storage. AIML API (vision model) analyzes lighting, space, suitability. |

**Data Model Additions (PostgreSQL + PostGIS)**

| Table | Key Columns |
|-------|------------|
| `regions` | id, name, bbox, polygon (PostGIS geometry), created_at |
| `location_intents` | id, scene_id, region_id, theme_tags[], constraints_json, preferences_json, weights_json |
| `candidates` | id, region_id, water_feature_id, point_geom (PostGIS), metrics_json, scores_json, flags_json |
| `candidate_enrichments` | candidate_id, address_json, routing_json, preview_assets_json, explanation_text |
| `scout_feedback` | candidate_id, reachable, road_condition, crowd_level, visuals_rating, permissions_difficulty, notes, photos_refs |
| `verified_locations` | id, candidate_id, genre_tags[], curated_notes, best_use_cases, permit_contacts |
| `scout_plans` | id, project_id, date, candidates[] (ordered), meeting_point, notes |

---

### 7. Equipment (`/equipment`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Stats, search, category filters, equipment cards. |
| **Gaps** | No API, pure demo data. No add/edit/delete. No rental tracking. |

**AI Enhancements (P1)**

| Enhancement | Implementation |
|-------------|---------------|
| Auto-Generate Equipment List | AIML API reads shot list + scenes from PostgreSQL to generate equipment needs. Persist to PostgreSQL equipment table. |
| Rental Cost Optimizer | AIML API compares vendor pricing. Vendor data in PostgreSQL. |
| Equipment-Scene Matching | Server Action joins PostgreSQL `day_scenes` with equipment. AIML API flags gaps. |
| Maintenance Prediction | Track usage days in PostgreSQL. Alert when approaching maintenance windows. |

---

### 8. Collaboration (`/collaboration`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Team member cards with avatar, role, status, skill tags. |
| **Gaps** | No real messaging. No actual collaboration. All static. |

**AI Enhancements (P1)**

| Enhancement | Implementation |
|-------------|---------------|
| Smart Task Assignment | AIML API matches tasks to team members from PostgreSQL skill/workload data. |
| Workload Balancing | PostgreSQL query for task distribution. AIML API suggests redistribution. Redis pub/sub for real-time updates. |
| Meeting Summarizer | AIML API (Whisper for transcription + GPT-4o for summary). Store in PostgreSQL. |
| Conflict Detection | PostgreSQL cross-project crew queries. AIML API flags conflicts. |

---

### 9. Progress (`/progress`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Progress bars, phase cards, deadlines, task list, milestone timeline, analytics. |
| **Gaps** | All hardcoded mock. Kanban not implemented. Can't interact with tasks. |

**AI Enhancements (P1)**

| Enhancement | Implementation |
|-------------|---------------|
| Completion Prediction | AIML API analyzes PostgreSQL pace data. Prediction cached in Redis. |
| Bottleneck Detection | AIML API identifies slow phases/departments from PostgreSQL data. |
| Auto Progress Tracking | Server Actions compute progress from PostgreSQL (scenes completed, budget spent, schedule adherence). No manual updates needed. |
| Daily Status Reports | AIML API generates end-of-day reports from PostgreSQL data. Cached in Redis. Sent via notifications. |

---

### 10. Day Out of Days (`/dood`)

| Aspect | Detail |
|--------|--------|
| **Current State** | DOOD table with character calendar grid, shooting schedule markers. |
| **Gaps** | Export non-functional. Can't edit availability. No schedule integration. |

**AI Enhancements (P1)**

| Enhancement | Implementation |
|-------------|---------------|
| Auto-Generate from Script | AIML API parses script (from PostgreSQL) for character-scene appearances. Cross-references with `shooting_days` table. |
| Cast Availability Optimization | Actor windows stored in PostgreSQL. AIML API finds optimal schedule. |
| Cost Impact Analysis | Join PostgreSQL `crew` (daily rates) with `shooting_days`. AIML API calculates impact of changes. |
| Wrap Day Prediction | AIML API predicts last day per actor from schedule data. |

---

### 11. Budget (`/budget`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Summary cards, category breakdown, expense table, add expense modal. |
| **Gaps** | No persistence (local state). No editing/deletion. No charts. No approvals. |

**AI Enhancements (P0)**

| Enhancement | Implementation |
|-------------|---------------|
| Predictive Budget Forecasting | AIML API projects spend at completion from PostgreSQL `budget_items` burn rate. Cache in Redis. |
| Cost Anomaly Detection | AIML API flags expenses above PostgreSQL category benchmarks. |
| Regional Cost Benchmarks | AIML API compares against industry data. Benchmarks cached in Redis (long TTL). |
| Budget Reallocation Suggestions | AIML API suggests cuts with least impact when a category is over-budget. |
| Invoice Verification | Upload invoices to file storage. AIML API (vision model) cross-checks against PostgreSQL contracted rates. |

---

### 12. Crew (`/crew`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Crew cards with department filters, search, action buttons. |
| **Gaps** | Can't add/edit/remove. Action buttons non-functional. |

**AI Enhancements (P1)**

| Enhancement | Implementation |
|-------------|---------------|
| Crew Recommendation | AIML API recommends crew composition from PostgreSQL project requirements. |
| Skill Matching | AIML API matches scene requirements against PostgreSQL crew skills. |
| Availability Calendar | PostgreSQL cross-project crew queries. Redis cache for fast lookups. |
| Cost Optimization | AIML API suggests cost-effective crew combinations from PostgreSQL data. |

---

### 13. Call Sheets (`/call-sheets`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Print-ready preview with crew calls table. |
| **Gaps** | Action buttons non-functional. Static crew calls. No schedule/crew integration. |

**AI Enhancements (P0)**

| Enhancement | Implementation |
|-------------|---------------|
| Auto-Generate from Schedule | Server Action joins PostgreSQL `shooting_days` + `crew` + `locations`. AIML API formats into call sheet. Store in PostgreSQL `call_sheets` (JSONB content column). |
| Bilingual Output | AIML API generates Tamil + English versions. Both stored in PostgreSQL. |
| Smart Call Times | AIML API calculates staggered department call times from scene requirements. |
| WhatsApp Distribution | Send via WhatsApp Business API. AIML API personalizes per recipient. Delivery status tracked in PostgreSQL. |
| Weather Integration | Redis-cached weather data embedded. AIML API adds contingency notes. |

---

### 14. Reports (`/reports`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Three-tab wrapper for report components. |
| **Gaps** | Thin wrapper. No direct reporting. |

**AI Enhancements (P1)**

| Enhancement | Implementation |
|-------------|---------------|
| Natural Language Reports | AIML API (GPT-4o) generates prose reports from PostgreSQL data. Cached in Redis. |
| Executive Summary | AIML API generates one-page summary. Exportable as PDF. |
| Comparative Analysis | Server Action compares PostgreSQL actuals vs plan. AIML API highlights deviations. |
| Custom Report Builder | User describes report in natural language. AIML API generates SQL query, fetches from PostgreSQL, formats results. |

---

### 15. Exports (`/exports`)

| Aspect | Detail |
|--------|--------|
| **Current State** | ExportPanel wrapper with format info cards. |
| **Gaps** | Mock text instead of real documents. |

**AI Enhancements (P2)**

| Enhancement | Implementation |
|-------------|---------------|
| Smart PDF Generation | Server-side PDF generation (jsPDF or Puppeteer) from PostgreSQL data. AIML API for formatting decisions. Store in file storage. |
| Context-Aware Exports | AIML API tailors export content by recipient role (from PostgreSQL user roles). |
| Multi-Format Batch Export | Server Action generates ZIP with PDF schedule, Excel budget, ICS calendar from PostgreSQL. |

---

### 16. AI Tools (`/ai-tools`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Script text input, 6 AI feature cards, raw JSON results. |
| **Gaps** | Raw JSON output. Hardcoded metadata. No history. Stats are fake. |

**AI Enhancements (P0)**

| Enhancement | Implementation |
|-------------|---------------|
| Real AI via AIML API | All 6 tools call AIML API with real prompts. Results stored in PostgreSQL `ai_analyses` table. Cached in Redis. |
| Formatted Result UIs | Replace JSON with dedicated views: scene cards, Gantt charts, budget breakdowns. |
| Analysis History | PostgreSQL `ai_analyses` table with timestamps. Compare across script versions. |
| Multi-Model Comparison | Run same analysis on GPT-4o and Claude 3.5 via AIML API. Display side-by-side. |
| Tamil-Specific Analysis | Custom prompts for Tamil cinema: song sequences, comedy tracks, interval block, sentiment placement. |

---

### 17. Notifications (`/notifications`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Send/History/Templates tabs. WhatsApp/Email toggle. |
| **Gaps** | No real sending. Template variables not interpolated. Recipients hardcoded. |

**AI Enhancements (P1)**

| Enhancement | Implementation |
|-------------|---------------|
| Smart Notification Timing | AIML API determines optimal send time. Scheduled via Redis queue. |
| Message Personalization | AIML API personalizes per recipient using PostgreSQL crew data. |
| Priority Classification | AIML API classifies urgency. Routes: urgent = WhatsApp, normal = email. |
| Auto-Notifications | Redis pub/sub triggers on data changes. AIML API generates message. |
| Bilingual Messages | AIML API generates Tamil + English based on PostgreSQL user language preference. |

---

### 18. Weather (`/weather`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Location filter, 7-day forecast cards. |
| **Gaps** | Weather data is randomly generated. No real API. |

**AI Enhancements (P1)**

| Enhancement | Implementation |
|-------------|---------------|
| Real Weather API | Fetch from OpenWeatherMap. Cache in Redis (TTL 6 hours). |
| Shooting Day Recommendations | AIML API cross-references Redis weather cache with PostgreSQL schedule. |
| Rain Contingency Planning | AIML API auto-suggests indoor alternatives from PostgreSQL scene list. |
| Historical Weather Patterns | Store historical data in PostgreSQL. AIML API analyzes for long-range planning. |

---

### 19. Settings (`/settings`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Language, Tamil OCR, AI model, theme, notification toggles. |
| **Gaps** | Nothing persists. Theme doesn't change. AI model selection doesn't work. |

**AI Enhancements (P2)**

| Enhancement | Implementation |
|-------------|---------------|
| Working AI Model Selection | Store preference in PostgreSQL. Route AIML API calls to selected model per feature. |
| Usage Dashboard | Track AIML API calls in PostgreSQL. Show cost/token breakdown per feature. |
| Preference Learning | AIML API learns from PostgreSQL usage patterns. Adjusts defaults. |

---

### 20. Mission Control (`/mission-control`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Live ticker, health gauge, budget burn chart, risk alerts, department health. Impressive glass-card UI. |
| **Gaps** | 100% fake data. All buttons non-functional. |

**AI Enhancements (P0)**

| Enhancement | Implementation |
|-------------|---------------|
| Real-Time Production Intelligence | Server Actions compute health scores from PostgreSQL data. Redis pub/sub for live updates. |
| AI Live Ticker | AIML API generates status updates from PostgreSQL events. Pushed via Redis pub/sub. |
| Predictive Risk Alerts | AIML API monitors PostgreSQL data, generates risk alerts with severity. |
| Voice Briefing | AIML API (text-to-speech model) generates audio from production status. |

---

### 21. Project Detail (`/projects/[id]`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Project header, stats, 4-tab layout (Scenes, Locations, Cast, Crew). |
| **Gaps** | Character data has no API. No editing. PDF export broken. |

**AI Enhancements (P1)**

| Enhancement | Implementation |
|-------------|---------------|
| Project Health Score | AIML API computes score from PostgreSQL schedule/budget/crew data. Cached in Redis. |
| Risk Assessment | AIML API identifies top risks from PostgreSQL project data. |
| Project Comparison | AIML API compares against PostgreSQL historical project data. |
| Smart Recommendations | AIML API suggests next actions based on what's missing in PostgreSQL. |

---

### 22. Storyboard (Component only, no dedicated page)

| Aspect | Detail |
|--------|--------|
| **Current State** | Grid/timeline viewer for frames. Placeholder images. |
| **Gaps** | No image generation. No drag-and-drop. No dedicated route. |

**AI Enhancements (P1)**

| Enhancement | Implementation |
|-------------|---------------|
| AI Frame Generation | AIML API (Stable Diffusion XL or DALL-E 3) generates frames from scene descriptions. Images stored in file storage, references in PostgreSQL. |
| Scene-to-Storyboard Pipeline | AIML API reads scene + shot list from PostgreSQL, generates frame per shot. |
| Style Transfer | AIML API applies visual style via prompt engineering. |
| Animatic Generation | AIML API estimates timing. Server Action stitches frames into video. |

---

## Part 2: Critical Infrastructure

With Python removed, here is what needs to be built.

### I1. Next.js API Routes (P0)

| Item | Detail |
|------|--------|
| **What** | Build all API endpoints as Next.js Route Handlers in `/app/api/`. Server Actions for mutations. |
| **Structure** | `/app/api/projects/route.ts`, `/app/api/projects/[id]/route.ts`, `/app/api/projects/[id]/scenes/route.ts`, `/app/api/ai/analyze/route.ts`, etc. |
| **Why** | Single deployment. No CORS issues. Type-safe end-to-end with TypeScript. SSR data fetching with Server Components. |

### I2. PostgreSQL + ORM (P0)

| Item | Detail |
|------|--------|
| **What** | Set up PostgreSQL with Prisma or Drizzle ORM. Migrate existing `database/schema.sql` to ORM schema. |
| **Tables** | users, projects, scripts, scenes, scene_elements, characters, locations, shooting_days, day_scenes, budget_items, crew, call_sheets, invoices, ai_analyses (14 tables already defined). |
| **Why** | Type-safe queries. Migrations. Relations. Multi-user support. |

### I3. Redis Integration (P0)

| Item | Detail |
|------|--------|
| **What** | Set up Redis (Upstash for serverless or self-hosted). Use for: AI response caching (TTL-based), session management, rate limiting, real-time pub/sub. |
| **Key patterns** | `ai:analysis:{scriptHash}` (cache AI results), `weather:{location}:{date}` (cache weather), `session:{userId}` (auth sessions), `ratelimit:{userId}:ai` (throttle AI calls). |
| **Why** | AI calls are expensive. Caching prevents redundant API spend. Pub/sub enables real-time collaboration. |

### I4. AIML API Integration (P0)

| Item | Detail |
|------|--------|
| **What** | Create a unified AI service module (`lib/aiml.ts`) that wraps AIML API calls. Support model selection per feature. Handle retries, timeouts, streaming. |
| **Models to use** | GPT-4o (script analysis, complex reasoning), Claude 3.5 Sonnet (long scripts, detailed analysis), Llama 3.1 (simple tasks, cost savings), Stable Diffusion XL (storyboards, posters), Whisper (meeting transcription). |
| **Why** | Single API key. Model flexibility. Cost optimization by routing simple tasks to cheaper models. |

### I5. Unify Frontend API Client (P0)

| Item | Detail |
|------|--------|
| **What** | Replace the 2 competing API client files + 3 phased API files with a single clean `lib/api.ts`. Use Next.js native `fetch` with Server Components where possible. |
| **Approach** | Server Components fetch directly from PostgreSQL (via ORM). Client Components use Route Handlers. Eliminate the 7 duplicate AI client objects, 4 WhatsApp objects, etc. |

### I6. Authentication (P1)

| Item | Detail |
|------|--------|
| **What** | NextAuth.js or Clerk for auth. JWT sessions stored in Redis. Roles in PostgreSQL `users` table. |
| **Roles** | Producer (full access), Director (creative features), Line Producer (budget/schedule), Department Head (their department). |

### I7. Standardize UI Theme (P1)

| Item | Detail |
|------|--------|
| **What** | Standardize on dark theme. Consolidate `components/ui.tsx` and `app/components/ui/ProfessionalCard.tsx` into single UI library. Fix light-mode components in `app/components/`. |

### I8. File Storage (P1)

| Item | Detail |
|------|--------|
| **What** | Set up Vercel Blob, AWS S3, or Cloudflare R2 for script uploads, storyboard images, location photos, generated PDFs. |
| **Why** | Scripts and images can't live in PostgreSQL. Need durable, CDN-backed storage. |

---

## Part 3: New Feature Suggestions

Features that don't exist yet but would make CinePilot the definitive South Indian cinema pre-production platform.

### N1. Tamil Script OCR (P0)

| Aspect | Detail |
|--------|--------|
| **What** | Upload photographs or scans of handwritten/printed Tamil scripts. AI converts them to editable digital text. |
| **Why** | Many Tamil screenwriters still write on paper or in non-digital formats. |
| **AI** | AIML API (Google Vision model or dedicated OCR model) + GPT-4o for post-processing OCR errors and formatting into screenplay structure. |
| **Data** | OCR'd text stored in PostgreSQL `scripts` table. Original images in file storage. |

### N2. AI Production Assistant Chatbot (P0)

| Aspect | Detail |
|--------|--------|
| **What** | Conversational AI assistant embedded in CinePilot. "When is the last shooting day at Marina Beach?", "What's our remaining budget for camera equipment?" |
| **Why** | Production coordinators spend hours looking up information across pages. |
| **AI** | AIML API (GPT-4o) with RAG over PostgreSQL project data. Context retrieved via SQL queries, fed to AI. Redis caches frequent queries. |
| **Integration** | Floating chat widget on every page. Keyboard shortcut to activate. |

### N3. Dialogue Coach (P1)

| Aspect | Detail |
|--------|--------|
| **What** | AI pronunciation guide for non-Tamil actors. Phonetic guides and audio samples. |
| **AI** | AIML API (TTS model for audio, GPT-4o for phonetic transliteration). |
| **Data** | Dialogue text from PostgreSQL. Generated audio in file storage. |

### N4. Music & BGM Placement (P1)

| Aspect | Detail |
|--------|--------|
| **What** | AI suggests optimal points for songs, BGM cues, and re-recording marks based on emotional arc. |
| **AI** | AIML API (GPT-4o) analyzes emotional arc from PostgreSQL scene data. Cue points cached in Redis. |
| **Integration** | Visual overlay on timeline showing music cue points. |

### N5. CBFC Certification Predictor (P1)

| Aspect | Detail |
|--------|--------|
| **What** | AI predicts U/U-A/A rating. Flags problematic scenes/dialogues. |
| **AI** | AIML API (GPT-4o or Claude 3.5) content analysis against CBFC guidelines. |
| **Data** | Predictions stored in PostgreSQL `ai_analyses` table. |

### N6. Dubbing Script Generator (P1)

| Aspect | Detail |
|--------|--------|
| **What** | Auto-generate dubbed scripts for Telugu/Hindi/Malayalam/Kannada with lip-sync awareness. |
| **AI** | AIML API (GPT-4o) for translation with cultural adaptation and syllable-count matching. |
| **Data** | Dubbed scripts stored in PostgreSQL `scripts` table with language field. |

### N7. Continuity Tracker (P1)

| Aspect | Detail |
|--------|--------|
| **What** | AI checks continuity across scenes: wardrobe, props, time-of-day, location details. |
| **AI** | AIML API (Claude 3.5 for long-context analysis) cross-references PostgreSQL scene data. |
| **Data** | Continuity warnings stored in PostgreSQL. Displayed on schedule page per shooting day. |

### N8. VFX Breakdown & Vendor Matching (P1)

| Aspect | Detail |
|--------|--------|
| **What** | Auto-detect VFX scenes, estimate complexity/cost, match with vendors. |
| **AI** | AIML API scene analysis. Vendor database in PostgreSQL. |
| **Data** | VFX requirements linked to PostgreSQL `scenes` table. |

### N9. Regional Release Planner (P2)

| Aspect | Detail |
|--------|--------|
| **What** | Optimize release across South Indian states and OTT platforms. Festival calendar alignment. |
| **AI** | AIML API analyzes competition, festivals, demographics. |

### N10. Production Accounting (P2)

| Aspect | Detail |
|--------|--------|
| **What** | GST-compliant invoicing, petty cash, Section 80IB tax benefits. |
| **AI** | AIML API auto-categorizes expenses. Calculations in Server Actions against PostgreSQL. |

### N11. Crowd & Extra Management (P2)

| Aspect | Detail |
|--------|--------|
| **What** | AI crowd scene planning: extra counts, costumes, feeding, choreography. |
| **AI** | AIML API estimates from scene descriptions in PostgreSQL. |

### N12. Poster & First Look Generator (P2)

| Aspect | Detail |
|--------|--------|
| **What** | AI-generated poster concepts from script themes. |
| **AI** | AIML API (Stable Diffusion XL or DALL-E 3). Images in file storage, references in PostgreSQL. |

### N13. Script-Aware Location Scouter -- Full Specification (P0)

This is CinePilot's signature feature. A director selects a scene, the system extracts location intent, and generates a ranked shortlist of real, scout-worthy locations with India-reality logistics.

#### User Flow

```
Script Upload → Scene Extraction → Select Scene → Auto-Generate Location Intent
    → Director Edits Intent → Candidate Generation (OSM/PostGIS)
    → Reality Scoring → Enrichment → Shortlist UI (Map + List)
    → Scout Plan Export → On-Site Feedback → Verified Locations Library
```

#### Pipeline Stages

**Stage 0: Script Ingest + Scene Extraction**

| Item | Detail |
|------|--------|
| Input | Script file (PDF/DOCX/TXT) uploaded to file storage |
| Method | Deterministic regex for scene headings: `^(INT\|EXT\|INT/EXT)\. .+ - (DAY\|NIGHT\|SUNSET\|MORNING)?$`. Fallback to AIML API (GPT-4o) only for non-standard formats. |
| Output | `scenes[]` in PostgreSQL: scene_id, scene_number, heading_raw, int_ext, primary_place_text, time_of_day, extracted_props (weather, action type, crowd level), dialogue/action snippets |
| UI | Searchable scene list with filters: INT/EXT, time of day, location text |

**Stage 1: Scene to Intent Auto-Generation**

| Item | Detail |
|------|--------|
| Input | Selected scene + project defaults (base city, preferred region) |
| Output | `LocationIntent` draft |
| Logic | If heading contains city name (e.g., "MADURAI"), set region_query. Else default to project base city or last-used region. Extract keywords from primary_place_text ("LAKESIDE ROAD" -> lakeside, road). Light extraction from action lines ("near water", "small lane", "crowd"). Convert to theme_tags. |
| INT handling | For interiors: recommend real buildings (if public), studio/sets, or rentable properties. Still use geo search for "building types near region" but different scoring. |
| AI | AIML API (GPT-4o) assists keyword extraction when regex is insufficient. Result cached in Redis keyed by scene hash. |

**Stage 2: Director Edits Intent (Human-in-the-Loop)**

| UI Element | Detail |
|-----------|--------|
| Region selector | City/locality dropdown or free text. Geocoded to bbox/polygon via Nominatim. |
| Keyword chips | Add/remove tags: lakeside, road, residential, temple, market, field, etc. |
| Toggles | quiet/crowded, isolated/locality vibe, parking needed, open ground needed, road must be drivable |
| Sliders | Drive-time max (minutes), crowd tolerance (low/med/high), isolation target (low/med/high) |
| Weight overrides | Optional: weight_visual, weight_access, weight_locality, weight_usability, weight_crowd_risk |
| Save | Persisted as `location_intents` row in PostgreSQL linked to scene_id |

**Stage 3: Candidate Generation (EXT Scenes)**

| Step | Detail |
|------|--------|
| Data source | OSM vectors via Overpass API (MVP) or PostGIS + osm2pgsql (scale). Redis cache all Overpass responses (TTL 7-30 days). |
| Water discovery | Query: natural=water, water=lake/pond/reservoir, waterway=riverbank, man_made=reservoir within region_bbox. Return polygons + tags + names. |
| Shoreline sampling | Compute shoreline boundary per water polygon. Sample candidate points every 50-100m along shoreline. Each point = potential scout vantage. |
| Locality gating | Per candidate, count buildings within 300-700m radius. Keep points in target band (e.g., 10-250 buildings for locality vibe). Filter out zero buildings (unreachable) and extremely dense (too busy). |
| Access gating | Check distance to nearest drivable road (highway class: primary/secondary/tertiary/unclassified/residential/service). Exclude path/footway. Keep if nearest_drivable_road <= 500m. |
| Road stretch | Find tertiary/residential roads. Segment into 200-500m chunks. Compute building density around segment. |
| Residential locality | Detect residential landuse + building clusters. Choose edges where streets present and density matches target. |
| Output | `candidate_points[]` with basic metrics stored in PostgreSQL `candidates` table |

**Stage 4: Reality Scoring (India-Proof Ranking)**

| Score | What It Measures | Proxy Features |
|-------|-----------------|----------------|
| Visual Match (0-100) | How well it fits the creative prompt | Near water (mandatory for lakeside), shoreline openness, landuse=grass/park nearby, locality presence |
| Access (0-100) | Logistics reality for crew vehicles | dist_to_drivable_road_m, road_class_weight, connectivity (not a dead-end), OSRM routing success |
| Locality (0-100) | "Feels like a locality" without chaos | Building density bell curve, residential landuse presence, small shops/temples nearby |
| Usability (0-100) | Practical film crew needs | Open ground/parking nearby, space for equipment staging, distance to base/hotel |
| Crowd Risk (0-100) | Risk of unwanted crowds (higher = worse) | POI counts: place_of_worship, school, market, bus_stop, stadium. High road class = traffic |

**Risk Flags (boolean per candidate):**
- `seasonal_water_possible`: water tag suggests tank/pond + region known for dry seasons
- `waterlogging_marsh`: wetland tags present near point
- `poor_access_likely`: road distance > threshold or dead-end track
- `high_crowd_pois`: temple/school/market cluster nearby
- `restricted_area_hint`: military/industrial OSM tags nearby
- `encroachment_hint`: dense informal buildings right on shoreline edge

**Final Rank Score:**
```
final = w1*visual + w2*access + w3*usability + w4*locality - w5*crowd_risk
```
Default weights: 0.30, 0.25, 0.20, 0.15, 0.10. Prompt-based reweighting: "quiet" increases crowd penalty, "locality" increases locality weight, "remote" allows lower locality.

**Stage 5: Enrichment (Top 20 Candidates)**

| Step | Detail |
|------|--------|
| Reverse geocode | Nominatim -> nearest address, locality name, landmark. Cached in Redis (TTL 30 days). |
| Travel time | OSRM (self-hosted) route from user-selected base (hotel/production office). Distance + time. Fallback: Haversine + road proximity. |
| Preview assets | Satellite tile snapshot for UI. Street imagery links (KartaView/OpenStreetCam where available). Store preview bbox. |
| Explanation bullets | AIML API generates "why it matches" strictly from computed metrics. Example: "Lakeside edge with open ground within 150m. Residential streets nearby (locality vibe), but no major highways. Drive access via tertiary road; parking likely near park area." Never hallucinate landmarks. |
| Output | Enriched candidates stored in PostgreSQL `candidate_enrichments` table |

**Stage 6: UI Deliverables**

| Element | Detail |
|---------|--------|
| Layout | Left: ranked list with score chips (Visual, Access, Crowd, Usability). Right: map with pins + water polygon overlay + road overlay. |
| Filters | access >= X, crowd <= Y, drive time <= Z, locality vibe low/med/high, "seasonal risk off" toggle |
| Location card | Name + address + pin. Score breakdown bar. Flags (seasonal water, crowd, access). Quick actions: Add to Scout Plan, Export PDF, Open in Google Maps, Mark confirmed/rejected. |
| Scout Plan export | Day plan ordered by route optimization (nearest-neighbour). Include: meeting point, ETA per stop, checklist, notes field. Export as PDF/CSV. |

**Stage 7: Feedback Loop**

| Step | Detail |
|------|--------|
| On-site capture | Per candidate: reachable Y/N, road condition (good/ok/bad), crowd (low/med/high), visuals match 1-5, permissions difficulty (easy/med/hard), photos + notes. |
| Scoring improvement | Reweight access/locality thresholds per city. Learn "bad patterns" (tanks dry in summer). Build city-specific priors. |
| Verified Locations | Confirmed candidates promoted to `verified_locations` table. Tagged with: genre vibe (romance/thriller/rural/urban), day/night suitability, permit contacts. |

**India Uncertainty Guardrails:**
- Always display "Access confidence" and "Data confidence" levels
- Never state road condition as fact unless confirmed by scout feedback
- Output is a shortlist for scouting, not guaranteed shoot-ready locations
- Provide "Scout Checklist" and "Red Flags" to prevent wasted trips
- If reverse geocode fails, display coordinates + nearest admin area (never hallucinate landmarks)

**MVP Scope:**
- Start with EXT scenes and these intents: lakeside, road stretch, residential locality, open ground/field, market street, temple vicinity
- Overpass API for geo data, Nominatim for geocoding, OSRM for routing (all cached in Redis)
- Simple scoring + map UI with pins
- Manual feedback marking
- Later: PostGIS + osm2pgsql, self-hosted OSRM/Nominatim, imagery-based classifiers, shot suitability presets

### N14. AI Scheduling Engine -- Full Specification (P0)

CinePilot's constraint-aware, India-reality scheduling engine. Replaces demo data with a real optimization pipeline that respects Tamil film industry realities: union rules, monsoon seasons, festival calendars, permit windows, and logistics constraints that generic tools ignore.

#### Critical Design Principle

**HYBRID approach** -- deterministic optimization handles correctness and feasibility; AI/LLM structures messy constraints, proposes alternatives when infeasible, and summarizes rationale. This prevents "LLM schedule that sounds good but breaks reality."

#### Pipeline Flow

```
User clicks "Optimize" → Job Setup (PostgreSQL + Redis)
  → Stage 1: Data Assembly (scenes, cast, locations, equipment, costs)
  → Stage 2: Travel Matrix (OSRM, cached in Redis)
  → Stage 3: Weather Fetch (OpenWeatherMap, cached in Redis)
  → Stage 4: Constraint Normalization (AIML API GPT-4o → strict JSON)
  → Stage 5: Feasibility Pre-Check (hard fail detection)
  → Stage 6: Solver (constraint programming / greedy + local search)
  → Stage 7: Repair Loop (LLM ConflictResolver + solver re-run)
  → Stage 8: Post-Solve Validation (quality gate)
  → Stage 9: Persist (PostgreSQL shooting_days + day_scenes)
  → Stage 10: Broadcast (Redis pub/sub → UI)
```

#### API Contracts

**POST `/api/schedule/optimize`**

```json
{
  "project_id": "uuid",
  "date_range": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
  "mode": "balanced | fast | cost_min | travel_min | weather_safe",
  "base_location_id": "uuid (production office/hotel)",
  "locks": {
    "locked_days": ["YYYY-MM-DD"],
    "locked_scenes": ["scene_id"],
    "locked_assignments": [
      { "scene_id": "...", "date": "YYYY-MM-DD", "location_id": "..." }
    ]
  },
  "preferences": {
    "max_day_minutes": 600,
    "weather_risk_tolerance": "low | med | high",
    "minimize_overtime_weight": 0.6,
    "minimize_travel_weight": 0.7,
    "cluster_by_location_weight": 0.8,
    "continuity_weight": 0.5
  }
}
```
Response: `{ "job_id": "...", "status": "queued" }`

**GET `/api/schedule/job/{job_id}`**
Response: `{ "status": "running|done|failed", "progress": 0-100, "stage": "...", "preview": {...} }`

**GET `/api/schedule/version/{schedule_version_id}`**
Response: full schedule payload for UI rendering

#### Pipeline Stages -- Detail

**Stage 1: Data Assembly (Deterministic)**

| Step | Detail |
|------|--------|
| Fetch | Scenes (unassigned + all), scene_location_candidates, locations (with permits), cast + cast_availability, crew_constraints, equipment_rentals, existing schedule (if re-optimizing), locks |
| Normalize | Every scene must have: estimated_duration_min, cast list, INT/EXT, at least 1 location candidate. Every location must have lat/lon. |
| Work units | P0: each scene is atomic. Later: allow splitting long scenes into sub-units. |

**Stage 2: Travel Matrix (Deterministic, OSRM)**

| Step | Detail |
|------|--------|
| Location set | All locations appearing as candidates + base_location_id |
| Compute | For each pair (A,B): check Redis `travel:{A}:{B}`. Miss → call OSRM. Cache result (TTL 7-30 days). |
| Output | `travel_time[A][B]` with duration_min and distance_km |
| India reality | Uses actual road graph via OSRM (not straight-line). Accounts for one-ways, restricted roads, bridge crossings. Self-host OSRM with India OSM extract for reliability. |

**Stage 3: Weather Fetch (OpenWeatherMap, cached)**

| Step | Detail |
|------|--------|
| Scope | Fetch for each (location, date) pair in candidate sets within date_range. P0 optimization: top N locations by candidate frequency only. |
| Normalize | Per day: precipitation_probability, precipitation_mm, wind_speed, temp_min/max |
| Cache | Redis key `weather:{location_id}:{date}`, TTL 6 hours |
| India specifics | Account for monsoon season (Jun-Sep in Tamil Nadu): auto-elevate weather risk for EXT scenes during monsoon months. Festival calendar awareness (Pongal, Deepavali, summer holidays) flagged as crowd/permit risk. |

**Stage 4: Constraint Normalization (LLM-Assisted)**

| Item | Detail |
|------|--------|
| Input to AIML API | Project constraints text, crew constraints (max hours, turnaround -- Tamil film union: 12h minimum turnaround), cast availability conflicts summary, permit window rules, weather policy per mode, lock list, soft preference weights |
| Output | Strict JSON with `hard_constraints` and `soft_constraints`. Schema-validated by backend -- reject any invalid/unknown fields. |
| Tamil industry rules | Tamil Film Producers Council (TFPC) regulations: shooting hour limits, mandatory breaks, child actor restrictions, night shoot permits. Auto-included as hard constraints. |

**Stage 5: Feasibility Pre-Check (Deterministic)**

| Check | Action on Fail |
|-------|---------------|
| Scene requires cast unavailable on ALL days | Hard fail → report to UI |
| EXT scene needs low rain but all days rainy | Warn → suggest backup indoor scenes or date extension |
| Permit windows exclude all dates for a location | Hard fail → suggest alternative locations from candidates |
| Locked scenes conflict with locked days or cast | Hard conflict → send to ConflictResolver |
| Total scene duration exceeds total available shoot minutes | Warn → suggest extending date range |

**Stage 6: Optimization Solve (Deterministic Solver)**

| Item | Detail |
|------|--------|
| Recommended | TypeScript constraint solver (e.g., `csp-solver` or custom backtracking + local search). For complex projects: OR-Tools CP-SAT via serverless Python function. |
| Decision variables | `assign_scene_day[s][d]` ∈ {0,1}, `assign_scene_location[s][l]` ∈ {0,1} (restricted to candidate set) |
| Hard constraints | (1) Each scene assigned exactly once. (2) Scene location from its candidates. (3) Cast availability enforced. (4) Day duration ≤ max + allowed overtime. (5) Permit windows enforced. (6) Weather thresholds for EXT (mode-dependent). (7) Locks respected. |
| Objective (minimize) | Travel time between consecutive days' locations, location changes, overtime cost, equipment rental spread, weather risk for EXT. |
| Objective (maximize) | Continuity group coherence, location clustering (same-location scenes on same day). |
| Weights | Mode-dependent: `cost_min` emphasizes cost, `travel_min` emphasizes logistics, `weather_safe` maximizes indoor/dry-day coverage, `balanced` uses default weights. |

**Stage 7: Repair Loop (LLM + Solver Iteration)**

| Scenario | Action |
|----------|--------|
| Solver returns infeasible | Extract conflict set. Send to AIML API ConflictResolver. LLM returns ranked actions: swap scenes, move dates, use alternative location, relax weather threshold, split high-duration day. Backend applies best fix (rule-based acceptance) and reruns solver. |
| Solver feasible but low quality | Run local search: swap days of two scenes, move a scene to cluster location, reduce travel peaks. Optionally ask LLM for improvement suggestions but only apply if constraints remain satisfied. |
| Max 3 repair iterations | Prevent infinite loops. After 3 attempts, return best-found schedule with warnings. |

**Stage 8: Post-Solve Validation (Quality Gate)**

| Validation | Detail |
|-----------|--------|
| Cast overlap | No cast member assigned to two locations on same day |
| Day duration | Within limit or overtime computed and flagged |
| Weather | EXT scenes on rainy days flagged per mode |
| Travel sanity | Day-to-day travel > threshold → "logistics risk" flag |
| Permits | All assignments within permit windows |
| Output | `violations[]` (must fix) + `warnings[]` (can proceed). If violations exist → repair loop or mark "draft: needs attention" |

**Stage 9: Persist (PostgreSQL)**

Write to `schedule_versions` (status=draft/final), `shooting_days` (one per date), `day_scenes` (scene assignments + order). Also persist:
- `objective_scores_json`: total cost estimate, total travel minutes, overtime minutes, weather risk score
- `risk_flags_json`: impossible move risk, weather backup needed, tight cast day
- `summary_text`: LLM-generated grounded explanation

**Stage 10: Broadcast (Redis Pub/Sub)**

Publish `final_schedule_ready` to `schedule_updates:{project_id}` with `schedule_version_id`. UI loads full schedule via GET endpoint. During pipeline, publish incremental events: `job_started`, `stage_progress`, `partial_schedule`, `conflicts_found`.

#### AI/LLM Roles (AIML API GPT-4o) -- Strict Boundaries

| Role | What It Does | What It Does NOT Do |
|------|-------------|-------------------|
| **ConstraintNormalizer** | Converts human rules + mode to strict constraints JSON. Output schema-validated. | Does not assign scenes. Does not decide schedule. |
| **ConflictResolver** | When solver returns infeasible, proposes minimal change set (ranked actions with reasons). Backend applies only allowed action types. | Does not override solver. Does not bypass hard constraints. |
| **ScheduleNarrator** | Produces human-readable summary: why this schedule, major constraints, tradeoffs, risks + backups. References computed metrics only. | Does not hallucinate logistics claims or road conditions. |

#### Output Payload (Frontend Contract)

```json
{
  "schedule_version_id": "uuid",
  "mode": "balanced",
  "objective": {
    "total_cost_estimate": 1850000,
    "total_travel_minutes": 980,
    "overtime_minutes": 120,
    "weather_risk_score": 0.22
  },
  "days": [
    {
      "date": "2026-04-15",
      "location_id": "uuid",
      "location_name": "Vaigai River Bank, Madurai",
      "travel_from_prev_day_min": 35,
      "weather_summary": { "rain_prob": 0.15, "rain_mm": 0.2, "wind": 12 },
      "day_minutes": 560,
      "overtime_minutes": 0,
      "warnings": ["tight_cast_day"],
      "scenes": [
        {
          "scene_id": "uuid",
          "scene_number": "12A",
          "order": 1,
          "duration_min": 45,
          "location_name": "Vaigai River Bank",
          "cast": ["Vikram", "Trisha"],
          "flags": {}
        }
      ]
    }
  ],
  "unassigned_scenes": [],
  "violations": [],
  "summary_text": "Schedule optimized for balanced cost and travel...",
  "backup_suggestions": ["Scenes 12A, 15B can move indoors if rain on Apr 15"]
}
```

#### UI Integration

| Element | Detail |
|---------|--------|
| Job progress | Visual pipeline: Data → Travel → Weather → Constraints → Solve → Validate → Save. Updates in real-time via Redis pub/sub. |
| Per day | Location, total minutes + overtime bar, weather chip (for outdoor scenes), travel from previous day, warning chips |
| Per scene | Cast required, location candidate selected, flags (weather risk, cast risk, travel risk) |
| User actions | Lock scene/day/assignment, regenerate with new weights/mode, generate backup rain plan, compare schedule versions, export schedule (PDF/CSV) |
| Mode selector | Dropdown: Fast (speed), Balanced (default), Cost Minimum, Travel Minimum, Weather Safe |

#### India-Specific Scheduling Intelligence

| Aspect | Detail |
|--------|--------|
| Tamil Film Union Rules | TFPC regulations auto-included: max 12h shoot days, 12h turnaround, mandatory meal breaks, child actor hour limits, night shoot restrictions |
| Monsoon Awareness | Jun-Sep in Tamil Nadu: auto-elevate weather risk for all EXT scenes, suggest indoor contingencies, flag outdoor locations as high-risk |
| Festival Calendar | Pongal (Jan), Tamil New Year (Apr), Deepavali (Oct-Nov), summer holidays: flag as crowd risk for public locations, permit difficulty spikes |
| Permit Reality | Government location permits (temples, heritage sites, public roads) often take 2-4 weeks. Auto-flag if permit window is tight. Thalaiver birthday, political events → public gatherings that disrupt outdoor shoots |
| Regional Logistics | Chennai vs Madurai vs Ooty → different road quality, travel reliability. Ghats/hill station shoots need buffer time. Weekend vs weekday traffic patterns in Chennai |

#### P0 Build Plan

| Week | Deliverables |
|------|-------------|
| Week 1 | DB tables (scenes extended, cast_availability, crew_constraints, equipment_rentals, shooting_days, day_scenes, schedule_versions) + seed data. `/api/schedule/optimize` job system + Redis pub/sub. Travel matrix (OSRM) + cache. Weather fetch + cache. Feasibility checks + warnings UI. |
| Week 2 | TypeScript constraint solver (greedy + local search for P0, CP-SAT via serverless later). Locks support. Persist to shooting_days + day_scenes. LLM ConstraintNormalizer + ScheduleNarrator integration. |
| Week 3 | Repair loop (infeasible → ConflictResolver → rerun). Cost optimization objective. "Backup rain schedule" generation. Schedule versioning + comparison. Polish UI: mode selector, progress visualization, export. |

### N15. Shot Hub -- Full Specification (P0)

CinePilot's structured shot breakdown engine. Ingests a full script (Tamil/Tanglish supported), auto-splits into Scenes → Beats → Shots, and provides per-shot camera, lens, lighting, and duration intelligence grounded in the actual script content.

#### Core Principle

**Staged pipeline, not a single LLM dump.** Deterministic extraction handles what's known (scene headings, INT/EXT, character cues). LLM handles what requires interpretation (beats, emotions, blocking). A fill-null pass handles what's missing. A validation gate enforces schema correctness and prevents hallucinated characters or locations.

#### Pipeline Stages -- Detail

**Stage 0: Script Ingest**

| Step | Detail |
|------|--------|
| Input | PDF/DOCX/TXT (Tamil/Tanglish/English) |
| Normalize | Preserve line breaks and scene headings. Normalize Unicode for Tamil text (NFC). Remove repeated spaces, preserve punctuation. |
| Hash | `script_hash = sha256(normalized_text)` for cache keys |
| Persist | `scripts` row created. Raw text stored in file storage or DB. |

**Stage 1: Scene Extraction (Deterministic + AI Fallback)**

| Step | Detail |
|------|--------|
| Deterministic | Regex matches scene headings: INT./EXT./INT/EXT variations in English/Tanglish, Tamil equivalents, "SCENE 12" style. Extracts int_ext, location_text, time_of_day. |
| AI fallback | Only when headings are messy/non-standard. AIML API (GPT-4o) reconstructs scene boundaries with strict output schema: scene_number, heading_raw, start_line/end_line. Backend validates non-overlapping, sequential boundaries. |
| Persist | `scenes` table in PostgreSQL |

**Stage 2: Entity Extraction -- Tamil/Tanglish Aware**

| Step | Detail |
|------|--------|
| Character dictionary | AIML API extracts candidate character names + aliases (Tamil/English forms, Tanglish spellings). Merged with user-edited list (director can correct). Persisted to `characters` table with `aliases_json`. |
| Scene-character mapping | Per scene: detect character mentions and dialogue blocks. Output `scene_characters` with confidence. Prevents later hallucination of unknown characters. |
| Props & vehicles | Optional: extract mentioned props, vehicles, special items into `scenes.extracted_entities_json`. Feeds equipment and budget modules. |

**Stage 3: Scene → Beats → Shots (Main Generation)**

| Step | Detail |
|------|--------|
| SceneContext payload | Scene heading + text, detected characters for scene, genre + tone (project-level), director style preset + camera/lens defaults, pacing constraints (slow/medium/fast) |
| Beat segmentation (LLM) | AIML API segments scene into beats. Each beat: beat_id, what changes (information/emotion/blocking), characters involved, suggested pacing. More stable than directly generating 40 shots. |
| Beat → Shots (LLM) | Per beat, generate 2-8 shots depending on pacing. Each shot has all fields but allows nulls. Hard rule: unknown values set to null + `ai_reason` for why it's missing. |
| Cache | Redis key: `shotgen:{scene_hash}:{director_style}:{prompt_version}` |
| Persist | Insert into `shots` table with `generated_by=ai` and `confidence_json` per field |

**Stage 4: Fill-Null Suggestions (Field Completion Pass)**

| Step | Detail |
|------|--------|
| Detect | Scan shot fields: camera shot_size, angle, movement, lens focal length, lighting style, duration -- any null? |
| LLM call | AIML API (GPT-4o) per shot. Input: shot_text + scene context + director style + camera/lens kit. Output: suggestions with confidence for camera, lens, lighting, duration. Multiple options ranked when uncertain. |
| Guardrails | Must use ONLY known characters list. Must not invent locations not in scene context. If uncertain, return alternatives ranked. |
| Cache | Redis key: `fillnull:{shot_hash}:{style}:{version}` |
| Persist | Stored separately in `shot_suggestions` table. Auto-applied to shot fields on user request via UI. |

**Stage 5: Duration Estimation**

| Step | Detail |
|------|--------|
| Base duration rules | Establishing WS: 4-10s. Dialogue coverage MS/OTS: 3-7s per line chunk. Reaction CU: 1-3s. Action handheld: 1-2.5s (faster cuts). |
| LLM adjustment | AIML API adjusts base using: genre (thriller faster, romance slower), director style (Mani Ratnam = slower composition, Lokesh = faster action beats), emotional tone (tension = tighter cuts, melancholy = longer). |
| Output | Per-shot `duration_estimate_sec`. Aggregated totals per scene and per shooting day. |
| Cache | Redis key: `durations:{scene_hash}:{style}:{version}` |

**Stage 6: Lens & Lighting Recommendation Engine**

| Step | Detail |
|------|--------|
| Inputs | INT/EXT + time of day, mood/emotion tags, available camera/lens kit (project settings), location type |
| Rule templates first | Deterministic: EXT DAY → available-light + soft key, INT NIGHT → practical-heavy + hard key, etc. |
| LLM nuance | AIML API refines based on emotional context, director style, specific scene requirements. |
| Lens constrained to kit | Recommendations reference project's `default_lenses`. E.g., "24mm for establishing", "50mm for intimacy", "85mm for isolation." |
| Constraint flags | "Night exterior needs larger fixtures/generator." "Rain risk: protect lens, diffusers." "Temple interior: no artificial lighting allowed." |

**Stage 7: Director Style Profiles**

| Preset | Profile |
|--------|---------|
| **Mani Ratnam** | Elegant staging, motivated movement, longer takes, classic coverage + lyrical inserts, warm color palette, natural-light preference |
| **Vetrimaaran** | Grounded realism, handheld, natural lighting, raw staging, longer observational beats, desaturated look, documentary feel |
| **Lokesh Kanagaraj** | Stylized mass moments, kinetic camera, punchy inserts, dramatic lighting, fast action grammar, high-contrast visuals |
| **Custom** | User provides `style_prompt_custom` text describing preferred visual language. LLM extracts style parameters and applies consistently. |

Style profile JSON injected into all LLM prompts and used for rule-based weighting on durations, camera choices, and lighting.

**Stage 8: Storyboard Generation (P0 Scope)**

| Step | Detail |
|------|--------|
| Key shot selection | AIML API labels shot "importance" score. Pick top 1-3 per scene: establishing, major reveal, hero entry, climax beat. |
| Prompt construction | Shot JSON → storyboard prompt: include location, time, shot size, angle, mood, characters (no faces for privacy). |
| Render | AIML API (Stable Diffusion XL or DALL-E 3) generates low-res "rough frame." |
| Store | Images in file storage (S3/R2). Linked via `storyboard_frames` table. |
| P1 expansion | Full storyboard for every shot. Style-consistent generation across scenes. |

**Stage 9: Save / Export / Project Linking**

| Feature | Detail |
|---------|--------|
| Save | Everything linked: project_id → script_id → scene_id → shots. Inline edits write to `shots` table. |
| PDF export | Per-scene or full project. Table: shot #, description, characters, camera, lens, lighting, duration, notes. Optional storyboard thumbnails. Scene headers with INT/EXT, time, location. |
| CSV/JSON export | For integration with scheduling, call sheets, budgeting. |
| Integration | Shots feed scene durations to Schedule Engine. Equipment/lighting needs feed Budget module. Location linkage from Location Scouter. |

#### AI Contracts (Strict JSON Schemas)

**BeatSegmentation Output:**
```json
{
  "beats": [
    {
      "beat_index": 1,
      "summary": "Kiran arrives at lakeside, notices something off.",
      "characters": ["KIRAN"],
      "tone": ["unease"],
      "pacing": "medium"
    }
  ]
}
```

**ShotList Output (per scene):**
```json
{
  "scene_id": "uuid",
  "shots": [
    {
      "shot_index": 1,
      "beat_index": 1,
      "shot_text": "Wide establishing of lakeside road with sparse houses.",
      "characters": ["KIRAN"],
      "camera": { "shot_size": "WS", "angle": null, "movement": "static" },
      "lens": { "focal_length_mm": null, "lens_type": null },
      "lighting": { "key_style": null, "color_temp": null },
      "duration_estimate_sec": null,
      "confidence": { "camera": 0.72, "lens": 0.35, "lighting": 0.30, "duration": 0.25 },
      "ai_reason_missing": {
        "lens": "Depends on kit; will fill in null pass.",
        "lighting": "Needs INT/EXT + time; will fill in null pass."
      }
    }
  ]
}
```

**FillNull Suggestions Output:**
```json
{
  "shot_id": "uuid",
  "suggestions": {
    "camera": [{ "shot_size": "WS", "angle": "eye", "movement": "static", "confidence": 0.8 }],
    "lens": [{ "focal_length_mm": 24, "lens_type": "prime", "confidence": 0.75 }],
    "lighting": [{ "key_style": "available-light + soft key", "confidence": 0.70 }],
    "duration": [{ "duration_estimate_sec": 6, "confidence": 0.68 }]
  },
  "alternatives": [],
  "notes": "Based on Mani Ratnam style: longer composition and motivated movement."
}
```

**Validation rules:** Backend schema-validates all LLM JSON output. Characters must be subset of known project characters. Locations must be subset of scene's location_text unless linked by Location Scouter. Reject and retry on invalid output.

#### UI Layout: Shot Hub Page

| Element | Detail |
|---------|--------|
| **Top bar** | Project selector, style preset dropdown (Mani/Vetri/Lokesh/Custom), "Regenerate" + "Fill Missing" + "Export PDF" buttons |
| **Left panel** | Scene list: filter by INT/EXT, location, character. Search by scene number/keywords. |
| **Main panel** | Editable shot table. Per row: shot # + beat label, description (editable), character chips (from dictionary), INT/EXT + Day/Night chips, location field, camera dropdowns (shot_size, angle, movement), lens dropdowns (constrained to kit), lighting dropdowns + fixture notes, duration (sec) + confidence indicator, "AI Suggest" button (fills nulls for row), "Storyboard" button, warning chips ("missing lens", "night ext lighting heavy", "duration low confidence") |
| **Right panel** | Shot Inspector: expanded view with AI reasoning, alternative options, style notes, storyboard preview |
| **Stats row** | Total shots, total estimated runtime, # missing fields, # storyboard frames generated |

#### India / Tamil Cinema Specifics

| Aspect | Detail |
|--------|--------|
| Tamil/Tanglish scripts | Unicode NFC normalization for Tamil text. Character name aliasing across Tamil and English spellings. Scene headings in Tamil supported alongside English. |
| Song sequences | Tamil cinema song sequences get special beat treatment: wider shots, choreography beats, playback lip-sync timing. Director style heavily influences song coverage. |
| Mass hero entries | Lokesh/commercial style: dedicated "hero introduction" beat with specific camera grammar (slow-mo, low angle, dramatic lighting). Auto-detected from character first-appearance + action cues. |
| Fight choreography | Action sequences auto-segmented into setup → exchange → climax beats with faster pacing multipliers. Stunt coordinator notes field. |
| Interval block | Tamil films have intermission. Shot Hub flags "interval scene" for pacing -- typically a cliffhanger or emotional peak requiring specific camera treatment. |

#### Model Strategy (Cost/Quality)

| Model | Used For |
|-------|---------|
| GPT-4o (AIML API) | Beat segmentation, shot generation, fill-null, style adaptation |
| Smaller/cheaper model | Optional: UI summary text |
| SDXL / DALL-E 3 (AIML API) | Storyboard key shots only |

Scene-hash-based caching prevents re-paying for identical scene generations.

#### P0 Build Plan

| Phase | Deliverables |
|-------|-------------|
| Phase 1 (1-2 weeks) | DB tables (projects extended, characters, scene_characters, shots, shot_suggestions, storyboard_frames). Link shot list to projects + persist. Scene-level shot generation (beats → shots) + Redis caching. Fill-null suggestions per shot. Duration estimation + totals. Director style preset injection. Save functional. |
| Phase 2 (2-4 days) | PDF export (per-scene + full project). CSV/JSON export. Basic storyboard for key shots. |
| Phase 3 (1 week) | Tamil character aliasing. Confidence + warnings UI. Batch regenerate per scene or filter. Key shot selection logic + storyboard queue. Shot Inspector panel. |

### N16. Script Parsing & AI Breakdown -- Full Specification (P0)

CinePilot's foundational pipeline. Every downstream module (Shot Hub, Schedule, Location Scouter, Budget, Call Sheets) depends on clean, structured script data. This is the entry point for all production intelligence.

#### Design Principles (Non-Negotiable)

1. **Never generate fake script text.** If extraction fails → explicit error + re-upload request.
2. **Separate text extraction (deterministic) from semantic breakdown (AI).**
3. **AI in stages** with strict JSON schemas + backend validation + grounding in source text.
4. **Traceability**: every extracted entity maps back to line/page ranges in the original script.
5. **Scalable**: chunking for long scripts, Redis caching by content_hash, version history first-class.

#### Storage Architecture

**File Storage (S3/R2/MinIO):**
```
scripts/{project_id}/{script_id}/{version_id}/
  ├── original.{pdf|docx|fdx|txt}
  ├── text.json          (extracted text + blocks)
  ├── pages.json         (page metadata)
  ├── analysis.json      (breakdown results)
  └── errors.json        (extraction/analysis errors)
```

#### Pipeline Stages -- Detail

**Stage 0: Upload & Create Script Version**

| Step | Detail |
|------|--------|
| Upload | User uploads PDF/DOCX/FDX/TXT via drag-and-drop |
| Backend | Create `scripts` row (if new). Create `script_versions` row (version_number++). Upload file to storage. Set `active_version_id`. Set `script_status = "extracting"`. |
| Job | Enqueue background job: `ScriptExtractJob(version_id)` |

**Stage 1: Text Extraction (Deterministic -- NO AI)**

| Format | Method |
|--------|--------|
| **PDF** | Extract text by page (layout-preserving). If scanned/low-quality → OCR fallback (mark `extraction_method=ocr_fallback`). Store per-page blocks with page_number + line ranges. |
| **DOCX** | Parse paragraphs + runs. Preserve heading-like lines and spacing. Create blocks with virtual page indexes. |
| **FDX** (Final Draft XML) | Parse XML structure: scene headings, action, character, dialogue are explicit nodes. Highest-quality format -- use fully. |
| **TXT** | Split into lines, preserve formatting. |

**Extraction Quality Score (0-100):**
- % of lines that look like scene headings
- Average line length
- Presence of dialogue patterns (CHARACTER:\n dialogue)
- Garbled character ratio
- Below 40 → status "failed" with actionable error message, never fake text

**Persist:** `script_text_blocks` with page/line mappings. Normalized text stored as `text.json`. Status → "extracted". Enqueue `ScriptAnalyzeJob(version_id)`.

**Stage 2: Language Detection + Canonicalization (Deterministic)**

| Step | Detail |
|------|--------|
| Detect per block | Unicode Tamil range detection, English ratio, mixed classification. Store language stats in `script_versions.language_detected`. |
| Normalize | Unicode NFC for Tamil text. Maintain original text always; normalized text for hashing/comparison. |

**Stage 3A: Scene Boundary Detection (AI + Validation)**

| Step | Detail |
|------|--------|
| Input | Extracted text blocks with line numbers + detected heading candidates from regex rules |
| AI call | AIML API (GPT-4o or Claude 3.5) identifies scene boundaries with strict JSON output: scene_index, scene_number, heading_raw, int_ext, time_of_day, location_text, start_line, end_line, page_start, page_end, confidence |
| Validation | Backend validates: sequential, non-overlapping, start_line/end_line exist, page ranges coherent with line mapping. If validation fails → repair prompt (max 2 retries). |
| Persist | Insert into `scenes` table with version_id. Store artifact in `ai_analyses` (analysis_type=breakdown_scene_bounds). |

**Stage 3B: Per-Scene Entity Extraction (AI, Parallelizable)**

| Step | Detail |
|------|--------|
| Input | Per scene: scene text + running "known entities" dictionary |
| Output | Per scene: characters (name + aliases + role_hint + confidence), locations (name + aliases + confidence), props (name + category + confidence), VFX notes (description + severity + explicit/implied + confidence), safety notes (type + severity + text) |
| Rules | Characters from dialogue labels / action mentions only. Locations from heading or explicit mentions. Props = concrete production-relevant nouns. VFX flagged as explicit vs implied. |
| Parallel | Run scene entity extraction in parallel workers (rate-limit AI calls). |
| Persist | Upsert characters, locations, props. Insert join rows: scene_characters, scene_locations, scene_props, vfx_notes. |

**Stage 3C: Global Canonicalization (Deterministic + AI Merge)**

| Step | Detail |
|------|--------|
| Deterministic clustering | Casefolded text, Tamil transliteration heuristic, Levenshtein similarity → candidate clusters |
| AI merge | AIML API "merge suggestions" prompt: given clusters, pick canonical name + alias list. Strict JSON output. |
| Apply | Update character/location tables with canonical IDs. Keep `aliases_json` for search & UI. |
| Why | Prevents "KIRAN", "Kiran", "கிரண்" from being treated as 3 different characters downstream. |

**Stage 3D: Breakdown Summary (AI)**

| Step | Detail |
|------|--------|
| Output | Scene count, unique characters, unique locations, key props, VFX count, stunt/safety warnings count, cultural notes summary |
| Persist | `ai_analyses` (analysis_type=breakdown_summary) |

**Stage 4: Screenplay Quality Score (AI)**

| Step | Detail |
|------|--------|
| Model | GPT-4o (fast) or Claude 3.5 (long scripts) |
| Input | Formatting stats + sampled scenes (10% across script) + dialogue density metrics (deterministic) |
| Output | Scores 0-100: formatting, pacing, dialogue_density, readability, overall. Plus actionable notes + quick_fixes. |
| Persist | `ai_analyses` (analysis_type=quality_score) |

**Stage 5: Character Consistency Check (On-Demand, Long Context)**

| Step | Detail |
|------|--------|
| Trigger | User clicks "Run consistency check" (not on every upload -- cost control) |
| Model | Claude 3.5 (best long-context) or chunked GPT-4o with synopsis compression |
| Input | Character appearances summary + key lines excerpts (NOT whole script if too large) + character profiles |
| Output | Issues: character name, type (continuity/personality/timeline), severity, description, scene_refs |
| Persist | `warnings` table + `ai_analyses` (analysis_type=character_consistency) |

**Stage 6: Plot Hole Detection (On-Demand, Synopsis-First)**

| Step | Detail |
|------|--------|
| Trigger | User clicks "Run plot hole detection" or script marked "ready for production" |
| Strategy | Build scene synopsis list first (1-2 lines per scene, AI or deterministic). Feed synopsis list + key turning points to long-context model. |
| Output | Plot holes: severity, description, scene_refs, suggested_fix |
| Persist | `warnings` (warning_type=plot) + `ai_analyses` (analysis_type=plot_holes) |

**Stage 7: Safety, Cultural Notes, Tags**

| Category | Detail |
|----------|--------|
| Safety | Stunts, water hazards, vehicles, weapons, fire, heights, child actor scenes |
| Cultural | Region-specific customs (temple protocols, festival depictions), sensitive depiction warnings, caste/language sensitivity |
| Compliance | Harmful stereotype flags, respectful depiction checks |
| Persist | `warnings` table with warning_type + `ai_analyses` |

**Stage 8: Caching & Reuse**

| Rule | Detail |
|------|--------|
| Same content_hash | Do not re-run full analysis. Reuse breakdown from Redis/PostgreSQL. |
| Style change only | Does not affect script parsing -- only downstream modules (Shot Hub, Schedule). |
| Cache keys | `breakdown:{content_hash}:{prompt_version}:{model}`, `quality:{content_hash}:{prompt_version}:{model}` |

**Stage 9: Script Version Comparison**

| Step | Detail |
|------|--------|
| Diff | Added/removed scenes, changed headings, character additions/removals, location changes |
| Method | Deterministic diff + optional AI summary: "Version 3 added 4 scenes, renamed antagonist from RAVI to KIRAN, removed bus stand location" |
| Persist | Comparison results stored for UI |

#### Prompting System (Strict Templates)

All prompts enforce:
- STRICT JSON output only, no markdown
- No extra keys beyond schema
- Line/page references required
- Forbid inventing text not present in source
- Known character dictionary enforced (after Stage 3C)

| Prompt | Role | Schema |
|--------|------|--------|
| Scene Boundary Detection | Identify scene boundaries with start_line/end_line | `{ "scenes": [{ scene_index, scene_number, heading_raw, int_ext, time_of_day, location_text, start_line, end_line, page_start, page_end, confidence }], "notes": [] }` |
| Per-Scene Entity Extraction | Extract characters, locations, props, VFX, safety from scene text | `{ "scene_number", "characters": [{ name, aliases, role_hint, confidence }], "locations": [...], "props": [...], "vfx": [...], "safety_notes": [...] }` |
| Canonicalization Merge | Pick canonical names + alias lists from clusters | `{ "characters": [{ canonical, aliases, merge_keys }], "locations": [...] }` |
| Quality Score | Rate formatting/pacing/dialogue | `{ "scores": { formatting, pacing, dialogue_density, readability, overall }, "notes": [], "quick_fixes": [] }` |
| Character Consistency | Find contradictions across appearances | `{ "issues": [{ character, type, severity, description, scene_refs }] }` |
| Plot Holes | Find narrative logic issues in synopsis | `{ "plot_holes": [{ severity, description, scene_refs, suggested_fix }] }` |

#### Error Handling (No Fake Text)

| Scenario | Action |
|----------|--------|
| Extraction fails | `script_status = "failed"`. Store error: "PDF appears scanned; please upload original DOCX/FDX or higher-quality PDF." UI shows re-upload suggestions. |
| AI output invalid schema | Auto-retry with "repair JSON" prompt (max 2 retries). Still failing → mark analysis failed, store raw output for debugging (internal only). |
| Low extraction quality (<40) | Status "failed" with specific feedback on what's wrong. Never proceed with garbage text. |

#### Model Selection Strategy

| Task | Model | Rationale |
|------|-------|-----------|
| Scene boundaries + entity extraction | GPT-4o (medium scripts), Claude 3.5 (long scripts 100+ pages) | Speed vs reliability tradeoff |
| Consistency + plot holes | Claude 3.5 or chunked GPT-4o with synopsis compression | Long-context reasoning needed |
| Quality score | GPT-4o | Fast, doesn't need full context |
| Canonicalization merge | GPT-4o | Small input, fast decision |

**Cost control:** Consistency and plot hole detection NOT run on every upload. Triggered on user click or when script marked "ready for production."

#### UI: What `/scripts` Shows

| Element | Detail |
|---------|--------|
| Upload | Drag-and-drop with format support indicator. Progress bar for extraction + analysis pipeline. |
| Script library | All scripts for project with version history. Active version highlighted. |
| Extraction quality | Score badge + method used. Error messages with re-upload suggestions if failed. |
| Scene list | Filterable: INT/EXT, location, day/night, character. Searchable by scene number/keywords. Click to read scene text with line highlighting. |
| Character list | Canonical names + aliases (Tamil variants). First appearance scene. Speaking line counts. |
| Location list | Script-level locations with aliases. Indoor/outdoor classification. |
| Props list | Categorized (weapon/vehicle/phone/document/etc). Scene linkages. |
| VFX list | Severity-coded. Explicit vs implied. Scene linkages. |
| Warnings | Tabbed: safety, cultural, formatting, plot holes. Severity-coded. Scene-linked where applicable. |
| Quality dashboard | Scores: formatting, pacing, dialogue density, readability. Quick fix suggestions. |
| Analysis buttons | "Run Consistency Check", "Run Plot Hole Detection" (on-demand, cost-controlled). |
| Version comparison | Side-by-side diff. AI summary of changes. |

#### P0 Build Plan

| Phase | Deliverables |
|-------|-------------|
| Phase 1 (Core extraction) | DB tables (scripts, script_versions, script_text_blocks, ai_analyses). File storage upload. Deterministic text extraction per format (PDF/DOCX/FDX/TXT). Page/line block mapping. Extraction quality scoring. No-fake-text error handling. |
| Phase 2 (AI breakdown) | Scene boundary detection (regex + AI fallback) + persist scenes. Per-scene entity extraction (parallel) + persist characters/locations/props/VFX. Canonicalization merge. Breakdown summary. Redis caching by content_hash. |
| Phase 3 (Analysis add-ons) | Quality score. Safety/cultural notes. Script version comparison diff. Script library UI with version history. |
| Phase 4 (Long-context checks) | Character consistency (on-demand). Plot hole detection (synopsis-first, on-demand). |

---

## Implementation Priority Matrix

| Priority | Features | Rationale |
|----------|----------|-----------|
| **P0 - Immediate** | Next.js API routes, PostgreSQL + PostGIS + ORM, Redis integration, AIML API service, Unify API client, **Script Parsing & AI Breakdown**, **Script-Aware Location Scouter**, **AI Scheduling Engine**, **Shot Hub**, Dashboard intelligence, Call sheet automation, Mission Control real data, AI chatbot, Tamil Script OCR | These establish the new architecture and unlock the core "AI-powered" promise. Script Parsing is the foundational pipeline; Location Scouter, Scheduling Engine, and Shot Hub are the signature differentiators. |
| **P1 - Next Quarter** | Authentication, Budget forecasting, Crew management, Notifications, Weather API, Continuity tracker, Dubbing scripts, CBFC predictor, Storyboard AI, VFX breakdown, Music placement, Dialogue coach, UI theme standardization, File storage | These differentiate CinePilot from generic tools and serve South Indian cinema specifically. |
| **P2 - Future** | Smart exports, Settings persistence, Production accounting, Crowd management, Release planner, Poster generation, Voice briefings, Preference learning | Premium features for larger productions. |

---

*CinePilot Enhancement Blueprint -- Updated 2026-02-26*
*Architecture: Next.js 14 + PostgreSQL (PostGIS) + Redis + AIML API + OSRM*
*South Indian Cinema's First AI-Powered Pre-Production Suite*
