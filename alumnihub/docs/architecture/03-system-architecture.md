# System Architecture

AlumniHub follows a three-tier architecture: Presentation, Logic, and Data.

## Tier Overview

### Presentation Tier (Frontend)
The React.js single-page application handles all user-facing interactions. It communicates with the Logic Tier via REST API calls and directly with Supabase for authentication and realtime subscriptions.

**Alumni can:** Update profile, upload CV, view career predictions, view matched jobs, send/receive messages, manage message requests, provide feedback.

**Faculty can:** All alumni features plus view alumni directory, access analytics dashboard, view reports, view curriculum impact analytics.

**Admin can:** View alumni directory, manage alumni records, access analytics, manage content (announcements, jobs), handle feedback, system monitoring. Admin does NOT have a personal profile.

### Logic Tier (Backend)
The Node.js + Express.js server contains all business logic, API endpoints, authentication middleware, and the AI analytics module. It uses the Supabase service role key for admin-level database access.

Key components:
- **Express.js RESTful APIs** — Route handling and request validation
- **Supabase Auth verification** — JWT token validation middleware
- **Role-based authorization** — Middleware that checks user role per endpoint
- **AI Analytics Engine** — Career prediction, job matching, curriculum impact algorithms

### Data Tier (Database)
Supabase provides PostgreSQL with Row-Level Security. The database contains 13 tables covering user profiles, career data, jobs, messaging, AI results, and system management.

Key components:
- **Supabase PostgreSQL** — All application data
- **Supabase Auth** — User accounts and sessions
- **Supabase Storage** — CV file uploads
- **Supabase Realtime** — Live message delivery

## Data Flow

```
User Browser
    │
    ├── Auth requests ──────────► Supabase Auth (JWT tokens)
    ├── Realtime subscriptions ─► Supabase Realtime (messages)
    ├── File uploads ───────────► Supabase Storage (CVs)
    │
    └── API requests ───────────► Express.js Server (port 3001)
                                      │
                                      ├── Auth middleware (verify JWT)
                                      ├── Role middleware (check permissions)
                                      ├── Route handler (business logic)
                                      ├── AI module (predictions, matching)
                                      │
                                      └──► Supabase PostgreSQL (data)
```

## Security Layers

1. **Supabase Auth** — Handles user registration, login, JWT issuance
2. **JWT Verification** — Server middleware validates tokens on every API request
3. **Role-Based Access** — Server middleware checks user role against allowed roles per endpoint
4. **Row-Level Security** — Database-level policies enforce data access rules even if API is bypassed
5. **Privacy System** — Alumni can make profiles private, requiring message requests before contact
6. **Rate Limiting** — 100 requests per 15 minutes per IP
7. **Helmet** — Security headers (XSS protection, content type sniffing, etc.)
