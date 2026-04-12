# AI Module Overview

## Three AI Features

AlumniHub includes three AI-powered features that transform raw alumni data into actionable insights. These features are implemented as custom algorithms in JavaScript running on the Express server.

### 1. Career Path Prediction
Predicts likely career trajectories for alumni based on the career progression patterns of peers from the same academic program.

**Input:** Alumni profile + career milestones from same-program peers
**Output:** Up to 3 predicted next roles with confidence scores and timeframes
**Location:** `server/src/services/ai/careerPrediction.js`

### 2. Smart Job Matching
Ranks job listings by relevance to each alumni's profile using a multi-factor weighted scoring system.

**Input:** Alumni profile (skills, industry, experience, program) + all active job listings
**Output:** Match scores (0-100) with breakdowns per factor
**Location:** `server/src/services/ai/jobMatching.js`

### 3. Curriculum Impact Analytics
Analyzes correlations between academic programs and alumni career outcomes to provide actionable insights for faculty.

**Input:** All alumni data from a specific program
**Output:** Employment rates, top industries, progression scores, skills alignment
**Location:** `server/src/services/ai/curriculumImpact.js`

## Design Philosophy

These AI features use **statistical analysis and pattern recognition** rather than machine learning models. This approach was chosen because:

- No external ML service dependencies or API costs
- No model training required (works with available data immediately)
- Transparent and explainable results
- Feasible within the capstone development timeline
- Accuracy improves naturally as more alumni data is added

## Data Dependencies

The AI features depend on alumni filling out their profiles and confirming career milestones from CV uploads. With fewer than 3 alumni profiles in a program, the Career Path Prediction will return insufficient data warnings. The more data in the system, the more accurate and useful all three features become.

## Where AI Results Are Stored

| Feature | Storage Table | Recomputed |
|---------|--------------|------------|
| Career Prediction | `career_predictions` | On demand per request |
| Job Matching | `job_match_scores` | On demand per request |
| Curriculum Impact | `curriculum_impact` | On demand per request |

All results are stored for historical reference and can be retrieved without recomputation.
