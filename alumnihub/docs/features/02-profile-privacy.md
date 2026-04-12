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

1. Alumni can toggle their profile to **private** via the Settings page
2. When `is_private = true`:
   - The profile is **hidden** from other alumni in search results and directory views
   - Faculty and admin can **always** see all profiles regardless of privacy setting
   - Other alumni cannot message the user directly
   - Instead, they must send a **message request**

### Message Request Flow

```
Alumni A wants to message private Alumni B:

1. Alumni A visits Alumni B's profile (if found via job board interaction, etc.)
2. System detects Alumni B is private
3. Instead of "Send Message", Alumni A sees "Send Message Request"
4. Alumni A writes an intro message and sends the request
5. Alumni B sees the request in their "Message Requests" page
6. Alumni B can:
   a. ACCEPT → A conversation is auto-created between them
   b. DECLINE → The request is marked declined, no conversation created
7. If accepted and the request had a message, it becomes the first chat message
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

### RLS Policies

- Alumni can only see profiles where `is_private = false` (plus their own)
- Faculty/Admin bypass the privacy filter and see all profiles
- Message requests are only visible to the sender and recipient

## Profile Verification

Faculty and admin can verify alumni profiles by calling `PATCH /api/profiles/:id/verify`. This sets `is_verified = true`, which can be displayed as a badge on the alumni's profile.
