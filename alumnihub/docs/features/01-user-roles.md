# User Roles & Permissions

## Role Definitions

### Student
Currently enrolled students who use the platform to build their profile, browse job opportunities, and stay informed through announcements.

### Alumni
Graduates of the institution who manage their career profiles, connect with the network, upload CVs, and access job opportunities.

### Faculty
Professors and staff members who monitor alumni and student records, post job opportunities, and access analytics dashboards.

### Admin (Alumni Office)
System administrators who oversee platform operations, manage content, generate reports, and access all analytical tools.

---

## Access Matrix

| Feature                    | Student | Alumni | Faculty | Admin |
|----------------------------|---------|--------|---------|-------|
| **Dashboard**              | ✅ Announcements only | ✅ Personal stats & job matches | ✅ Full analytics | ✅ Full analytics |
| **My Profile**             | ✅ | ✅ | ✅ | ❌ |
| **Alumni Directory**       | ❌ | ❌ | ✅ | ✅ |
| **Student Directory**      | ❌ | ❌ | ✅ | ✅ |
| **Jobs — View**            | ✅ | ✅ | ✅ | ✅ |
| **Jobs — Post**            | ✅ | ✅ | ✅ | ✅ |
| **Inbox / Messaging**      | ✅ | ✅ | ✅ | ❌ |
| **Career Prediction**      | ❌ | ❌ | ✅ | ✅ |
| **Reports / Analytics**    | ❌ | ❌ | ✅ | ✅ |
| **Curriculum Impact**      | ❌ | ❌ | ✅ | ✅ |
| **Settings**               | ✅ | ✅ | ✅ | ✅ |

---

## Profile Page — Section Access

| Profile Section            | Student | Alumni | Faculty | Admin |
|----------------------------|---------|--------|---------|-------|
| Personal Information       | ✅ | ✅ | ✅ | ✅ |
| Academic Information       | ✅ | ✅ | ❌ | ❌ |
| Professional Information   | ❌ | ✅ | ✅ | ✅ |
| Skills                     | ✅ | ✅ | ❌ | ❌ |
| Upload CV / Resume         | ✅ | ✅ | ❌ | ❌ |
| LinkedIn URL               | ✅ | ✅ | ✅ | ✅ |
| Career Milestones          | ❌ | ✅ | ❌ | ❌ |
| Privacy Toggle             | ✅ | ✅ | ❌ | ❌ |

---

## Settings Page — Feature Access

| Setting                    | Student | Alumni | Faculty | Admin |
|----------------------------|---------|--------|---------|-------|
| Account Information        | ✅ | ✅ | ✅ | ✅ |
| Privacy (Public / Private) | ✅ | ✅ | ❌ | ❌ |
| Change Password            | ✅ | ✅ | ✅ | ✅ |

---

## Sidebar Navigation Per Role

### Student
1. Dashboard *(Announcements only)*
2. My Profile
3. Jobs
4. Inbox
5. Settings

### Alumni
1. Dashboard *(Personal stats, job matches, announcements)*
2. My Profile
3. Jobs
4. Inbox
5. Settings

### Faculty
1. Dashboard *(Full analytics)*
2. My Profile
3. Alumni Directory
4. Student Directory
5. Jobs
6. Inbox
7. Career Prediction
8. Reports
9. Curriculum Impact
10. Settings

### Admin
1. Dashboard *(Full analytics)*
2. Alumni Directory
3. Student Directory
4. Jobs
5. Career Prediction
6. Reports
7. Curriculum Impact
8. Settings

---

## Why These Restrictions?

- **Students see Announcements only on Dashboard** — Students are not yet graduates, so employment analytics and alumni stats are not relevant to them.
- **Students have no Professional Information section** — Students have not yet entered the workforce; that section is reserved for alumni who have career history to record.
- **Students and Alumni can toggle privacy** — These are personal accounts representing individuals. Faculty and Admin profiles are institutional and should always be discoverable.
- **Alumni cannot see directories** — The Alumni and Student directories are administrative tools for faculty/admin to manage and verify records. Alumni interact with peers through messaging and the job board.
- **Admin has no profile or inbox** — The Admin role represents the Alumni Office as an institution, not an individual. Admin accounts manage the system rather than participate in the network.
- **Only Alumni have Career Milestones** — Milestone tracking is tied to post-graduation career progression, which is specific to alumni.
- **Only Students and Alumni can upload CVs** — CV upload drives career milestone extraction and job matching, which applies to individuals seeking or progressing in careers.
