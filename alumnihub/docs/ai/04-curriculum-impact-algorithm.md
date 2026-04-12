# Curriculum Impact Algorithm

## Purpose

Provides faculty with data-driven insights on how academic programs correlate with alumni career outcomes. Helps institutions evaluate which programs produce the most employable graduates and identify areas for curriculum improvement.

## Metrics Computed

### Employment Rate
```
employment_rate = (alumni_with_current_job_title / total_alumni) * 100
```

### Average Time to Employment
For each alumni with both a graduation year and career milestones:
1. Estimate graduation date as April of graduation year
2. Find their earliest job milestone (by start_date)
3. Calculate months between graduation and first job
4. Filter out unreasonable values (negative or >60 months)
5. Average the remaining values

### Top Industries / Job Titles / Companies
Aggregate the `industry`, `current_job_title`, and `current_company` fields across all alumni in the program. Count frequency, calculate percentage, and return the top 5.

**Output format:**
```json
[
  { "name": "Information Technology", "count": 20, "percentage": 44 },
  { "name": "IT Consulting", "count": 8, "percentage": 18 }
]
```

### Career Progression Score
A composite score (0-100) based on milestone quality:

| Factor | Points |
|--------|--------|
| Number of milestones | Up to 40 (10 per milestone, max 4) |
| Promotions | 15 per promotion |
| Certifications | 10 each |
| Awards | 10 each |

Score is capped at 100 per alumni, then averaged across all alumni in the program.

**Interpretation:**
- ≥70: Strong career progression
- 40-69: Moderate progression
- <40: Developing (early-career alumni or limited data)

### Skills Demand Alignment
Aggregates all skills from alumni profiles and career milestones. Counts how many alumni have each skill and calculates the percentage.

This shows which skills the program's graduates are actually using in the workforce, which faculty can compare against the current curriculum to identify gaps or strengths.

**Output format:**
```json
[
  { "skill": "javascript", "alumni_count": 30, "percentage": 67 },
  { "skill": "sql", "alumni_count": 28, "percentage": 62 }
]
```

Returns top 15 skills.

### AI-Generated Insights
A summary paragraph combining the key metrics into a readable narrative:

```
"Analysis of 45 alumni from BS Information Systems: Employment rate is 91.11%.
Graduates find employment in an average of 3.2 months. Top industries:
Information Technology (44%), IT Consulting (18%), Financial Technology (13%).
Most common roles: Software Developer, Systems Analyst. Career progression
is rated as moderate (62.5/100)."
```

## Additional Endpoints

### Overall Stats
`GET /api/analytics/dashboard` returns aggregated data across ALL programs:
- Total alumni count
- Total employed count
- Overall employment rate
- Per-program breakdown sorted by employment rate

### Available Programs
`GET /api/analytics/programs` returns a deduplicated list of all programs that have alumni data, used to populate filter dropdowns.

### Employment Trends
`GET /api/analytics/employment-trends` returns year-over-year data:
```json
[
  { "year": 2020, "total": 50, "employed": 42, "employmentRate": 84 },
  { "year": 2021, "total": 65, "employed": 58, "employmentRate": 89 },
  { "year": 2022, "total": 72, "employed": 68, "employmentRate": 94 }
]
```

## Filtering

Reports can be filtered by:
- **Program** (required) — e.g., "BS Information Systems"
- **Year range** (optional) — `yearStart` and `yearEnd` to scope the analysis

## Limitations

- Metrics are only as accurate as the data alumni provide
- Alumni who don't update their profiles skew employment rates downward
- Career progression scoring is a rough heuristic, not a validated metric
- Skills alignment shows what graduates use, not what the market demands (no external labor data)
- Time-to-employment assumes April graduation, which may not be accurate for all programs

## Future Improvements

- Cross-reference with external job market data (e.g., JobStreet, LinkedIn trends)
- Track changes over time (compare this year's report vs last year's)
- Add geographic distribution analytics (where alumni work)
- Factor in salary data for economic impact analysis
- Allow comparison between programs side-by-side
