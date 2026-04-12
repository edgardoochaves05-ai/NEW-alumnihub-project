# AlumniHub

> A Web-Based Alumni Tracking System with AI-Powered Career Progress and Curriculum Impact Analytics for Higher Education Institutions (HEIs)

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React.js | UI components, SPA |
| Styling | Tailwind CSS | Responsive design |
| Charts | Recharts | Data visualization |
| Backend | Node.js + Express.js | API routing, logic |
| Database | Supabase (PostgreSQL) | Storage, queries, RLS |
| Auth | Supabase Auth | Authentication, roles |
| Realtime | Supabase Realtime | Live messaging |
| AI Module | Custom (JS) | Prediction, matching, analytics |

## Project Structure

```
alumnihub/
├── client/                    # React frontend
│   ├── public/                # Static assets
│   └── src/
│       ├── components/        # Reusable UI components
│       │   ├── layout/        # Sidebar, Navbar, Footer
│       │   ├── dashboard/     # Dashboard widgets
│       │   ├── profile/       # Profile management
│       │   ├── jobs/          # Job board components
│       │   ├── messaging/     # Inbox, chat
│       │   ├── analytics/     # Charts, reports
│       │   ├── auth/          # Login, register forms
│       │   └── common/        # Buttons, modals, cards
│       ├── pages/             # Route-level pages
│       ├── hooks/             # Custom React hooks
│       ├── services/          # API client functions
│       ├── utils/             # Helper functions
│       ├── styles/            # Global CSS / Tailwind config
│       └── context/           # React context providers
├── server/                    # Node.js + Express backend
│   ├── src/
│   │   ├── routes/            # API route definitions
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── services/          # Business logic
│   │   │   └── ai/           # AI module (prediction, matching, analytics)
│   │   ├── models/            # Database queries / Supabase client
│   │   ├── config/            # Environment config
│   │   └── utils/             # Server utilities
│   └── tests/                 # Backend tests
├── shared/                    # Shared between client & server
│   ├── types/                 # TypeScript interfaces (optional)
│   └── constants/             # Shared constants (roles, statuses)
├── docs/                      # Documentation
├── scripts/                   # Database migrations, seeds
├── .env.example               # Environment variable template
├── .gitignore
├── package.json               # Root package.json (workspaces)
└── README.md
```

## Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9
- A Supabase account (https://supabase.com)

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd alumnihub
npm install
```

### 2. Set Up Supabase
1. Create a new project at https://supabase.com
2. Go to Settings > API to get your project URL and anon key
3. Run the SQL migration in `scripts/001_create_tables.sql` in the Supabase SQL Editor
4. Copy `.env.example` to `.env` and fill in your credentials

### 3. Run Development Servers
```bash
# Start both client and server
npm run dev

# Or run separately:
npm run dev:client    # React on port 5173
npm run dev:server    # Express on port 3001
```

### 4. Default Roles
| Role | Access |
|------|--------|
| Alumni | Profile, career tracking, job board, messaging, predictions |
| Faculty | Alumni records, analytics dashboard, job posting, messaging |
| Admin (Alumni Office) | All features, system monitoring, content management |

## AI Features

### Career Path Prediction
Analyzes alumni career milestones to predict likely trajectories per program.

### Smart Job Matching
Ranks job postings by relevance to each alumni's profile using skill-based scoring.

### Curriculum Impact Analytics
Correlates academic programs with career outcomes for faculty insights.

## Scripts
- `scripts/001_create_tables.sql` — Database schema
- `scripts/002_seed_data.sql` — Sample data for development
- `scripts/003_rls_policies.sql` — Row-level security policies

## Team
- Aviles, Jasper T.
- Baitec, Jay Andrei B.
- Endaya, Kurt Russel D.
- Ochaves, Edgardo O.

IS 300 - Capstone Project 1 | Technological Institute of the Philippines
