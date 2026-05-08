# System Architecture

AlumniHub follows a three-tier architecture: Presentation, Logic, and Data.

## Tier Overview

### Presentation Tier (Frontend)
The React.js single-page application handles all user-facing interactions. It communicates with the Logic Tier via REST API calls and directly with Supabase for authentication and realtime subscriptions.

**Alumni can:** Update their own profile, upload CV, view AI career predictions, view AI-matched jobs, send/receive messages, manage message requests, browse announcements, view the advisor roster (read-only), and provide feedback. Cannot view the Alumni Directory or Student Directory.

**Students can:** Update their own profile, browse jobs, send/receive messages, manage message requests, and browse announcements. Cannot view the Alumni Directory or Student Directory.

**Career Advisors can:** View their assigned students via the Advisor Roster, access individual student career paths, view the general Student Directory, access analytics (Reports and Curriculum Impact), create notes and recommendations per student, browse announcements, and send/receive messages. Career advisor messages always go directly to Inbox (never routed to Message Requests). Career advisors always see full profiles regardless of privacy settings.

**Admins can:** View the Alumni Directory and Student Directory, manage advisor–student assignments via Advisor Management, access analytics (Reports, Curriculum Impact), manage job listings, manage announcements, and handle feedback. Admin always sees full profiles regardless of privacy settings. Admin does NOT have a personal profile or inbox.

### Logic Tier (Backend)
The Node.js + Express.js server contains all business logic, API endpoints, authentication middleware, and the AI analytics module. It uses the Supabase service role key for admin-level database access.

Key components:
- **Express.js RESTful APIs** — Route handling and request validation across 10 route modules
- **Supabase Auth verification** — JWT token validation middleware (`authenticate`)
- **Role-based authorization** — `authorize(...roles)` middleware that checks `req.profile.role` per endpoint
- **AI Analytics Engine** — Career prediction, job matching, and curriculum impact algorithms
- **Advisor Management** — Assignment tracking, notes, and recommendation system

### Data Tier (Database)
Supabase provides PostgreSQL with Row-Level Security. The database schema is managed through numbered SQL migration files.

Key components:
- **Supabase PostgreSQL** — All application data
- **Supabase Auth** — User accounts and JWT sessions
- **Supabase Storage** — CV file uploads (`cv-uploads` bucket)
- **Supabase Realtime** — Live message delivery

## User Roles

| Role | Constant | Description |
|------|----------|-------------|
| `alumni` | `ROLES.ALUMNI` | Registered alumni; default role on sign-up |
| `student` | *(no constant)* | Current enrolled students |
| `career_advisor` | `ROLES.CAREER_ADVISOR` | Faculty/career advisors; also stored as `"faculty"` in legacy records |
| `admin` | `ROLES.ADMIN` | System administrators; assigned via DB only |

The `AuthContext` exposes computed booleans: `isAlumni`, `isCareerAdvisor` (true for both `career_advisor` and `faculty`), and `isAdmin`.

## Route Access Matrix

| Route | alumni | student | career_advisor | admin |
|-------|--------|---------|----------------|-------|
| `/dashboard` | ✓ | ✓ | Redirects to `/advisor/roster` | ✓ |
| `/profile` | ✓ | ✓ | — | — |
| `/profile/:id` | ✓ | ✓ | ✓ | ✓ |
| `/alumni` (Alumni Directory) | — | — | — | ✓ |
| `/students` (Student Directory) | — | — | ✓ | ✓ |
| `/jobs` | ✓ | ✓ | ✓ | ✓ |
| `/messages` | ✓ | ✓ | ✓ | ✓ |
| `/settings` | ✓ | ✓ | ✓ | ✓ |
| `/career-prediction` | ✓ | — | — | — |
| `/advisor/roster` | — | — | ✓ | — |
| `/advisor/student/:id` | — | — | ✓ | — |
| `/advisor-management` | — | — | — | ✓ |
| `/reports` | — | — | ✓ | ✓ |
| `/curriculum-impact` | — | — | ✓ | ✓ |

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
                                      ├── authenticate (verify JWT → req.user, req.profile)
                                      ├── authorize (check role → 403 if denied)
                                      ├── Route handler (business logic)
                                      ├── AI module (predictions, matching, curriculum)
                                      │
                                      └──► Supabase PostgreSQL (data)
```

## Security Layers

1. **Supabase Auth** — Handles user registration, login, JWT issuance and refresh
2. **JWT Verification** — `authenticate` middleware validates the Bearer token on every protected API request
3. **Role-Based Access Control** — `authorize(...roles)` middleware enforces allowed roles per endpoint
4. **Row-Level Security** — PostgreSQL-level policies enforce data access rules even if the API is bypassed
5. **Privacy System** — Alumni and students can mark profiles as private (`is_private = true`); career advisors and admin always see full profiles; sending a message to a private profile requires an accepted message request first
6. **Registration Guard** — The registration endpoint rejects institutional email addresses (e.g. `@tip.edu.ph`); advisor and admin accounts are created via seeding scripts or admin assignment
7. **Rate Limiting** — 100 requests per 15 minutes per IP
8. **Helmet** — Security headers (XSS protection, content-type sniffing prevention, etc.)
