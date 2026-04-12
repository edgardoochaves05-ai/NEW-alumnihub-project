# Smart Job Matching Algorithm

## Scoring System

Each job is scored against an alumni profile using four weighted factors:

| Factor | Weight | Max Score |
|--------|--------|-----------|
| Skills Match | 40% | 100 |
| Industry Alignment | 25% | 100 |
| Experience Level Fit | 20% | 100 |
| Program Relevance | 15% | 100 |

**Total Score** = (Skills × 0.40) + (Industry × 0.25) + (Experience × 0.20) + (Program × 0.15)

Capped at 100.

## Factor Details

### Skills Match (40%)

Compares the alumni's skills (from profile + all milestone `skills_used`) against the job's `required_skills`.

```
matching_skills = intersection of alumni skills and job skills
score = round((matching_skills.length / job_skills.length) * 100)
```

Matching uses substring inclusion (case-insensitive), so "React.js" matches "React" and vice versa.

If the job has no required skills listed, a neutral score of 50 is assigned.

**Example:**
- Alumni skills: JavaScript, React, Node.js, SQL, Python
- Job requires: React, TypeScript, SQL, GraphQL
- Matching: React, SQL (2 out of 4)
- Score: 50

### Industry Alignment (25%)

Compares the alumni's current industry and milestone industries against the job's industry.

| Condition | Score |
|-----------|-------|
| Exact match with current industry | 100 |
| Match with any milestone industry | 80 |
| Partial string match | 60 |
| No match | 20 |
| Job has no industry specified | 50 |

### Experience Level Fit (20%)

Estimates the alumni's years of experience from their milestones and compares against the job's required level.

**Experience level mapping:**
| Level | Expected Years |
|-------|---------------|
| entry | 0 |
| mid | 2 |
| senior | 5 |
| executive | 10 |

**Scoring based on difference:**
| Years Difference | Score |
|-----------------|-------|
| ±1 year | 100 |
| ±2 years | 75 |
| ±3 years | 50 |
| >3 years | 25 |

### Program Relevance (15%)

Maps academic programs to relevant industries using a predefined lookup:

```javascript
{
  "information systems": ["information technology", "software", "consulting", "fintech"],
  "information technology": ["information technology", "software", "networking", "cybersecurity"],
  "computer science": ["software", "information technology", "ai", "data science"],
  "business administration": ["consulting", "finance", "marketing", "management"],
  "engineering": ["engineering", "manufacturing", "construction", "technology"]
}
```

If the alumni's program maps to the job's industry → 100. Otherwise → 40. Unknown programs → 50.

## Match Score Display

| Score Range | Label | Badge Color |
|------------|-------|-------------|
| 80-100 | Strong Match | Green |
| 60-79 | Good Match | Yellow |
| 40-59 | Partial Match | Gray |
| 0-39 | Low Match | — (not shown) |

## Storage

Match scores are upserted into `job_match_scores` with a unique constraint on `(profile_id, job_id)`. This means scores are updated (not duplicated) when recomputed.

## Limitations

- Skills matching is keyword-based, not semantic (e.g., "JS" won't match "JavaScript")
- The program-to-industry mapping is hardcoded and limited
- Salary preferences are not factored in
- Location proximity is not considered
- Scores are computed on demand, not in real-time when jobs are posted

## Future Improvements

- Use NLP for semantic skill matching
- Factor in location preferences and remote work options
- Add salary range compatibility scoring
- Compute scores automatically when new jobs are posted via database triggers or background jobs
- Allow alumni to set job search preferences that influence scoring
