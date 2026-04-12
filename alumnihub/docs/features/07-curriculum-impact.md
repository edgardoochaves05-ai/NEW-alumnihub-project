# Curriculum Impact Analytics

## Overview

Curriculum Impact Analytics provides faculty and administrators with data-driven insights on how academic programs correlate with alumni career outcomes. This feature helps institutions evaluate program effectiveness and make evidence-based decisions for curriculum development.

## Who Can Access

- **Faculty** and **Admin** only

## Metrics Generated

| Metric | Description |
|--------|-------------|
| Employment Rate | Percentage of alumni currently employed |
| Avg. Time to Employment | Average months between graduation and first job |
| Top Industries | Most common industries where graduates work |
| Top Job Titles | Most common roles held by graduates |
| Top Companies | Most common employers |
| Career Progression Score | Composite score based on milestones, promotions, certifications |
| Skills Demand Alignment | Most common skills across alumni (indicates curriculum-market fit) |
| AI-Generated Insights | Summary paragraph with key findings |

## API Endpoints

```
GET /api/analytics/curriculum-impact?program=BS+Information+Systems&yearStart=2020&yearEnd=2024
GET /api/analytics/programs                    # List all programs for dropdown
GET /api/analytics/dashboard                   # Aggregated stats across all programs
GET /api/analytics/employment-trends           # Year-over-year employment rates
```

## Report Output Example

```json
{
  "program": "BS Information Systems",
  "department": "College of Information Technology",
  "graduation_year_range": "2020-2024",
  "total_alumni_analyzed": 45,
  "employment_rate": 91.11,
  "avg_time_to_employment_months": 3.2,
  "top_industries": [
    { "name": "Information Technology", "count": 20, "percentage": 44 },
    { "name": "IT Consulting", "count": 8, "percentage": 18 },
    { "name": "Financial Technology", "count": 6, "percentage": 13 }
  ],
  "top_job_titles": [
    { "name": "Software Developer", "count": 12, "percentage": 27 },
    { "name": "Systems Analyst", "count": 7, "percentage": 16 }
  ],
  "avg_career_progression_score": 62.5,
  "skills_demand_alignment": [
    { "skill": "javascript", "alumni_count": 30, "percentage": 67 },
    { "skill": "sql", "alumni_count": 28, "percentage": 62 },
    { "skill": "python", "alumni_count": 18, "percentage": 40 }
  ],
  "insights": "Analysis of 45 alumni from BS Information Systems: Employment rate is 91.11%. Graduates find employment in an average of 3.2 months. Top industries: Information Technology (44%), IT Consulting (18%), Financial Technology (13%). Most common roles: Software Developer, Systems Analyst. Career progression is rated as moderate (62.5/100)."
}
```

## Visualization

The Curriculum Impact page should display:
- Program selector dropdown (populated from `/api/analytics/programs`)
- Optional year range filter
- Employment rate gauge or stat card
- Top industries bar/pie chart (Recharts)
- Top job titles bar chart
- Skills demand alignment horizontal bar chart
- Career progression score gauge
- AI-generated insights summary text
- Year-over-year employment trend line chart (from `/api/analytics/employment-trends`)

For algorithm details, see [Curriculum Impact Algorithm](../ai/04-curriculum-impact-algorithm.md).
