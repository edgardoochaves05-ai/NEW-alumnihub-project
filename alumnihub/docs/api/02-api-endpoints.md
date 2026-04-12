# API Endpoints

## Auth

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/auth/register` | No | — | Create new account |
| GET | `/api/auth/me` | Yes | All | Get current user + profile |

## Profiles

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/profiles/me` | Yes | All | Get own profile with milestones |
| PUT | `/api/profiles/me` | Yes | All | Update own profile |
| GET | `/api/profiles/alumni` | Yes | All | List alumni (with search/filter) |
| GET | `/api/profiles/:id` | Yes | All | Get profile by ID |
| PATCH | `/api/profiles/:id/verify` | Yes | Faculty, Admin | Verify an alumni |

### Alumni List Query Params
| Param | Type | Description |
|-------|------|-------------|
| search | string | Search by name or email |
| program | string | Filter by program |
| department | string | Filter by department |
| graduation_year | integer | Filter by year |
| page | integer | Page number |
| limit | integer | Items per page |

## Career & CV

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/career/:profileId/milestones` | Yes | All | Get milestones for a profile |
| POST | `/api/career/milestones` | Yes | Alumni | Add a milestone |
| PUT | `/api/career/milestones/:id` | Yes | Alumni | Update own milestone |
| DELETE | `/api/career/milestones/:id` | Yes | Alumni | Delete own milestone |
| POST | `/api/career/upload-cv` | Yes | Alumni | Upload CV for AI parsing |
| GET | `/api/career/cv-parsed` | Yes | Alumni | Get latest parsed CV data |
| POST | `/api/career/cv-parsed/:id/confirm` | Yes | Alumni | Confirm AI-parsed milestones |

### Upload CV Body
```json
{ "fileBase64": "...", "fileName": "resume.pdf", "mimeType": "application/pdf" }
```

### Confirm Milestones Body
```json
{
  "milestones": [
    { "title": "Developer", "company": "Accenture", "start_date": "2023-01", ... }
  ]
}
```

## Jobs

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/jobs` | Yes | All | List jobs (with search/filter) |
| GET | `/api/jobs/matched` | Yes | Alumni | Get AI-matched jobs |
| GET | `/api/jobs/:id` | Yes | All | Get single job |
| POST | `/api/jobs` | Yes | All | Create job listing |
| PUT | `/api/jobs/:id` | Yes | Owner/Admin | Update job |
| DELETE | `/api/jobs/:id` | Yes | Owner/Admin | Delete job |

### Job List Query Params
| Param | Type | Description |
|-------|------|-------------|
| search | string | Search by title or company |
| industry | string | Filter by industry |
| job_type | string | full-time, part-time, contract, internship, freelance |
| experience_level | string | entry, mid, senior, executive |
| page | integer | Page number |

## Messages

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/messages/conversations` | Yes | All | List conversations (with search/filter) |
| GET | `/api/messages/:conversationId` | Yes | All | Get messages in conversation |
| POST | `/api/messages` | Yes | All | Send a message |

### Conversations Query Params
| Param | Type | Description |
|-------|------|-------------|
| search | string | Search by participant name |
| program | string | Filter by participant's program |
| unread_only | boolean | Show only unread conversations |

### Send Message Body
```json
{ "recipientId": "uuid", "content": "Hello!", "conversationId": "uuid (optional)" }
```

## Message Requests

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/message-requests/incoming` | Yes | All | Requests received |
| GET | `/api/message-requests/outgoing` | Yes | All | Requests sent |
| POST | `/api/message-requests` | Yes | All | Send request to private user |
| PATCH | `/api/message-requests/:id/accept` | Yes | Recipient | Accept request |
| PATCH | `/api/message-requests/:id/decline` | Yes | Recipient | Decline request |

### Send Request Body
```json
{ "recipientId": "uuid", "message": "Hi, I'd like to connect about..." }
```

## Analytics (AI)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/analytics/dashboard` | Yes | Faculty, Admin | Overall stats |
| GET | `/api/analytics/career-prediction/:profileId` | Yes | Alumni (own), Faculty | Generate predictions |
| GET | `/api/analytics/job-matches` | Yes | Alumni | Compute job match scores |
| GET | `/api/analytics/curriculum-impact` | Yes | Faculty, Admin | Program impact report |
| GET | `/api/analytics/programs` | Yes | Faculty, Admin | List available programs |
| GET | `/api/analytics/employment-trends` | Yes | Faculty, Admin | Year-over-year trends |

### Curriculum Impact Query Params
| Param | Type | Description |
|-------|------|-------------|
| program | string | Required — program name |
| yearStart | integer | Optional — start year filter |
| yearEnd | integer | Optional — end year filter |

## Feedback

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/feedback` | Yes | All | Submit feedback |
| GET | `/api/feedback` | Yes | All (own) / Admin (all) | List feedback |
| PATCH | `/api/feedback/:id` | Yes | Admin | Update status/respond |
