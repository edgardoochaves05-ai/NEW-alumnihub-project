# Inbox & Messaging

## Overview

AlumniHub provides a messaging system that allows alumni, faculty, and staff to communicate directly. The inbox supports search, filtering, and integrates with the privacy/message request system.

## Features

### Conversation List
- Displays all conversations the user is part of
- Shows the other participant's name, avatar, and role
- Shows the last message preview and timestamp
- Shows unread message count per conversation

### Search Bar
Search conversations by the other participant's name. The search is case-insensitive and matches against first and last names.

```
GET /api/messages/conversations?search=Juan
```

### Filters

**Filter by Program:**
Show only conversations with alumni from a specific academic program (e.g., "BS Information Systems"). Useful for faculty who want to reach out to graduates of their department.

```
GET /api/messages/conversations?program=BS+Information+Systems
```

**Filter by Unread:**
Show only conversations that have unread messages.

```
GET /api/messages/conversations?unread_only=true
```

**Combined filters:**
```
GET /api/messages/conversations?search=Juan&program=BS+IS&unread_only=true
```

### Chat View
- Click a conversation to view the full message history
- Messages are ordered chronologically (oldest first)
- Each message shows sender name, avatar, content, and timestamp
- Unread messages are automatically marked as read when the conversation is opened

### Sending Messages
- Type a message and send within an existing conversation
- Start a new conversation by messaging from another user's profile
- If the recipient is private, the "Send Message" button is replaced with "Send Message Request"

## Message Requests

When an alumni's profile is set to private, other users (except faculty/admin) must send a message request before messaging them.

### Endpoints

```
GET    /api/message-requests/incoming     # Requests received by current user
GET    /api/message-requests/outgoing     # Requests sent by current user
POST   /api/message-requests              # Send a new request
PATCH  /api/message-requests/:id/accept   # Accept (auto-creates conversation)
PATCH  /api/message-requests/:id/decline  # Decline
```

### Message Request States

| Status | Description |
|--------|-------------|
| `pending` | Waiting for recipient to respond |
| `accepted` | Recipient accepted — conversation created |
| `declined` | Recipient declined — can be re-sent later |

### Accept Flow
When a request is accepted:
1. A new conversation is created
2. Both users are added as participants
3. If the request included an intro message, it becomes the first message
4. Both users can now message freely

## Realtime (Optional Enhancement)

Supabase Realtime can be enabled on the `messages` table to push new messages to the frontend without polling. To implement:

```javascript
// In the chat component
const channel = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    // Add new message to state
    setMessages(prev => [...prev, payload.new]);
  })
  .subscribe();
```

## Database Tables

### conversations
Simple container with `id`, `created_at`, `updated_at`.

### conversation_participants
Links profiles to conversations. Each conversation has 2 participants.

### messages
Each message belongs to a conversation and has a sender. `is_read` tracks read status.

### message_requests
Tracks pending, accepted, and declined requests between users. Unique constraint on `(sender_id, recipient_id)`.
