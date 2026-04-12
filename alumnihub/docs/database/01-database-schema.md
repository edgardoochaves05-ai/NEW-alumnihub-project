# Database Schema

## Entity Relationship Overview

```
profiles ──────┬──── career_milestones
               ├──── job_listings
               ├──── job_match_scores ──── job_listings
               ├──── career_predictions
               ├──── cv_parsed_data
               ├──── conversation_participants ──── conversations ──── messages
               ├──── message_requests (sender + recipient)
               ├──── feedback
               └──── announcements

curriculum_impact (standalone analytics table)
```

## Tables

### profiles
Extends `auth.users`. Auto-created via trigger on user signup.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | References auth.users |
| role | VARCHAR(20) | alumni, faculty, admin |
| first_name, last_name | VARCHAR(100) | |
| email | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(20) | |
| date_of_birth | DATE | |
| gender | VARCHAR(20) | |
| address | TEXT | |
| city | VARCHAR(100) | |
| avatar_url | TEXT | |
| bio | TEXT | |
| student_number | VARCHAR(50) | Alumni only |
| program | VARCHAR(200) | e.g., "BS Information Systems" |
| department | VARCHAR(200) | |
| graduation_year | INTEGER | |
| batch_year | INTEGER | |
| current_job_title | VARCHAR(200) | |
| current_company | VARCHAR(200) | |
| industry | VARCHAR(200) | |
| skills | TEXT[] | Array for AI matching |
| linkedin_url | VARCHAR(500) | |
| cv_url | TEXT | Uploaded CV file URL |
| is_private | BOOLEAN | Default: false |
| is_verified | BOOLEAN | Default: false |
| is_active | BOOLEAN | Default: true |

### career_milestones
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| profile_id | UUID (FK) | References profiles |
| title | VARCHAR(200) | Job title |
| company | VARCHAR(200) | |
| industry | VARCHAR(200) | |
| description | TEXT | |
| milestone_type | VARCHAR(50) | job, promotion, certification, award, education, other |
| start_date | DATE | |
| end_date | DATE | NULL = current |
| is_current | BOOLEAN | |
| location | VARCHAR(200) | |
| salary_range | VARCHAR(50) | Optional |
| skills_used | TEXT[] | |

### job_listings
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| posted_by | UUID (FK) | References profiles |
| title | VARCHAR(200) | |
| company | VARCHAR(200) | |
| description | TEXT | |
| requirements | TEXT | |
| location | VARCHAR(200) | |
| job_type | VARCHAR(50) | full-time, part-time, contract, internship, freelance |
| industry | VARCHAR(200) | |
| salary_min, salary_max | NUMERIC | |
| salary_currency | VARCHAR(10) | Default: PHP |
| required_skills | TEXT[] | For AI matching |
| experience_level | VARCHAR(50) | entry, mid, senior, executive |
| application_url | TEXT | |
| application_email | VARCHAR(255) | |
| is_active | BOOLEAN | |
| expires_at | TIMESTAMPTZ | |

### job_match_scores
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| profile_id | UUID (FK) | |
| job_id | UUID (FK) | |
| match_score | NUMERIC(5,2) | 0-100 |
| matching_skills | TEXT[] | Skills that matched |
| score_breakdown | JSONB | Detailed per-factor scores |
| Unique constraint | | (profile_id, job_id) |

### career_predictions
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| profile_id | UUID (FK) | |
| predicted_role | VARCHAR(200) | |
| predicted_industry | VARCHAR(200) | |
| confidence_score | NUMERIC(5,2) | 0-100 |
| time_horizon | VARCHAR(50) | e.g., "1-2 years" |
| based_on_sample_size | INTEGER | |
| reasoning | TEXT | |
| prediction_data | JSONB | Full details |

### curriculum_impact
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| program | VARCHAR(200) | |
| department | VARCHAR(200) | |
| graduation_year_range | VARCHAR(50) | |
| total_alumni_analyzed | INTEGER | |
| employment_rate | NUMERIC(5,2) | |
| avg_time_to_employment_months | NUMERIC(5,1) | |
| top_industries | JSONB | |
| top_job_titles | JSONB | |
| top_companies | JSONB | |
| avg_career_progression_score | NUMERIC(5,2) | |
| skills_demand_alignment | JSONB | |
| insights | TEXT | AI-generated summary |

### conversations
| Column | Type |
|--------|------|
| id | UUID (PK) |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

### conversation_participants
| Column | Type | Notes |
|--------|------|-------|
| conversation_id | UUID (PK, FK) | |
| profile_id | UUID (PK, FK) | |
| joined_at | TIMESTAMPTZ | |
| last_read_at | TIMESTAMPTZ | |

### messages
| Column | Type |
|--------|------|
| id | UUID (PK) |
| conversation_id | UUID (FK) |
| sender_id | UUID (FK) |
| content | TEXT |
| is_read | BOOLEAN |
| created_at | TIMESTAMPTZ |

### message_requests
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| sender_id | UUID (FK) | |
| recipient_id | UUID (FK) | |
| message | TEXT | Optional intro message |
| status | VARCHAR(20) | pending, accepted, declined |
| Unique constraint | | (sender_id, recipient_id) |

### cv_parsed_data
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| profile_id | UUID (FK) | |
| cv_url | TEXT | |
| raw_text | TEXT | Extracted text from CV |
| parsed_milestones | JSONB | AI-extracted milestones |
| parsed_skills | TEXT[] | AI-extracted skills |
| parsed_education | JSONB | AI-extracted education |
| status | VARCHAR(20) | processing, parsed, confirmed, failed |

### feedback
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| submitted_by | UUID (FK) | |
| category | VARCHAR(50) | bug, feature, general, complaint, suggestion |
| subject | VARCHAR(200) | |
| message | TEXT | |
| status | VARCHAR(20) | pending, reviewed, resolved, dismissed |
| admin_response | TEXT | |

### announcements
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| posted_by | UUID (FK) | |
| title | VARCHAR(200) | |
| content | TEXT | |
| is_published | BOOLEAN | |
| target_audience | VARCHAR(20) | all, alumni, faculty |
