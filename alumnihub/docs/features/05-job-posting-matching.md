# Job Posting & Smart Matching

## Job Board

All authenticated users can view and post job listings. The job board includes search and filter capabilities.

### Search
Search jobs by title or company name:
```
GET /api/jobs?search=developer
```

### Filters

| Filter | Query Param | Values |
|--------|------------|--------|
| Industry | `industry` | Any string (e.g., "Information Technology") |
| Job Type | `job_type` | full-time, part-time, contract, internship, freelance |
| Experience Level | `experience_level` | entry, mid, senior, executive |
| Page | `page` | Page number (default: 1) |

### Combined Example
```
GET /api/jobs?search=developer&industry=Information+Technology&job_type=full-time&experience_level=entry&page=1
```

## Job Listing Fields

| Field | Type | Description |
|-------|------|-------------|
| title | VARCHAR(200) | Job title |
| company | VARCHAR(200) | Company name |
| description | TEXT | Full job description |
| requirements | TEXT | Job requirements |
| location | VARCHAR(200) | Work location |
| job_type | VARCHAR(50) | Employment type |
| industry | VARCHAR(200) | Industry category |
| salary_min / salary_max | NUMERIC | Salary range |
| salary_currency | VARCHAR(10) | Default: PHP |
| required_skills | TEXT[] | Array of required skills (used for AI matching) |
| experience_level | VARCHAR(50) | Required experience level |
| application_url | TEXT | External application link |
| application_email | VARCHAR(255) | Application email |
| is_active | BOOLEAN | Whether the listing is visible |
| expires_at | TIMESTAMPTZ | Optional expiration date |

## AI Smart Job Matching

The Smart Job Matching engine ranks job listings by relevance to each alumni's profile using a multi-factor weighted scoring system.

### How It Works

When an alumni requests their matched jobs (`GET /api/analytics/job-matches`), the system:

1. Fetches the alumni's profile and career milestones
2. Fetches all active job listings
3. Computes a match score for each job
4. Stores scores in `job_match_scores` table
5. Returns jobs sorted by match score (highest first)

### Scoring Weights

| Factor | Weight | What It Measures |
|--------|--------|-----------------|
| Skills | 40% | Overlap between alumni skills and job required_skills |
| Industry | 25% | Match between alumni's industry and job's industry |
| Experience | 20% | Fit between alumni's years of experience and required level |
| Program | 15% | Relevance of alumni's academic program to the job's industry |

### Score Breakdown Example

```json
{
  "totalScore": 85,
  "skillScore": 80,
  "matchingSkills": ["JavaScript", "React", "SQL"],
  "industryScore": 100,
  "experienceScore": 75,
  "programScore": 100
}
```

### Viewing Matched Jobs

Alumni see their matched jobs on the Jobs page with match percentage badges:
- 80-100%: Green badge — "Strong Match"
- 60-79%: Yellow badge — "Good Match"
- Below 60%: Gray badge — "Partial Match"

For more details on the matching algorithm, see [Smart Job Matching Algorithm](../ai/03-job-matching-algorithm.md).
