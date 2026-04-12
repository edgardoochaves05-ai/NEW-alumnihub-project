# Career Path Prediction Algorithm

## Algorithm Steps

### Step 1: Get Target Profile
Fetch the alumni's profile, program, and current career milestones. Identify their current role (the milestone with `is_current = true`).

### Step 2: Find Peer Alumni
Query all other alumni from the **same program** who have career milestone data. Exclude the target alumni. If fewer than 3 peers exist, return an insufficient data message.

### Step 3: Analyze Career Paths
For each peer alumni, sort their milestones chronologically and extract **role transitions** (from one job to the next).

```
Peer A milestones: Intern → Junior Dev → Software Engineer → Tech Lead
Transitions: Intern→Junior Dev, Junior Dev→Software Engineer, Software Engineer→Tech Lead

Peer B milestones: Intern → Junior Dev → Software Engineer → Project Manager
Transitions: Intern→Junior Dev, Junior Dev→Software Engineer, Software Engineer→Project Manager
```

For each transition, track:
- The destination role and industry
- How many peers made this transition
- The time between transitions (in months)

### Step 4: Aggregate Patterns
Group transitions by destination role+industry. Count frequency and calculate average transition time.

```
Software Engineer (IT): 15 peers, avg 18 months
Project Manager (IT): 8 peers, avg 30 months
Data Analyst (Fintech): 5 peers, avg 24 months
```

### Step 5: Generate Predictions
Take the top 3 most common career paths. For each:

**Confidence Score:**
```
confidence = min(95, round((path_count / total_peers) * 100))
```
Capped at 95% to avoid overconfidence.

**Time Horizon:**
Based on average transition time:
- ≤12 months → "0-1 years"
- ≤24 months → "1-2 years"
- ≤36 months → "2-3 years"
- >36 months → "3-5 years"

**Reasoning:**
A human-readable string explaining the prediction with peer count and program context.

### Step 6: Store Results
Predictions are inserted into the `career_predictions` table for historical tracking.

## Limitations

- Accuracy depends heavily on data volume — more alumni profiles mean better predictions
- The algorithm treats all programs equally; it doesn't account for program curriculum changes over time
- Career paths are based on title patterns, not actual job responsibilities
- Salary data is optional and not factored into predictions
- The algorithm uses simple frequency analysis, not advanced ML techniques

## Future Improvements

- Weight more recent alumni data higher than older data
- Factor in skills overlap between the target alumni and peers
- Use clustering to group similar career paths rather than just counting transitions
- Integrate external labor market data for industry trend awareness
