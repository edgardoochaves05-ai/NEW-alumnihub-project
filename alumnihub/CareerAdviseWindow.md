# Career Advice Window (Dashboard Widget)

## 1. Feature Overview
The Career Advice Window is a dedicated notification and messaging interface located on the student's Dashboard. It serves as a direct line of communication between Students and Career Advisors. 

When a Career Advisor sends advice, a message, or a reply to a student, the student will receive a real-time notification on their dashboard. They can read the advice and directly reply from this lightweight window without needing to navigate to the full Inbox page.

## 2. UI/UX Placement & Behavior
- **Location:** Inside the top navigation header on the Dashboard page, located at the far right beside the `Welcome, [Student Name]` greeting.
- **Icon Trigger:** A distinctive icon (e.g., a Lightbulb, Briefcase, or a Chat Bubble) will serve as the toggle for the window.
- **Notification Badge:** A visual indicator (such as a red dot with an unread count) will appear on the icon whenever the student receives new advice or a reply from an advisor.
- **Window Interface:** A floating popover (dropdown panel) or a slide-out drawer that appears when the icon is clicked. 

## 3. Frontend Component Structure
To implement this feature in React, the following component structure should be created:

- `DashboardTopNav.jsx` / `Header.jsx`: The container holding the Welcome message and the new icon widget.
- `CareerAdviceWidget.jsx`: The wrapper component handling the state (open/closed) and the realtime unread count.
- `CareerAdviceWindow.jsx`: The dropdown modal/panel that opens.
  - `AdviceThreadList.jsx`: Displays the conversational thread of advice/messages.
  - `AdviceReplyInput.jsx`: A text box and "Send" button allowing the student to respond back to the advisor.

## 4. Backend and Database Integration
Since AlumniHub uses Express and Supabase, the following backend architecture is required:

### Database (Supabase)
This feature seamlessly reuses the existing `messages` table but filters it specifically for interactions involving the "Career Advisor" role.

### Realtime Notifications (Supabase Realtime)
- The frontend will subscribe to the `messages` table, filtering for the current student's `id` as the receiver.
- When an advisor sends a message, a realtime event triggers the frontend to increment the notification badge count instantly.

### Express API Endpoints Needed:
- **`GET /api/messages/advice/unread`**: Fetches the total number of unread pieces of advice from advisors.
- **`GET /api/messages/advice`**: Retrieves the context thread of messages specifically between the student and career advisors.
- **`POST /api/messages/advice/reply`**: Allows the student to send a reply back to the advisor.

## 5. Expected User Flows

### Flow 1: Student Receives Advice
1. A Career Advisor sends advice to the student via their system.
2. Supabase Realtime pushes the event to the student's active browser session.
3. The red notification badge increments beside `Welcome, [Name]` on the far right.
4. The student clicks the icon to open the `CareerAdviceWindow`.
5. The student reads the message, triggering an API call to mark the message as "read".

### Flow 2: Student Replies to Advisor
1. Inside the open `CareerAdviceWindow`, the student types a response into the input field and clicks "Send".
2. The API inserts the new message into the database.
3. The message is appended locally to the chat window, and the response is immediately routed to the Career Advisor's main inbox.
