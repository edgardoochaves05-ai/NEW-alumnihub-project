# Career Advice Feature (Dedicated Page & Dashboard Widget)

## 1. Feature Overview
The Career Advice feature provides a dedicated channel for students to receive structured guidance from their Career Advisor. This feature ensures that specific inputs from the advisor—specifically **Private Notes** and **Recommendations**—are automatically piped directly to the student. 

To provide a better UX, this feature requires two integrated UI components for the student:
1. **A Dedicated Career Advice Page** (Full view accessible via the sidebar).
2. **A Career Advice Window/Widget** (Quick dropdown view/notifications on the dashboard).

## 2. Data Source (Advisor Interface)
Based on the advisor's view of the student roster:
- When a Career Advisor views a student profile, they see specific tabs including: **Career Timeline**, **Skills Progression**, **Private Notes**, and **Recommendations**.
- **Action Trigger:** Whenever the Advisor creates a new "Private Note" or "Recommendation" via these tabs, the system will instantly push this data directly to the student's `Career Advice` view rather than keeping it strictly for internal advisor records.

## 3. UI/UX Placement (Student Interface)

### A. Dedicated Career Advice Page (Full View)
- **Sidebar Menu:** A new navigation link added to the main left sidebar named "Career Advice" (e.g., with a clipboard or lightbulb icon).
- **Page Layout:** This page serves as a long-form history log where the student can read all past and present guidance.
  - Features dedicated sections or filterable tabs for **Recommendations** and **Private Notes**.
  - Students can review their progression based on the advisor's notes here over time.

### B. Career Advice Window (Dashboard Widget & Notifications)
- **Location:** Inside the top navigation header on the Dashboard page, located at the far right beside the `Welcome, [Student Name]` greeting.
- **Behavior:** This acts as a notification center specifically for advice. When a new Note or Recommendation is added by the advisor:
  1. A red notification dot appears on the icon.
  2. Clicking the icon opens a floating popover (dropdown panel) showing a preview of the newest Note/Recommendation.
  3. Clicking the preview inside the window will **redirect the student to the full Career Advice Page**.

## 4. Frontend Component Structure
To implement this feature in React, construct the following:

- **Sidebar Integration:** Update `Sidebar.jsx` or `Layout.jsx` to include the `/career-advice` protected route.
- **`CareerAdvicePage.jsx`:** The full-screen component displaying the feed of Recommendations and Notes.
- **`DashboardTopNav.jsx`:** Includes the new widget icon.
- **`CareerAdviceWidget.jsx`:** The popover dropdown showing the latest items and unread counts.

## 5. Backend and Database Integration

### Database Adjustments (Supabase)
Instead of modifying general messages, this requires a targeted data fetch:
- If `private_notes` and `recommendations` are currently stored in their own tables (or as metadata on profiles), ensure they include a `student_id` and `advisor_id`.
- Add an `is_read_by_student` boolean column to these tables to track the notification badge counts natively.

### API Endpoints:
- **`GET /api/advice/student/:id`**: Fetches the combined list of Recommendations and Private Notes for the specific student.
- **`GET /api/advice/unread-count`**: Counts all Notes/Recommendations where `is_read_by_student = false`.
- **`PATCH /api/advice/mark-read`**: Called when the student opens the Widget or visits the Page, clearing the red notification balloon.

## 6. Expected User Flow
1. **Advisor inputs advice:** The Career Advisor navigates to "Steve Lawrence", clicks the "Recommendations" or "Private Notes" tab, and submits a new note.
2. **Real-time push:** Supabase triggers a realtime event notifying the student's active session.
3. **Student Widget updates:** A notification badge appears on the Dashboard widget (e.g., "1 Unread Recommendation").
4. **Student checks widget:** The student clicks the widget, sees a preview of the recommendation, and clicks on it.
5. **Student visits Page:** The system routes them to the new **Career Advice Page**, clearing the notification, where they can read the full recommendation context.
