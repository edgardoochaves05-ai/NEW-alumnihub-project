# CLAUDE.md — AlumniHub Project Context

## What is AlumniHub?
A web-based alumni tracking system with AI-powered career analytics for Higher Education Institutions (HEIs) in the Philippines. Built as a capstone project for IS 300 at the Technological Institute of the Philippines.

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js + Express.js (ES modules)
- **Database:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Charts:** Recharts
- **Icons:** Lucide React
- **HTTP Client:** Axios

## Project Structure
```
alumnihub/
├── client/          → React frontend (Vite, port 5173)
├── server/          → Express API (port 3001)
├── shared/          → Shared constants/types
├── scripts/         → SQL migrations (run in Supabase SQL Editor)
└── CLAUDE.md        → You are here
```

## Running the Project
```bash
npm install          # Install all workspace deps
npm run dev          # Start both client (5173) and server (3001)
npm run dev:client   # Frontend only
npm run dev:server   # Backend only
```

## User Roles
| Role | Access |
|------|--------|
| **alumni** | Profile (with CV upload), jobs, inbox, message requests, career prediction, settings. CANNOT see Alumni Directory. |
| **faculty** | Profile, alumni directory, jobs, inbox, reports, curriculum impact, career prediction, settings. |
| **admin** | Alumni directory, jobs, inbox, reports, curriculum impact, settings. CANNOT see My Profile (admin is not an alumni). |

## Key Business Rules

### Privacy System
- Alumni can set their profile to **private** (`is_private = true` in profiles table)
- Private profiles are hidden from other alumni in search/directory
- Faculty/Admin can always see all profiles
- To message a private user, you must send a **message request** first
- The private user can **accept** or **decline** the request
- Accepting auto-creates a conversation; declining blocks the sender

### CV Upload & AI Parsing (Career Milestones)
- Alumni do NOT manually add career milestones
- Instead, they **upload a CV/resume** file (PDF/DOCX)
- The system uses AI to **extract career milestones** from the CV
- Extracted milestones are stored in `cv_parsed_data` with status "processing" → "parsed"
- Alumni **review and confirm** which milestones to add
- Confirmed milestones are inserted into `career_milestones` table
- Skills are also extracted and merged into the profile's `skills` array
- **TODO:** Implement actual AI text extraction and parsing (currently stubbed)

### Inbox Features
- Search bar to search conversations by participant name
- Filter by **program** (e.g., show only conversations with BS IT alumni)
- Filter by **unread messages only**
- These filters are query params: `?search=Juan&program=BS+IS&unread_only=true`

### Job Postings
- All roles can view and post jobs
- Search by title/company via `?search=developer`
- Filter by industry, job_type, experience_level
- AI Smart Job Matching ranks jobs by relevance to alumni profile

### AI Features
1. **Career Path Prediction** — Analyzes peer alumni milestones to predict career trajectories
2. **Smart Job Matching** — Multi-factor scoring: skills (40%), industry (25%), experience (20%), program (15%)
3. **Curriculum Impact Analytics** — Faculty-only: employment rates, top industries, progression scores per program

## Database Tables
profiles, career_milestones, job_listings, job_match_scores, career_predictions, curriculum_impact, conversations, conversation_participants, messages, message_requests, cv_parsed_data, feedback, announcements

## API Routes
```
POST   /api/auth/register
GET    /api/auth/me

GET    /api/profiles/me
PUT    /api/profiles/me
GET    /api/profiles/alumni?search=&program=&graduation_year=&page=
GET    /api/profiles/:id
PATCH  /api/profiles/:id/verify

GET    /api/career/:profileId/milestones
POST   /api/career/milestones
PUT    /api/career/milestones/:id
DELETE /api/career/milestones/:id
POST   /api/career/upload-cv
GET    /api/career/cv-parsed
POST   /api/career/cv-parsed/:id/confirm

GET    /api/jobs?search=&industry=&job_type=&experience_level=&page=
GET    /api/jobs/matched
GET    /api/jobs/:id
POST   /api/jobs
PUT    /api/jobs/:id
DELETE /api/jobs/:id

GET    /api/messages/conversations?search=&program=&unread_only=
GET    /api/messages/:conversationId
POST   /api/messages

GET    /api/message-requests/incoming
GET    /api/message-requests/outgoing
POST   /api/message-requests
PATCH  /api/message-requests/:id/accept
PATCH  /api/message-requests/:id/decline

GET    /api/analytics/dashboard
GET    /api/analytics/career-prediction/:profileId
GET    /api/analytics/job-matches
GET    /api/analytics/curriculum-impact?program=&yearStart=&yearEnd=
GET    /api/analytics/programs
GET    /api/analytics/employment-trends

POST   /api/feedback
GET    /api/feedback
PATCH  /api/feedback/:id
```

## Supabase Setup
1. Create a project at supabase.com
2. Run `scripts/001_create_tables.sql` in SQL Editor
3. Run `scripts/003_rls_policies.sql` in SQL Editor
4. Create a storage bucket called `cv-uploads` (public)
5. Copy project URL + anon key + service role key into `.env`

## Styling Guidelines
- Use Tailwind utility classes (no separate CSS files per component)
- Dark sidebar (gray-900) with blue-600 accents
- Cards use `bg-white rounded-xl shadow-sm border border-gray-200 p-6`
- Buttons: `btn-primary` (blue), `btn-secondary` (white/border), `btn-danger` (red)
- Use Lucide React icons consistently
- Font: Inter (loaded via Google Fonts in index.html)

## What Needs Building
The project is scaffolded with route stubs. The following pages need full UI implementation:
1. LoginPage & RegisterPage — Forms with Supabase Auth
2. DashboardPage — Stats cards + recent announcements + charts
3. ProfilePage — Personal info form + CV upload + AI-parsed milestones review
4. AlumniListPage — Table with search/filter (faculty/admin only)
5. JobsPage — Job cards with search bar + filters + AI match scores
6. MessagesPage — Conversation list (with search/filter) + chat view
7. MessageRequestsPage — Incoming requests with accept/decline
8. ReportsPage — Analytics dashboard with Recharts (faculty/admin)
9. CareerPredictionPage — Prediction results with trajectory visualization
10. CurriculumImpactPage — Program analytics with charts (faculty/admin)
11. SettingsPage — Privacy toggle, account settings
