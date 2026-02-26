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

### 2. Scripts (`/scripts`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Drag-and-drop upload (PDF, DOCX, FDX, TXT). AI analysis button returns mock data. Script preview. Script comparison tab. Tags, safety warnings, cultural notes. |
| **Gaps** | Upload fallback generates fake text. Analysis is static mock. No script library or version history. No persistence. |

**AI Enhancements (P0)**

| Enhancement | Implementation |
|-------------|---------------|
| Real Script Breakdown | Upload script to file storage (S3/R2). Send content to AIML API (GPT-4o or Claude 3.5) for full breakdown: scenes, characters, locations, props, VFX. Store results in PostgreSQL `ai_analyses` table. Cache in Redis. |
| Tamil NLP Pipeline | AIML API handles Tamil script parsing: scene headings in Tamil, character names in Tamil/Tanglish, dialogue extraction with language detection. |
| Auto Scene Extraction | AIML API identifies scene boundaries even in non-standard formats. Results persisted to PostgreSQL `scenes` table. |
| Screenplay Quality Score | AIML API rates formatting, pacing, dialogue density. Score stored in PostgreSQL alongside the script. |
| Character Consistency Check | AIML API (Claude 3.5 -- best for long-context) analyzes all character appearances for consistency. |
| Plot Hole Detection | AIML API analyzes narrative logic across all scenes. Flags stored as warnings in PostgreSQL. |

---

### 3. Shot List (`/shot-list`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Scene description textarea, AI-generated shot list (falls back to 5 mock shots), inline editing, quick-add buttons, 4 scene templates. |
| **Gaps** | Save and Export PDF non-functional. Duration estimation is rough. No connection to projects. |

**AI Enhancements (P0)**

| Enhancement | Implementation |
|-------------|---------------|
| Context-Aware Shot Suggestions | AIML API (GPT-4o) analyzes scene description, genre, emotional tone, character count. Cache suggestions in Redis keyed by scene hash. |
| Director Style Matching | Prompt AIML API with reference director style (Mani Ratnam, Vetrimaaran, Lokesh Kanagaraj). Style preference stored in PostgreSQL project settings. |
| Lens & Lighting Recommendations | AIML API factors INT/EXT, time of day, mood for lens + lighting setup recommendations. |
| Shot Duration Estimation | AIML API estimates realistic duration per shot. Aggregated totals cached in Redis. |
| Storyboard Generation | AIML API (Stable Diffusion XL or DALL-E 3) generates rough storyboard frames from shot descriptions. Images stored in file storage. |

---

### 4. Schedule (`/schedule`)

| Aspect | Detail |
|--------|--------|
| **Current State** | Calendar view (5-day grid) and List view. Day detail panel. Unassigned scenes panel. Stats row. |
| **Gaps** | Entirely hardcoded demo data. Only 5 days. No drag-and-drop. No save. |

**AI Enhancements (P0)**

| Enhancement | Implementation |
|-------------|---------------|
| Constraint-Based Optimization | AIML API (GPT-4o) receives scenes, locations, cast availability from PostgreSQL. Returns optimized schedule. Persist result to PostgreSQL `shooting_days` + `day_scenes`. |
| Weather-Aware Scheduling | Fetch real weather via API (OpenWeatherMap). AIML API cross-references with outdoor scenes. Cache weather in Redis (TTL 6 hours). |
| Cast Conflict Resolution | Query PostgreSQL for cast bookings. AIML API proposes alternatives. Broadcast changes via Redis pub/sub. |
| Travel & Logistics | AIML API calculates travel time between PostgreSQL locations. Flags impossible same-day moves. |
| Cost-Optimized Scheduling | AIML API factors equipment rental costs, crew overtime, permit windows from PostgreSQL budget/crew tables. |

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

---

## Implementation Priority Matrix

| Priority | Features | Rationale |
|----------|----------|-----------|
| **P0 - Immediate** | Next.js API routes, PostgreSQL + PostGIS + ORM, Redis integration, AIML API service, Unify API client, **Script-Aware Location Scouter**, Script AI analysis, Dashboard intelligence, Call sheet automation, Mission Control real data, AI chatbot, Tamil Script OCR | These establish the new architecture and unlock the core "AI-powered" promise. Location Scouter is the signature differentiator. |
| **P1 - Next Quarter** | Authentication, Schedule optimization, Budget forecasting, Crew management, Notifications, Weather API, Continuity tracker, Dubbing scripts, CBFC predictor, Storyboard AI, VFX breakdown, Music placement, Dialogue coach, UI theme standardization, File storage | These differentiate CinePilot from generic tools and serve South Indian cinema specifically. |
| **P2 - Future** | Smart exports, Settings persistence, Production accounting, Crowd management, Release planner, Poster generation, Voice briefings, Preference learning | Premium features for larger productions. |

---

*CinePilot Enhancement Blueprint -- Updated 2026-02-26*
*Architecture: Next.js 14 + PostgreSQL (PostGIS) + Redis + AIML API*
*South Indian Cinema's First AI-Powered Pre-Production Suite*
