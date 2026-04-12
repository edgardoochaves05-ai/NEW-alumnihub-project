# User Roles & Permissions

## Role Definitions

### Alumni
Graduates of the institution who use the platform to manage their career profiles, connect with peers, and access job opportunities.

### Faculty
Professors and staff members who monitor alumni progress, manage records, post job opportunities, and access analytics dashboards.

### Admin (Alumni Office)
System administrators who oversee platform operations, manage content, generate reports, and handle system feedback.

## Access Matrix

| Feature | Alumni | Faculty | Admin |
|---------|--------|---------|-------|
| Dashboard | ✅ | ✅ | ✅ |
| My Profile | ✅ | ✅ | ❌ |
| Alumni Directory | ❌ | ✅ | ✅ |
| View Other Profiles | ✅ (public only) | ✅ (all) | ✅ (all) |
| Job Board | ✅ | ✅ | ✅ |
| Post Jobs | ✅ | ✅ | ✅ |
| Inbox / Messaging | ✅ | ✅ | ✅ |
| Message Requests | ✅ (send & receive) | ✅ (send only) | ✅ (send only) |
| Career Prediction | ✅ (own) | ✅ (any alumni) | ❌ |
| Reports / Analytics | ❌ | ✅ | ✅ |
| Curriculum Impact | ❌ | ✅ | ✅ |
| CV Upload | ✅ | ❌ | ❌ |
| Privacy Toggle | ✅ | ❌ | ❌ |
| Verify Alumni | ❌ | ✅ | ✅ |
| Manage Feedback | ❌ | ❌ | ✅ |
| Post Announcements | ❌ | ✅ | ✅ |
| Settings | ✅ | ✅ | ✅ |

## Navigation Items Per Role

### Alumni Sidebar
1. Dashboard
2. My Profile
3. Jobs
4. Inbox
5. Message Requests
6. Career Prediction
7. Settings

### Faculty Sidebar
1. Dashboard
2. My Profile
3. Alumni Directory
4. Jobs
5. Inbox
6. Career Prediction
7. Reports
8. Curriculum Impact
9. Settings

### Admin Sidebar
1. Dashboard
2. Alumni Directory
3. Jobs
4. Inbox
5. Reports
6. Curriculum Impact
7. Settings

## Why These Restrictions?

- **Alumni can't see the directory** — The directory is an administrative tool for faculty/admin to manage and verify alumni records. Alumni interact with each other through messaging and the job board.
- **Admin has no profile** — The admin role represents the Alumni Office, not an individual graduate. Admin accounts don't need personal career profiles.
- **Only alumni can upload CVs** — CV upload drives the career milestone extraction feature, which is specific to alumni career tracking.
- **Only alumni can toggle privacy** — Faculty and admin profiles are institutional and should always be accessible.
