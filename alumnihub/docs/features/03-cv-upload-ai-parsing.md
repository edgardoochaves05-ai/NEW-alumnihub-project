# CV Upload & AI Parsing

## Overview

Alumni do NOT manually enter career milestones. Instead, they upload a CV/resume file, and the system uses AI to automatically extract career milestones, skills, and education history.

## Upload Flow

```
1. Alumni navigates to My Profile page
2. Clicks "Upload CV" and selects a PDF or DOCX file
3. File is uploaded to Supabase Storage (bucket: cv-uploads)
4. A cv_parsed_data record is created with status "processing"
5. AI service extracts text from the file
6. AI parses the text into structured milestones
7. Status changes to "parsed"
8. Alumni reviews the extracted milestones on their profile
9. Alumni can edit, remove, or confirm each milestone
10. On confirmation, milestones are inserted into career_milestones table
11. Extracted skills are merged into the profile's skills array
12. Status changes to "confirmed"
```

## API Endpoints

### Upload CV
```
POST /api/career/upload-cv
Body: { fileBase64, fileName, mimeType }
Response: { cvUrl, parsedRecordId, message }
```

### Get Parsed Data
```
GET /api/career/cv-parsed
Response: { id, profile_id, cv_url, parsed_milestones, parsed_skills, status }
```

### Confirm Milestones
```
POST /api/career/cv-parsed/:id/confirm
Body: { milestones: [...] }
Response: { message, milestones: [...inserted] }
```

## Database Tables

### cv_parsed_data
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| profile_id | UUID | References profiles |
| cv_url | TEXT | URL to uploaded file |
| raw_text | TEXT | Extracted text from CV |
| parsed_milestones | JSONB | AI-extracted milestones (before confirmation) |
| parsed_skills | TEXT[] | AI-extracted skills |
| parsed_education | JSONB | AI-extracted education history |
| status | VARCHAR | processing → parsed → confirmed (or failed) |

### Expected parsed_milestones format (JSONB)
```json
[
  {
    "title": "Software Developer",
    "company": "Accenture Philippines",
    "industry": "Information Technology",
    "start_date": "2023-06",
    "end_date": null,
    "is_current": true,
    "location": "Quezon City",
    "description": "Developed web applications using React and Node.js",
    "skills_used": ["React", "Node.js", "PostgreSQL"],
    "milestone_type": "job"
  },
  {
    "title": "IT Intern",
    "company": "Globe Telecom",
    "industry": "Telecommunications",
    "start_date": "2022-06",
    "end_date": "2022-09",
    "is_current": false,
    "location": "Taguig",
    "description": "Assisted in system testing and documentation",
    "skills_used": ["Testing", "Documentation", "SQL"],
    "milestone_type": "job"
  }
]
```

## AI Implementation (TODO)

The AI parsing is currently stubbed. The intended implementation:

1. **Text Extraction:** Use `pdf-parse` for PDFs or `mammoth` for DOCX files to extract raw text
2. **AI Parsing:** Send the extracted text to an AI API (e.g., Anthropic Claude API) with a structured prompt asking it to extract career milestones, skills, and education in JSON format
3. **Storage:** Store the parsed results in `cv_parsed_data.parsed_milestones`
4. **Review:** Present the results to the alumni for confirmation

### Suggested AI Prompt Structure
```
Extract career milestones from this CV text. Return a JSON array where each item has:
- title (job title)
- company
- industry
- start_date (YYYY-MM format)
- end_date (YYYY-MM or null if current)
- is_current (boolean)
- location
- description (brief summary)
- skills_used (array of skills)
- milestone_type (job, promotion, certification, award, education)

Also extract:
- skills: array of all technical and soft skills mentioned
- education: array of {degree, institution, year}

CV Text:
[insert extracted text here]
```

## File Storage

CVs are stored in Supabase Storage under: `cv-uploads/{user_id}/{timestamp}_{filename}`

Each user's files are in their own folder, enforced by the storage RLS policy.
