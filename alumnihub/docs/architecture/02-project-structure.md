# Project Structure

## Root Layout

```
alumnihub/
├── client/                    # React frontend application
├── server/                    # Express.js backend API
├── shared/                    # Code shared between client and server
├── scripts/                   # Database migration SQL files
├── docs/                      # Project documentation (you are here)
├── .env.example               # Environment variable template
├── .gitignore                 # Git ignore rules
├── package.json               # Root package.json (npm workspaces)
├── CLAUDE.md                  # Context file for Claude Code
└── README.md                  # Project overview
```

## Client (Frontend)

```
client/
├── public/                    # Static assets (favicon, images)
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── layout/            # Layout.jsx (sidebar + main content shell)
│   │   ├── dashboard/         # Dashboard-specific widgets
│   │   ├── profile/           # Profile form, CV upload, milestone cards
│   │   ├── jobs/              # Job cards, filters, match badges
│   │   ├── messaging/         # Conversation list, chat bubbles
│   │   ├── analytics/         # Chart components (Recharts wrappers)
│   │   ├── auth/              # Login/Register form components
│   │   └── common/            # Buttons, modals, cards, inputs
│   ├── pages/                 # Route-level page components
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── AlumniListPage.jsx
│   │   ├── JobsPage.jsx
│   │   ├── MessagesPage.jsx
│   │   ├── MessageRequestsPage.jsx
│   │   ├── ReportsPage.jsx
│   │   ├── CareerPredictionPage.jsx
│   │   ├── CurriculumImpactPage.jsx
│   │   └── SettingsPage.jsx
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API client and Supabase config
│   │   ├── supabase.js        # Supabase client initialization
│   │   └── api.js             # Axios instance + all service functions
│   ├── utils/                 # Helper functions (formatting, validation)
│   ├── styles/
│   │   └── index.css          # Tailwind directives + custom component classes
│   ├── context/
│   │   └── AuthContext.jsx    # Auth state provider (user, profile, role)
│   ├── App.jsx                # Root component with routing
│   └── main.jsx               # Entry point (ReactDOM.render)
├── index.html                 # HTML template
├── vite.config.js             # Vite configuration (proxy to backend)
├── tailwind.config.js         # Tailwind theme customization
├── postcss.config.js          # PostCSS plugins
└── package.json               # Frontend dependencies
```

## Server (Backend)

```
server/
├── src/
│   ├── routes/                # Express route definitions
│   │   ├── auth.js            # POST /register, GET /me
│   │   ├── profiles.js        # CRUD profiles, alumni list, verify
│   │   ├── career.js          # Milestones CRUD, CV upload, AI parsing
│   │   ├── jobs.js            # Job CRUD, matched jobs
│   │   ├── messages.js        # Conversations, messages (with search/filter)
│   │   ├── messageRequests.js # Send, accept, decline message requests
│   │   ├── analytics.js       # AI endpoints (prediction, matching, curriculum)
│   │   └── feedback.js        # Submit, list, update feedback
│   ├── middleware/
│   │   └── auth.js            # JWT verification + role authorization
│   ├── services/
│   │   └── ai/                # AI module
│   │       ├── index.js       # Exports all AI services
│   │       ├── careerPrediction.js
│   │       ├── jobMatching.js
│   │       └── curriculumImpact.js
│   ├── config/
│   │   └── supabase.js        # Supabase admin client (service role)
│   ├── models/                # Database query helpers (optional)
│   ├── utils/                 # Server utilities
│   └── index.js               # Express app entry point
├── tests/                     # Backend tests
└── package.json               # Server dependencies
```

## Shared

```
shared/
├── constants/
│   └── index.js               # Roles, job types, statuses, etc.
└── types/                     # TypeScript interfaces (optional)
```

## Scripts (Database)

```
scripts/
├── 001_create_tables.sql      # Full schema: 13 tables with indexes and triggers
├── 002_seed_data.sql          # Sample data instructions for development
└── 003_rls_policies.sql       # Row-Level Security policies for all tables
```
