# AI Resume Autofill: Implementation Plan

This document outlines the step-by-step structure to implement the AI CV/Resume parser that automatically populates the `ProfilePage.jsx` fields.

## 1. Overview of the Flow

1. **User uploads a CV (PDF/DOCX)** on the Profile Page.
2. **Frontend sends the file** to the backend (`/api/career/upload-cv`).
3. **Backend extracts text** from the file using a library (e.g., `pdf-parse` for PDFs).
4. **Backend sends the text to an LLM** (e.g., Gemini, OpenAI, or Anthropic) with a strict JSON schema.
5. **Backend returns the parsed JSON** back to the frontend.
6. **Frontend updates the `form` state** with the extracted profile fields, sets `editing` to `true`, and queues the milestones for review.

---

## 2. Backend Implementation (`server/src/routes/career.js`)

You need to update the `/upload-cv` endpoint. Currently, it saves the file to Supabase and marks it as `processing`. We will add the actual parsing logic here.

### A. Extract Text from File
Install a text extraction package:
```bash
npm install pdf-parse
```
Read the uploaded `fileBuffer` and convert it to plain text.

### B. Prompt the LLM
Send the extracted text to your AI service with a prompt requiring **JSON output**. Use this specific JSON schema to match your `ProfilePage.jsx` state:

```json
{
  "profile": {
    "first_name": "String",
    "last_name": "String",
    "phone": "String",
    "address": "String",
    "city": "String",
    "bio": "String (Summary of the candidate)",
    "current_job_title": "String",
    "current_company": "String",
    "industry": "String",
    "linkedin_url": "String",
    "graduation_year": "Number (YYYY) or null",
    "skills": ["Array of Strings"]
  },
  "milestones": [
    {
      "title": "String",
      "company": "String",
      "industry": "String",
      "location": "String",
      "description": "String",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD (null if current)",
      "is_current": "Boolean",
      "milestone_type": "job | education | certification | award"
    }
  ]
}
```

### C. Return Parsed Data to Frontend
Update the response of `/upload-cv` to include the parsed JSON:
```javascript
res.status(201).json({
  message: "CV processed successfully.",
  cvUrl,
  parsedData: aiGeneratedJson // The JSON object returned by the LLM
});
```

---

## 3. Frontend Implementation (`client/src/pages/ProfilePage.jsx`)

Update the `handleCVUpload` function to receive the data and immediately populate the fields so the user can review them before saving.

### A. Update `handleCVUpload`

```javascript
async function handleCVUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // ... existing validation code ...

  setUploading(true); 
  setUploadMsg("Extracting details from CV...");
  
  try {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(",")[1];
      
      // Send to backend and await response
      const { data } = await api.post("/career/upload-cv", {
        fileBase64: base64,
        fileName: file.name,
        mimeType: file.type,
      });

      // 1. Automatically fill out the profile form fields
      if (data.parsedData?.profile) {
        setForm((prevForm) => ({
          ...prevForm,
          // Only overwrite empty fields, or overwrite all based on your preference
          first_name: prevForm.first_name || data.parsedData.profile.first_name || "",
          last_name: prevForm.last_name || data.parsedData.profile.last_name || "",
          phone: prevForm.phone || data.parsedData.profile.phone || "",
          city: prevForm.city || data.parsedData.profile.city || "",
          bio: prevForm.bio || data.parsedData.profile.bio || "",
          current_job_title: prevForm.current_job_title || data.parsedData.profile.current_job_title || "",
          current_company: prevForm.current_company || data.parsedData.profile.current_company || "",
          industry: prevForm.industry || data.parsedData.profile.industry || "",
          skills: [...new Set([...prevForm.skills, ...(data.parsedData.profile.skills || [])])]
        }));
        
        // 2. Open edit mode so the user sees the filled fields immediately
        setEditing(true);
      }

      setUploadMsg("CV processed! Please review the filled fields and save.");
      setUploading(false);
      
      // Optionally trigger the milestone confirmation flow here if there are milestones
      // e.g., setParsedMilestones(data.parsedData.milestones); setShowMilestoneReview(true);
    };
    reader.readAsDataURL(file);
  } catch (err) {
    setUploadMsg("Failed to parse CV.");
    setUploading(false);
  }
}
```

---

## 4. Checklist for Development

- [ ] **Backend**: Install `pdf-parse` (or similar) to read file contents from the buffer.
- [ ] **Backend**: Create a prompt for the AI service requesting strict JSON output based on the provided schema.
- [ ] **Backend**: Parse the AI response and update `/upload-cv` to return the `parsedData` object.
- [ ] **Frontend**: Modify `handleCVUpload` to merge the incoming `profile` data into the `form` state.
- [ ] **Frontend**: Automatically set `editing` to `true` when data is successfully mapped so the user can verify the AI's extraction before clicking "Save".
- [ ] **Optional**: Feed the AI-extracted `milestones` array into the existing `/cv-parsed/:id/confirm` endpoint flow.
