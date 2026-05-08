# Project Structure

## Root Layout

```
alumnihub/
├── client/                    # React frontend application
├── server/                    # Express.js backend API
├── shared/                    # Code shared between client and server
├── scripts/                   # Database migration SQL files + seeding scripts
├── docs/                      # Project documentation (you are here)
├── .env.example               # Environment variable template
├── .gitignore                 # Git ignore rules
├── package.json               # Root package.json (npm workspaces + concurrently)
├── CLAUDE.md                  # Context file for Claude Code
└── README.md                  # Project overview
```

## Client (Frontend)

```
client/
├── public/                    # Static assets (favicon, images)
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── layout/
│   │   │   └── Layout.jsx     # Sidebar + main content shell (role-aware nav)
│   │   ├── ConfirmDialog.jsx  # Generic confirmation modal
│   │   └── JobMatchAnalytics.jsx  # AI job match score display component
│   ├── pages/                 # Route-level page components
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── AlumniListPage.jsx          # Admin only
│   │   ├── StudentDirectoryPage.jsx    # Admin only
│   │   ├── JobsPage.jsx
│   │   ├── MessagesPage.jsx
│   │   ├── MessageRequestsPage.jsx
│   │   ├── AnnouncementsPage.jsx
│   │   ├── ReportsPage.jsx             # Admin only
│   │   ├── CareerPredictionPage.jsx    # Alumni only
│   │   ├── CurriculumImpactPage.jsx    # Admin only
│   │   ├── AdvisorRosterPage.jsx       # Career advisor only
│   │   ├── StudentCareerPathPage.jsx   # Career advisor only
│   │   ├── AdvisorManagementPage.jsx   # Admin only
│   │   └── SettingsPage.jsx
│   ├── context/
│   │   └── AuthContext.jsx    # Auth state provider (user, profile, role booleans)
│   ├── services/
│   │   ├── supabase.js        # Supabase client initialization (auth, realtime, storage)
│   │   └── api.js             # Axios instance + all API service functions
│   ├── styles/
│   │   └── index.css          # Tailwind directives + custom component classes
│   ├── App.jsx                # Root component with routing + ProtectedRoute
│   └── main.jsx               # Entry point (ReactDOM.render)
├── index.html                 # HTML template
├── vite.config.js             # Vite configuration (proxy /api → port 3001)
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
│   │   ├── profiles.js        # CRUD profiles, alumni/student lists, role/verify
│   │   ├── career.js          # Milestones CRUD, CV upload, AI parsing confirmation
│   │   ├── jobs.js            # Job CRUD, matched jobs, view/inquiry tracking
│   │   ├── messages.js        # Conversations + messages (with search/filter)
│   │   ├── messageRequests.js # Send, accept, decline message requests
│   │   ├── announcements.js   # Create + list announcements, comments
│   │   ├── advisor.js         # Roster, assignments, notes, recommendations
│   │   ├── analytics.js       # AI endpoints (prediction, matching, curriculum, trends)
│   │   └── feedback.js        # Submit, list, update feedback
│   ├── middleware/
│   │   └── auth.js            # JWT verification (authenticate) + role check (authorize)
│   ├── services/
│   │   └── ai/                # AI analytics module
│   │       ├── index.js       # Exports all AI services + getOverallStats
│   │       ├── careerPrediction.js   # Peer-based career trajectory engine
│   │       ├── jobMatching.js        # Multi-factor job scoring engine
│   │       └── curriculumImpact.js   # Program outcome analytics engine
│   ├── config/
│   │   └── supabase.js        # Supabase admin client (service role key)
│   ├── app.js                 # Express app setup (middleware, routes, health check)
│   └── index.js               # Server entry point (listen on port 3001)
└── package.json               # Server dependencies
```

## Shared

```
shared/
├── constants/
│   └── index.js               # ROLES, JOB_TYPES, EXPERIENCE_LEVELS,
│                              # MILESTONE_TYPES, FEEDBACK_CATEGORIES,
│                              # MESSAGE_REQUEST_STATUSES, CV_PARSE_STATUSES
└── types/                     # TypeScript interfaces (optional, not yet used)
```

## Scripts (Database & Seeding)

```
scripts/
├── SQL Migrations (run in Supabase SQL Editor, in order):
│   ├── 001_create_tables.sql              # Full schema: core tables, indexes, triggers
│   ├── 002_seed_data.sql                  # Sample data for development
│   ├── 003_rls_policies.sql               # Row-Level Security policies
│   ├── 004_add_student_role.sql           # Student role support
│   ├── 004_career_advisor.sql             # Career advisor schema + policies
│   ├── 005_job_metrics.sql                # Job interaction tracking tables
│   ├── 005_seed_admin.sql                 # Seed admin account
│   ├── 006_fix_trigger.sql                # handle_new_user trigger fixes
│   ├── 007_migrate_roles.sql              # Role migration logic
│   ├── 007_seed_dummy_accounts.sql        # Dummy test accounts
│   ├── 008_add_announcement_category.sql  # Announcement category column
│   ├── 009_fix_profile_insert_policy.sql  # RLS policy fix for registration
│   └── 010_seed_55_dummy_accounts.sql     # Large batch of realistic dummy data
│
└── Node.js Seeding Utilities:
    ├── create-admin.mjs              # Create admin account
    ├── create-advisor.mjs            # Create career advisor account
    ├── create-alumni2.mjs            # Create alumni accounts
    ├── create-student2.mjs           # Create student accounts
    ├── fix-missing-profiles.mjs      # Repair profiles missing from auth sync
    ├── seed-career-milestones.mjs    # Populate career milestone data
    ├── seed-dummy-accounts.mjs       # Batch dummy user creation
    ├── seed-dummy-jobs.mjs           # Populate job listings
    ├── seed-profile-details.mjs      # Populate profile fields
    ├── seed-unemployed-alumni.mjs    # Seed unemployed alumni scenarios
    └── seed-unemployed-alumni-batch2.mjs
```
