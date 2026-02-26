# CinePilot - AI-Powered Pre-Production Platform

South Indian Cinema's First AI-Powered Pre-Production Suite.

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Database | PostgreSQL (via Prisma/Drizzle ORM) |
| Cache | Redis (sessions, AI response caching, rate limiting, pub/sub) |
| AI | AIML API (GPT-4o, Claude 3.5, Llama 3, Stable Diffusion, Whisper) |
| Auth | NextAuth.js or Clerk |
| Storage | Vercel Blob / S3 / Cloudflare R2 |

## Features

- Script Breakdown with Tamil language support
- AI Script Analysis (GPT-4o / Claude 3.5 via AIML API)
- Smart Scheduling with AI optimization
- Shot List Generator with AI suggestions
- DOOD (Day Out of Days) Report
- Budget Analysis and tracking
- Bilingual Call Sheet Generator (Tamil + English)
- Crew & Cast Management
- Location Management with Maps
- Equipment Inventory
- WhatsApp + Email Notifications
- Weather-Aware Scheduling
- Mission Control Dashboard
- Export to PDF/JSON/CSV
- Production Timeline (Gantt)
- AI Production Assistant Chatbot

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis

### Setup

```bash
cd frontend && npm install
```

### Development

```bash
cd frontend && npm run dev
```

Open http://localhost:3000

## Project Structure

```
cinepilot/
├── frontend/           # Next.js 14 app (UI + API routes)
│   ├── app/
│   │   ├── page.tsx            # Dashboard
│   │   ├── api/                # API Route Handlers
│   │   ├── scripts/            # Script management
│   │   ├── shot-list/          # Shot list generator
│   │   ├── schedule/           # Shooting schedule
│   │   ├── budget/             # Budget tracking
│   │   ├── crew/               # Crew management
│   │   ├── locations/          # Locations
│   │   ├── call-sheets/        # Call sheet generator
│   │   ├── ai-tools/           # AI analysis tools
│   │   ├── notifications/      # WhatsApp + Email
│   │   ├── mission-control/    # Production intelligence
│   │   └── settings/           # App settings
│   ├── components/             # Shared UI components
│   └── lib/                    # API client, types, utilities
├── database/                   # PostgreSQL schema
│   └── schema.sql
└── Enhance.md                  # Enhancement blueprint
```

## Tamil Cinema Focus

- Tamil script OCR and parsing
- Tanglish (Tamil + English) support
- Bilingual outputs (Tamil + English)
- Regional dialect recognition
- INR budgets (Crores/Lakhs)
- South Indian crew/location workflows

## License

Proprietary - All Rights Reserved
