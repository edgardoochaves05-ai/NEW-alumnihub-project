# Career Path Prediction

## Overview

The Career Path Prediction feature analyzes historical career data from alumni in the same academic program to predict likely career trajectories for a given alumni.

## Who Can Access

- **Alumni** can view their own predictions
- **Faculty** can view predictions for any alumni
- **Admin** does not access this feature

## How It Works

1. The system finds the target alumni's program and current career position
2. It queries all other alumni from the same program who have career milestone data
3. It analyzes their career progression patterns (role transitions, industries, timing)
4. It identifies the most common next roles and industries
5. It generates up to 3 predictions with confidence scores

### Minimum Data Requirement
At least 3 alumni from the same program with career milestones are needed. If insufficient data exists, the system returns a message explaining this.

## Prediction Output

Each prediction includes:

| Field | Description |
|-------|-------------|
| role | Predicted next job title |
| industry | Predicted industry |
| confidence | Confidence percentage (0-100%) |
| timeHorizon | Expected timeframe ("0-1 years", "1-2 years", etc.) |
| peerCount | How many alumni followed this path |
| reasoning | Human-readable explanation |

### Example Response
```json
{
  "predictions": [
    {
      "role": "Software Engineer",
      "industry": "Information Technology",
      "confidence": 68,
      "timeHorizon": "1-2 years",
      "peerCount": 12,
      "reasoning": "Based on 12 alumni from BS Information Systems who followed similar career paths. 68% of peers in comparable roles transitioned to Software Engineer within 1-2 years."
    },
    {
      "role": "Project Manager",
      "industry": "IT Consulting",
      "confidence": 40,
      "timeHorizon": "2-3 years",
      "peerCount": 7,
      "reasoning": "Based on 7 alumni from BS Information Systems..."
    }
  ],
  "sample_size": 25
}
```

## API Endpoints

```
GET /api/analytics/career-prediction/:profileId    # Generate new predictions
```

Predictions are stored in the `career_predictions` table for historical reference.

## Visualization

The Career Prediction page should display:
- A timeline or flowchart showing predicted career paths
- Confidence score bars for each prediction
- Peer count context ("Based on X alumni")
- Time horizon indicators

For algorithm details, see [Career Prediction Algorithm](../ai/02-career-prediction-algorithm.md).
