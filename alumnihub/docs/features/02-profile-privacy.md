# Profile & Privacy System

## Profile Fields

Alumni profiles contain personal information, academic history, and professional details:

- **Personal:** Name, email, phone, date of birth, gender, address, city, avatar, bio
- **Academic:** Student number, program, department, graduation year, batch year
- **Professional:** Current job title, company, industry, skills array, LinkedIn URL
- **CV:** Uploaded CV file URL (stored in Supabase Storage)
- **Privacy:** `is_private` toggle (default: `false`)
- **Verification:** `is_verified` flag (set by faculty/admin)

## Privacy System

### How It Works

1. Alumni and students can toggle their profile to **private** via the Settings page
2. When `is_private = true`:
   - The profile body (career info, milestones, etc.) is **hidden** from other alumni/students
   - A "Private Profile" wall is shown instead, with only a "Send Request" button visible
   - **Admin and Faculty always see the full profile**, bypassing the privacy wall entirely
   - Other alumni/students cannot message the user directly
   - Instead, they must send a **message request**

### Role-Based Privacy Exceptions

| Viewer Role | Sees Full Profile? | Can Message Directly? |
|-------------|-------------------|----------------------|
| Alumni / Student | ❌ (sees privacy wall) | ❌ (must send request) |
| Faculty | ✅ (bypasses wall) | ✅ (goes straight to Inbox) |
| Admin | ✅ (bypasses wall) | ❌ (Admin has no inbox) |

**Faculty Messaging Exception:** Faculty always send messages directly to the recipient's Inbox, even if the recipient's profile is private. The message request flow is skipped entirely for faculty senders.

### Message Request Flow

```
Alumni A wants to message private Alumni B:

1. Alumni A visits Alumni B's profile
2. System detects Alumni B is private AND viewer is not faculty/admin
3. A "Private Profile" wall is shown — full profile content is hidden
4. Instead of "Message", Alumni A sees "Send Request" button
5. Alumni A writes an intro message and sends the request
6. Alumni B sees the request in their Inbox → Requests tab
7. Alumni B can:
   a. ACCEPT → A conversation is auto-created between them
   b. DECLINE → The request is marked declined, no conversation created
8. If accepted and the request had a message, it becomes the first chat message

Faculty visiting the same private Alumni B:
- Sees the FULL profile (no privacy wall)
- Sees a "Message" button (not "Send Request")
- Message goes directly to Alumni B's Inbox
```

### Re-sending Declined Requests

If a request was previously declined, the sender can re-send it. The existing record is updated back to "pending" status rather than creating a duplicate.

### Database

**profiles table:**
```sql
is_private BOOLEAN DEFAULT FALSE
```

**message_requests table:**
```sql
id, sender_id, recipient_id, message, status ('pending'|'accepted'|'declined'), created_at, updated_at
```

### Frontend Privacy Flags

Two boolean flags are derived in `ProfilePage.jsx` before rendering:

```js
// Show privacy wall (hides full profile body)
const isPrivateOther = !isOwnProfile && !!profile.is_private
  && !["admin", "faculty"].includes(authProfile?.role);

// Route message to Requests instead of Inbox
const isMsgRequest = !isOwnProfile && !!profile.is_private
  && authProfile?.role !== "faculty";
```

These flags drive all conditional UI: the privacy wall, the button label ("Message" vs "Send Request"), the modal title and warning text, and which API endpoint is called on send.

### RLS Policies

- Alumni can only see profiles where `is_private = false` (plus their own)
- Faculty/Admin bypass the privacy filter and see all profiles
- Message requests are only visible to the sender and recipient

## Profile Verification

Faculty and admin can verify alumni profiles by calling `PATCH /api/profiles/:id/verify`. This sets `is_verified = true`, which can be displayed as a badge on the alumni's profile.
