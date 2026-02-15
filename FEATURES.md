# CinePilot - Technical Specification

## Latest Updates (Feb 15, 2026 - Night Build Phase 26)

### Phase 26 Features (NEW)

**1. Enhanced API Client (api-phase26.ts)**
- Real-time project sync, batch operations, scene suggestions, calendar integration
- Export to PDF/XLSX/JSON/CSV, crew availability, location recommendations
- Cache system with TTL, event bus for real-time updates

**2. Production Assistant Components**
- AI-powered scene suggestions, scene cards, budget widgets, crew cards

**3. Enhanced WhatsApp Notifications**
- 8 templates with variable substitution, category filtering, batch sending

**4. Enhanced AI Analysis Dashboard**
- 8 analysis types: Dialogue, Emotional Arc, Pacing, Visual Flow, Characters, VFX, Budget, Film Comparison

**5. Backend API Extensions**
- New endpoints: scene-suggestions, location-recommendations, cost-estimate, batch scenes, calendar, crew availability, notification preferences, collaboration, script versions

---
## Previous Updates (Phase 25)

### Phase 25 Features (NEW)

**1. Film Comparison & Benchmarking**
- Compare script with similar films
- Estimate runtime and pages from script content
- Budget benchmarking with similar films
- Pacing analysis and beat suggestions

**2. AI Budget Predictor**
- Genre-based budget estimation
- Detailed breakdown (pre-production, production, post, contingency)
- Per-scene and per-minute cost calculations
- AI recommendations for budget optimization

**3. Character Network Analysis**
- Character co-occurrence mapping
- Screen time tracking
- Central character identification
- Relationship strength analysis

**4. Weather-Aware Scheduling**
- 14-day weather forecast integration
- Best days for outdoor shooting
- Rain/temperature recommendations
- Schedule adjustments based on weather

**5. VFX Requirements Analysis**
- Auto-detect VFX scenes from descriptions
- Complexity scoring (high/medium/low)
- Cost estimation per scene
- Production recommendations

**6. New Frontend Components**
- FilmComparison, BudgetPredictor, CharacterNetwork, WeatherSchedule, VFXAnalyzer, Phase25Dashboard

**7. Phase 25 API Client**
- api-phase25.ts with all new endpoints

---

## Previous Updates (Feb 15, 2026 - Night Build Phase 24)

### Phase 24 Features (NEW)

**1. Enhanced Script Upload**
- Advanced script upload with format detection (FDX, Fountain, TXT, PDF, DOCX)
- Multi-script batch upload
- Scene extraction and metadata generation
- Location extraction from parsed scripts

**2. WhatsApp Template System**
- 8 pre-defined templates (schedule reminder, location update, cast call, budget alert, equipment return, scene complete, crew update, emergency)
- Variable substitution for personalized messages
- Batch sending to multiple recipients
- Preview before send

**3. Enhanced AI Analysis**
- Dialogue density analysis
- Visual flow analysis
- Continuity suggestions
- Scene summary generation

**4. Project Import/Export**
- Full project JSON export
- CSV export for scenes
- Project import from JSON
- Scene data migration

**5. Enhanced Analytics**
- Comprehensive project analytics endpoint
- Scene completion tracking
- Budget burn rate calculation
- Crew utilization metrics

**6. Crew Management**
- Availability checking between dates
- Crew assignment to projects
- Assignment history tracking

**7. New Frontend Components**
- ScriptUploader - Drag-drop script upload with preview
- WhatsAppTemplateManager - Template selection and sending
- VisualFlowAnalyzer - Scene flow visualization

---

## Previous Updates (Feb 15, 2026 - Night Build Phase 23)
- **Location Scout** - AI-powered location search and recommendations with accessibility scoring
- **Storyboard Viewer** - Visual storyboard management with grid/timeline views, shot details
- **Equipment Checklist** - Interactive equipment checklist generator with progress tracking
- **Production Dashboard** - Real-time production metrics with charts and alerts
- **Casting Recommendations** - AI-powered actor suggestions with compatibility scoring
- **Scene Sentiment Analysis** - Emotional analysis for scenes and overall journey
- **Notification History** - Full notification log with retry capability
- **Connection Status** - Real-time backend connection monitoring
- **Enhanced API Client** - New Phase 23 API endpoints in `api-phase23.ts`

## Overview
AI-powered film pre-production platform for Tamil cinema. Full-stack application with Next.js frontend and FastAPI backend.

---

## Architecture

### Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| State | Zustand with localStorage persistence |
| Charts | Recharts, Chart.js |
| Animations | Framer Motion |
| Backend | FastAPI (Python) |
| Database | In-memory + JSON file persistence |
| Notifications | WhatsApp (wacli), Email (SMTP) |

---

## Features

### 1. Project Management

**Functionality:**
- Create, edit, delete projects
- Project metadata (title, genre, language, status, dates, budget)
- Filter by status/genre
- Grid/List view toggle

**Technical:**
- Frontend: Zustand store (`useProjectStore`)
- Backend: `/api/projects` CRUD endpoints
- Storage: JSON file (`data/projects.json`)

---

### 2. Scene Management

**Functionality:**
- Add/edit/delete scenes
- Scene fields: number, name, description, location, time (day/night/dawn/dusk), type (INT/EXT), status, pages, characters, props, VFX notes
- Bulk delete
- Filter by status, time, interior/exterior

**Technical:**
- Frontend: Scene CRUD components
- Backend: `/api/scenes` endpoints
- Storage: Linked to project ID in JSON

---

### 3. Script Upload & Analysis

**Functionality:**
- Upload script files (TXT, FDX)
- Parse into scenes, characters, locations
- AI analysis (mock for now):
  - Scene breakdown
  - Character analysis
  - Location extraction
  - Complexity scoring
  - Budget estimation
  - Schedule estimation

**Technical:**
- File upload: `POST /api/upload/script`
- Parser: Custom Python (regex-based FDX/TXT parsing)
- AI endpoints: `/api/ai/analyze-script`, `/api/ai/deep-analysis`
- Analysis: Rule-based + mock AI responses

---

### 4. Scheduling

**Functionality:**
- Add shooting days
- Assign scenes to days
- Set call/wrap times
- Location assignment
- Week calendar view
- List view toggle

**Technical:**
- Frontend: Calendar component with date picker
- Backend: `/api/schedule/generate`, `/api/schedule/optimize`
- Storage: `data/schedule.json`

---

### 5. Budget Management

**Functionality:**
- Add expense line items
- Categories: Pre-production, Production, Post-production, Contingency
- Automatic category totals
- Variance tracking (estimated vs actual)
- Transaction history

**Technical:**
- Frontend: Budget components with form
- Backend: `/api/budget` endpoints
- Storage: `data/budget.json`

---

### 6. Crew & Cast Management

**Functionality:**
- Add crew/cast members
- Roles: Director, Cinematographer, Actor, etc.
- Departments: Direction, Camera, Art, etc.
- Daily rate, contact info
- Availability tracking
- Schedule conflicts detection

**Technical:**
- Frontend: Crew management with tabs
- Backend: `/api/crew`, `/api/cast` endpoints
- Storage: `data/crew.json`

---

### 7. Location Management

**Functionality:**
- Add locations with details
- Permit status (pending/approved/denied)
- Contact information
- Link to scenes
- Permit expiry tracking

**Technical:**
- Frontend: Location cards with status badges
- Backend: `/api/locations` endpoints
- Storage: `data/locations.json`

---

### 8. Equipment Inventory

**Functionality:**
- Add equipment items
- Categories: Camera, Lighting, Sound, Grip, Art
- Quantity, days, cost tracking
- Vendor information
- Status: available/in-use/maintenance

**Technical:**
- Frontend: Equipment grid with filters
- Backend: `/api/equipment` endpoints
- Storage: `data/equipment.json`

---

### 9. Call Sheet Generation

**Functionality:**
- Generate call sheet from schedule
- Include: scenes, crew calls, locations, weather
- Export to PDF (future)
- Print-friendly format

**Technical:**
- Backend: `/api/callsheet/generate`
- PDF: WeasyPrint (future)

---

### 10. Export System

**Functionality:**
- Export to PDF (schedule, call sheets, budget reports)
- Export to Excel/CSV (shot lists, crew, equipment)
- Export to ICS calendar (shooting schedule)
- Batch export capabilities

**Technical:**
- Backend: `/api/export/pdf`, `/api/export/excel`, `/api/export/calendar`
- Frontend: ExportPanel component
- PDF: ReportLab, Excel: XlsxWriter, Calendar: ICS generation

---

### 11. AI Shot List Generation

**Functionality:**
- Generate shot lists from scene descriptions
- Suggest shot types (wide, medium, close-up, POV, etc.)
- Suggest camera movements (pan, tilt, dolly, crane, etc.)
- Estimate screen time per scene

**Technical:**
- Backend: `/api/ai/generate-shot-list`, `/api/ai/shot-type-suggestions`, `/api/ai/camera-movement-suggestions`
- Frontend: ShotListGenerator component

---

### 12. Character Arc Analysis

**Functionality:**
- Visual character arc timeline
- Scene breakdown per character
- Emotional journey mapping
- Screen time estimation

**Technical:**
- Backend: `/api/projects/{id}/characters/{charId}/arc`, `/api/projects/{id}/characters/{charId}/scenes`
- Frontend: CharacterArcViewer component

---

### 13. Production Reports

**Functionality:**
- Production summary reports
- Daily progress reports
- Budget analysis reports
- Schedule timeline reports

**Technical:**
- Backend: Multiple data aggregations
- Frontend: ProductionReport component
- Template: Jinja2

---

### 10. Notifications

**Functionality:**
- Send WhatsApp messages
- Send emails
- Predefined templates
- Interactive buttons (WhatsApp)
- Batch notifications

**Technical:**
- WhatsApp: wacli CLI integration
- Email: SMTP via FastAPI
- Backend: `/api/notifications/whatsapp`, `/api/notifications/email`
- Templates: Stored in `/api/notifications/templates`

---

### 11. AI Analysis Features

**Functionality:**
- Scene breakdown analysis
- Character arc analysis
- Pacing analysis
- Cultural element detection (Tamil-specific)
- Safety warnings
- Shot suggestions
- Dialogue analysis
- Emotional arc analysis

**Technical:**
- Mock AI: Rule-based analysis
- Real AI: OpenAI/Claude API integration (optional)
- Endpoints: `/api/ai/*` (14+ endpoints)
- Tamil support: Custom Tamil text processing

---

### 12. Progress Tracking

**Functionality:**
- Overall project progress %
- Phase progress (pre-production, production, post-production)
- Task completion tracking
- Upcoming deadlines

**Technical:**
- Frontend: Progress rings, charts
- Backend: `/api/projects/{id}/progress`
- Storage: In project JSON

---

### 13. Analytics Dashboard

**Functionality:**
- Weekly production charts
- Activity feed
- Budget charts
- Scene distribution pie charts
- **Enhanced Analytics** (NEW):
  - Detailed budget breakdown with estimated vs actual
  - Location usage tracking
  - Crew cost distribution
  - Daily shooting progress visualization
  - Phase-based progress tracking
  - Cost percentage breakdown

**Technical:**
- Frontend: Recharts library + ProductionAnalytics component
- Backend: `/api/analytics/*` endpoints

---

### 14. Crew & Cast Management (NEW)

**Functionality:**
- Add crew/cast members with details
- Department-based organization
- Daily rate tracking
- Status management (confirmed/pending)
- Cost summaries

**Technical:**
- Frontend: `crew-cast-manager.tsx` component
- Backend: `/api/projects/{id}/crew` endpoints

---

### 15. Shooting Schedule Manager (NEW)

**Functionality:**
- Calendar and list views
- Day-by-day scheduling
- Scene status tracking
- Call/wrap times
- Location tracking

**Technical:**
- Frontend: `shooting-schedule.tsx` component
- Backend: `/api/schedule/optimize`, `/api/schedule/recommendations`

---

### 16. Report Generator (NEW)

**Functionality:**
- Multiple report types (DOOD, Call Sheet, Budget, Script, Progress, Inventory)
- PDF/Excel/JSON export
- Preview before download

**Technical:**
- Frontend: `report-generator.tsx` component
- Backend: `/api/export/*` endpoints

---

### 17. Enhanced AI Analysis (NEW)

**Functionality:**
- Script insights (word count, page estimates, runtime)
- AI capabilities listing
- Version comparison
- Schedule optimization
- Schedule recommendations

**Technical:**
- Frontend: `ai-analysis.tsx` enhanced
- Backend: `/api/ai/script-insights`, `/api/ai/capabilities`, `/api/ai/compare-versions`, `/api/schedule/optimize`

### 18. Advanced AI Analysis (NIGHT BUILD)

**Functionality:**
- Pacing analysis (dialogue/action ratio)
- Character extraction and analysis
- Emotional arc tracking
- Auto-tag generation (genre, mood, setting)

**Technical:**
- Frontend: `ScriptAnalysisDashboard.tsx` component (NEW)
- Backend: `/api/ai/analyze-pacing`, `/api/ai/analyze-characters`, `/api/ai/analyze-emotional-arc`, `/api/ai/generate-tags`

### 19. Enhanced WhatsApp Notifications (NIGHT BUILD)

**Functionality:**
- Schedule reminder automation
- Location update notifications
- Cast call time messaging
- Message preview

**Technical:**
- Frontend: `WhatsAppNotificationCenter.tsx` component (NEW)
- Backend: `/api/whatsapp/schedule-reminder`, `/api/whatsapp/location-update`, `/api/whatsapp/cast-call`

### 20. Multi-Script Upload (NIGHT BUILD)

**Functionality:**
- Upload multiple scripts at once
- Batch processing
- Scene extraction preview

**Technical:**
- Frontend: `scriptUpload.uploadMultiple()` API method
- Backend: `/api/upload/script-multi`

### 21. Project Collaboration (NIGHT BUILD)

**Functionality:**
- Activity feed tracking
- Task management
- Expense tracking

**Technical:**
- Frontend: `ProjectCollaboration.tsx` component (NEW)
- Backend: `/api/projects/{id}/activity`, `/api/projects/{id}/tasks`, `/api/projects/{id}/expenses`

---

### 22. Enhanced AI Analysis V2 (Feb 15, 2026)

**Functionality:**
- Screenplay format checker
- Scene complexity scorer
- Fountain format parser
- Script version comparison

**Technical:**
- Frontend: `EnhancedAIDashboard.tsx` component
- Backend: `/api/ai/analyze-screenplay-format`, `/api/ai/analyze-scene-complexity`, `/api/ai/parse-fountain`, `/api/ai/compare-scripts`

---

### 23. Real WhatsApp Integration (Feb 15, 2026)

**Functionality:**
- Send messages via wacli CLI
- Batch message sending
- Template-based messaging

**Technical:**
- Frontend: `WhatsAppIntegration.tsx` component
- Backend: `/api/whatsapp/send`, `/api/whatsapp/batch-send`

---

### 24. Schedule AI Recommendations (Feb 15, 2026)

**Functionality:**
- Optimal shooting order
- Location grouping
- Cost estimation
- Budget tracking

**Technical:**
- Frontend: `ScheduleRecommendations.tsx` component
- Backend: `/api/schedule/recommendations`

---

### 25. Enhanced Cast & Equipment (Feb 15, 2026)

**Functionality:**
- Full cast management
- Equipment inventory
- Vendor tracking

**Technical:**
- Backend: `/api/projects/{id}/cast`, `/api/projects/{id}/equipment`

---

### 14. Script Version Control

**Functionality:**
- Track multiple script versions
- Compare versions
- Scene changes detection

**Technical:**
- Backend: `/api/projects/{id}/script/versions`
- Comparison: Diff algorithm

---

### 15. Tamil Language Support

**Functionality:**
- Tamil script parsing
- Tamil number conversion
- Cultural element detection
- Bilingual outputs

**Technical:**
- Tamil processing: Custom Python library
- Unicode handling throughout
- Tamil-specific templates

---

## API Endpoints (Complete List)

### Projects
- `GET /api/projects` - List all
- `POST /api/projects` - Create
- `GET /api/projects/{id}` - Get one
- `PUT /api/projects/{id}` - Update
- `DELETE /api/projects/{id}` - Delete

### Scenes
- `GET /api/scenes` - List (with project_id filter)
- `POST /api/scenes` - Create
- `PUT /api/scenes/{id}` - Update
- `DELETE /api/scenes/{id}` - Delete
- `POST /api/scenes/bulk-delete` - Bulk delete

### Schedule
- `GET /api/schedule` - Get schedule
- `POST /api/schedule/generate` - Generate
- `POST /api/schedule/optimize` - Optimize

### Budget
- `GET /api/budget` - Get budget
- `POST /api/budget/expense` - Add expense
- `GET /api/budget/summary` - Summary

### Crew
- `GET /api/crew` - List crew
- `POST /api/crew` - Add
- `DELETE /api/crew/{id}` - Remove

### Locations
- `GET /api/locations` - List
- `POST /api/locations` - Add
- `PUT /api/locations/{id}` - Update

### Equipment
- `GET /api/equipment` - List
- `POST /api/equipment` - Add
- `DELETE /api/equipment/{id}` - Remove

### AI Analysis (14+ endpoints)
- `/api/ai/analyze-script`
- `/api/ai/deep-analysis`
- `/api/ai/enhanced-analysis`
- `/api/ai/suggest-locations`
- `/api/ai/analyze-dialogue`
- `/api/ai/analyze-emotions`
- `/api/ai/suggest-shots`
- `/api/ai/full-analysis`
- `/api/ai/improved-analysis`
- `/api/ai/script-insights`
- `/api/ai/tamil-numbers/{n}`
- `/api/ai/capabilities`

### Notifications
- `/api/notifications/whatsapp`
- `/api/notifications/email`
- `/api/notifications/batch`
- `/api/notifications/templates`

### Upload
- `/api/upload/script`
- `/api/upload/script-advanced`

### Export
- `/api/export/pdf`
- `/api/export/json`
- `/api/export/csv`

### Other
- `/api/health` - Health check
- `/api/callsheet/generate`
- `/api/dood/report`
- `/api/webhooks`
- `/api/projects/{id}/progress`
- `/api/projects/{id}/timeline`
- `/api/projects/{id}/cast-availability`

---

## Data Models

### Project
```typescript
interface Project {
  id: string
  title: string
  genre: string
  language: string
  status: 'planning' | 'pre-production' | 'production' | 'post-production' | 'completed'
  startDate: string
  endDate: string
  budget: number
  description: string
  createdAt: string
}
```

### Scene
```typescript
interface Scene {
  id: string
  projectId: string
  number: number
  name: string
  description: string
  location: string
  timeOfDay: 'day' | 'night' | 'dawn' | 'dusk'
  intExt: 'INT' | 'EXT'
  status: 'pending' | 'scheduled' | 'shot' | 'completed'
  pages: number
  characters: string[]
  props: string[]
  vfxNotes: string
}
```

### Crew
```typescript
interface CrewMember {
  id: string
  projectId: string
  name: string
  role: string
  department: string
  dailyRate: number
  phone: string
  email: string
  available: boolean
}
```

---

## File Structure
```
cinepilot/
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Dashboard
│   │   ├── projects/          # Project pages
│   │   ├── scenes/            # Scene management
│   │   ├── schedule/          # Scheduling
│   │   ├── budget/            # Budget
│   │   ├── crew/              # Crew management
│   │   ├── locations/         # Locations
│   │   ├── equipment/         # Equipment
│   │   └── lib/
│   │       ├── store.ts       # Zustand store
│   │       └── api.ts         # API client
│   └── components/            # UI components
├── backend/
│   ├── main.py               # FastAPI app
│   └── services/             # Business logic
└── data/                     # JSON storage
```

---

## Future Enhancements

1. **Real Database** - PostgreSQL
2. **User Auth** - JWT authentication
3. **Real AI** - OpenAI/Claude integration
4. **PDF Generation** - WeasyPrint
5. **Real-time** - WebSocket updates
6. **Mobile App** - React Native
7. **Team Collaboration** - Multi-user support
8. **Cloud Storage** - S3 for scripts/assets

---

*Generated: 2026-02-14*
*CinePilot - AI-Powered Pre-Production for Tamil Cinema*

---

## Recommendations: Premium Features for International Market

### 1. Advanced AI Script Writing & Analysis

**Script Writing Assistant**
- AI co-writer that suggests dialogue
- Scene rewrite recommendations
- Plot hole detection
- Character consistency checker
- Genre-specific suggestions (romance, action, thriller)

**Technical:**
- OpenAI GPT-4 / Claude integration
- Fine-tuned Tamil/Hindi film models
- Vector storage for character database

---

### 2. Multi-Language Support

**Languages:**
- Hindi, Telugu, Kannada, Malayalam, Tamil
- English subtitles generation
- Dubbing script conversion
- Regional dialect detection

**Technical:**
- Translation API (Google Translate, DeepL)
- Custom NLP for Indian languages
- Whisper for subtitle generation

---

### 3. Virtual Production Tools

**LED Wall Visualization**
- Real-time preview of scenes on virtual sets
- Camera movement simulation
- Lighting preview

**Technical:**
- Unreal Engine integration
- WebGL virtual sets
- Real-time rendering

---

### 4. Smart Casting

**AI Casting Suggestions**
- Face analysis for character matching
- Availability calendar integration
- Salary negotiation suggestions
- Chemistry prediction between actors

**Technical:**
- Computer vision API
- Database of actor profiles
- Scheduling optimization algorithm

---

### 5. Location Scouting AI

**Virtual Scouting**
- AI-generated location photos
- Weather pattern analysis
- Permit requirement lookup by location
- Distance/ logistics calculator

**Technical:**
- Stable Diffusion for location images
- Weather API integration
- GIS mapping

---

### 6. Budget Forecasting

**Predictive Budgeting**
- AI estimate based on script analysis
- Similar film comparison
- Cost overrun predictions
- Cash flow planning

**Technical:**
- Historical film database
- ML regression models
- Real-time cost tracking

---

### 7. Talent Management

**Artist Database**
- Pan-Indian talent database
- Rating & review system
- Past collaboration history
- Contract management

**Technical:**
- Elasticsearch for search
- Blockchain for contracts
- CRM integration

---

### 8. Distribution Planning

**Release Strategy**
- AI recommendation for release date
- competitor film analysis
- Festival circuit planning
- Platform (theatrical/OTT) analysis

**Technical:**
- Box office data API
- OTT platform analytics
- Social media sentiment

---

### 9. Music & Background Score

**AI Music Composition**
- Mood-based music suggestions
- Background score generation
- Song placement recommendations
- Copyright clearance checker

**Technical:**
- Audio synthesis AI
- Music rights database API
- Spotify/streaming analytics

---

### 10. Marketing & Trailer Generation

**AI Marketing**
- Trailer clip selection
- Poster generation
- Social media campaign planner
- Press release generator

**Technical:**
- Video editing AI (Runway, Pika)
- Image generation (Midjourney, DALL-E)
- Social media scheduling API

---

### 11. Legal & Compliance

**Automated Legal**
- Contract templates
- Compliance checklist
- Insurance recommendations
- IP registration helper

**Technical:**
- Legal document AI
- Government API integration
- Compliance database

---

### 12. Remote Collaboration

**Cloud Production**
- Multi-user real-time editing
- Version control for scripts
- Secure file sharing
- Client approval workflows

**Technical:**
- WebSocket real-time sync
- AWS S3 / Google Cloud Storage
- End-to-end encryption

---

### 13. Post-Production Integration

**Handoff to Post**
- Rough cut assembly
- VFX shot list export
- Color grading notes
- Sound design requirements

**Technical:**
- DaVinci Resolve API
- Adobe Premiere integration
- VFX pipeline tools

---

### 14. Sustainability Tracking

**Green Production**
- Carbon footprint calculator
- Sustainable vendor recommendations
- Waste management tracking
- Energy usage optimization

**Technical:**
- Carbon calculation algorithms
- ESG reporting templates

---

### 15. Insurance & Risk Management

**Risk Assessment**
- Weather delay insurance
- Actor unavailability coverage
- Equipment insurance tracker
- Emergency protocol generator

**Technical:**
- Insurance API integrations
- Risk assessment ML models
- Alert systems

---

### 16. Fan Engagement

**Pre-Release Hype**
- Fan script reading events
- Location raffles
- Social media engagement tracker
- Early reviews aggregation

**Technical:**
- Social media APIs
- Event management integration
- Gamification features

---

### 17. Tax & Finance Optimization

**Indian Tax Benefits**
- Section 80IB calculation
- State film incentive lookup
- GST guidance
- Export earnings optimization

**Technical:**
- Tax rule database
- CA consultation integration
- Financial modeling

---

### 18. International Co-Production

**Foreign Collaboration**
- Treaty compliance checker
- Foreign talent visa tracker
- Currency & budget converter
- Cultural sensitivity advisor

**Technical:**
- Government treaty database
- Currency APIs
- Cultural AI consultant

---

## Priority Implementation Roadmap

### Phase 1 (Current)
- ✅ Project/Scene/Schedule management
- ✅ Budget tracking
- ✅ Crew management
- ✅ Basic AI analysis

### Phase 2 (Next)
- 🤖 Advanced AI Script Analysis
- 🌐 Multi-language support
- 📊 Budget forecasting

### Phase 3 (Future)
- 🎬 Virtual production
- 🎭 Smart casting
- 📍 AI location scouting

### Phase 4 (Premium)
- 📢 Marketing automation
- 📜 Legal compliance
- 🌏 International co-production

---

*Recommendations added: 2026-02-14*
