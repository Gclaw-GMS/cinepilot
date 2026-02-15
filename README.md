# CinePilot - AI-Powered Pre-Production Platform

A full-fledged pre-production platform for Tamil and Indian cinema.

## What's New (Feb 2026 - Latest Updates)

- ✅ **Enhanced Analytics Dashboard** - Detailed production analytics with tabs:
  - Overview: Key metrics, weekly progress, scene distribution
  - Budget: Phase breakdown, cost distribution charts
  - Scenes: Location usage, daily shooting progress
  - Crew: Team cost analysis, department breakdown
- ✅ **Full API Client** - Complete TypeScript frontend-backend integration
- ✅ **Script Uploader** - Drag & drop with version control
- ✅ **AI Analysis Panel** - Shot planner, budget estimator, character analyzer
- ✅ **WhatsApp Integration** - Templates, interactive buttons, quick actions
- ✅ **Progress Tracking** - Milestones, phase progress, task completion
- ✅ **Character Arc Analysis** - Track character transformation
- ✅ **Pacing Analysis** - Script rhythm and beat breakdown
- ✅ **Cultural Analysis** - Regional Tamil elements detection
- ✅ **Safety Analysis** - Production safety warnings
- ✅ **Export Options** - JSON, CSV, PDF formats
- ✅ **Collaboration** - Multi-user project management

## Features

- 📝 Script Breakdown with Tamil language support
- 📅 Smart Scheduling with AI optimization  
- 🎬 Shot List Generator with AI suggestions
- 📊 DOOD (Day Out of Days) Report
- 💰 Budget Analysis and tracking
- 📋 Bilingual Call Sheet Generator
- 🤖 AI Script Analysis (Mock + Real GPT-4/Claude)
- 📱 WhatsApp Notifications to crew
- 📧 Email Notifications via SMTP
- 📈 Advanced Charts & Visualizations
- 👥 Crew Management
- 📤 Export to PDF/JSON/CSV
- 🔔 Real-time Activity Feed
- 📊 Project Analytics Dashboard

## Tech Stack

- Frontend: Next.js 14 + Tailwind CSS
- Backend: Python FastAPI
- Database: PostgreSQL (optional)
- AI: OpenAI GPT-4, Claude 3 Opus

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL (optional)

### Setup

1. Clone and install:
```bash
cd frontend && npm install
cd ../backend && pip install -r requirements.txt
```

2. (Optional) Setup database:
```bash
cd database && ./setup.sh
```

3. (Optional) Configure AI:
```bash
# For real AI analysis
export OPENAI_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"

# For email notifications
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your@email.com"
export SMTP_PASS="app-password"
```

4. Run development servers:
```bash
# Backend
cd backend && uvicorn main:app --reload

# Frontend  
cd frontend && npm run dev
```

5. Open http://localhost:3000

### Quick Start (All-in-one)
```bash
./start.sh
```

## Project Structure

```
cinepilot/
├── frontend/          # Next.js app
│   ├── app/
│   │   ├── page.tsx           # Dashboard
│   │   ├── scripts/           # Script management
│   │   ├── shot-list/        # Shot list generator
│   │   ├── schedule/         # Shooting schedule
│   │   ├── dood/             # DOOD report
│   │   ├── budget/            # Budget analysis
│   │   ├── crew/              # Crew management
│   │   ├── call-sheets/       # Call sheet generator
│   │   ├── ai-tools/          # AI analysis tools (Real AI)
│   │   ├── notifications/    # WhatsApp + Email
│   │   └── settings/          # App settings
│   └── lib/
│       ├── api.ts             # API client
│       ├── types.ts           # TypeScript types
│       ├── components.tsx     # UI components
│       └── charts.tsx         # Chart components
├── backend/           # FastAPI
│   └── main.py        # API endpoints
├── database/         # SQL schema
└── ai/              # AI services
    └── service.py    # Real AI integration
```

## Pages

| Page | Description |
|------|-------------|
| `/` | Dashboard with project overview |
| `/scripts` | Upload and manage scripts |
| `/shot-list` | AI-powered shot list generation |
| `/schedule` | Shooting schedule with AI optimization |
| `/dood` | Day Out of Days report |
| `/budget` | Budget tracking and analysis |
| `/crew` | Cast and crew management |
| `/call-sheets` | Bilingual call sheet generator |
| `/ai-tools` | Script analysis (Mock + Real AI) |
| `/notifications` | WhatsApp & Email notifications |

## API Endpoints

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project

### Scenes
- `GET /api/projects/{id}/scenes` - List scenes
- `POST /api/projects/{id}/scenes` - Create scene

### AI Analysis
- `POST /api/ai/analyze-script` - Mock analysis
- `POST /api/ai/analyze-tamil-script` - Tamil analysis
- `POST /api/ai/deep-analysis` - Enhanced mock analysis
- `POST /api/ai/analyze-real` - Real GPT-4/Claude analysis ⚡
- `POST /api/scripts/parse` - Parse screenplay structure

### Notifications
- `POST /api/notifications/whatsapp` - Send WhatsApp
- `POST /api/notifications/email` - Send Email 📧
- `POST /api/notifications/batch` - Batch notifications

### Other
- `POST /api/schedule/generate` - Generate schedule
- `POST /api/callsheet/generate` - Generate call sheet
- `POST /api/upload/script` - Upload script file

## Tamil Support

CinePilot is built for Tamil cinema first:
- Tamil script OCR
- Tanglish parsing
- Bilingual outputs (Tamil + English)
- Regional dialect recognition

## Advanced Features

### Real AI Analysis
Configure API keys to enable GPT-4/Claude analysis:
```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
```
Then use `/ai-tools` page with "Real AI" tab.

### Email Notifications
Set up SMTP to enable email:
```bash
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your@email.com"
export SMTP_PASS="app-password"
```

### Chart Components
Use built-in charts:
- BarChart, PieChart, ProgressRing
- Timeline, DataTable, KanbanBoard
- BudgetBreakdown, Heatmap

## License

Proprietary - All Rights Reserved
