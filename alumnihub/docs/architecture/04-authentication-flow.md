# Authentication Flow

## Overview

AlumniHub uses Supabase Auth for user management. Authentication is email/password based with JWT tokens for session management.

## Registration Flow

1. User fills out the registration form (email, password, name, role)
2. Frontend rejects institutional emails (e.g. `@tip.edu.ph`) at the API level; advisor and admin accounts are created via seeding scripts or admin assignment only
3. Frontend calls `supabase.auth.signUp()` with user metadata
4. Supabase creates the user in `auth.users`
5. Database trigger `handle_new_user()` auto-creates a row in `profiles` with the user's role
6. User is redirected to the dashboard

## Login Flow

1. User enters email and password
2. Frontend calls `supabase.auth.signInWithPassword()`
3. Supabase returns a JWT access token and refresh token
4. `AuthContext` stores the user session and fetches their profile
5. The app renders role-appropriate navigation and routes

## Session Management

The `AuthContext` provider ([client/src/context/AuthContext.jsx](../../client/src/context/AuthContext.jsx)) manages the auth state:

- Checks for existing session on app load
- Listens for auth state changes (login, logout, token refresh)
- Fetches the user's profile (including role) from the `profiles` table
- Exposes `user`, `profile`, `loading`, and the role booleans below to all components

| Computed Boolean | True when |
|-----------------|-----------|
| `isAlumni` | `profile.role === "alumni"` |
| `isCareerAdvisor` | `profile.role === "career_advisor"` or `"faculty"` |
| `isAdmin` | `profile.role === "admin"` |

`refreshProfile()` is also exposed so components can re-fetch the profile after updates.

## API Authentication

Every API request from the frontend includes the JWT token:

1. Axios interceptor in `api.js` gets the current session token from Supabase
2. Attaches it as `Authorization: Bearer <token>` header
3. Server `authenticate` middleware ([server/src/middleware/auth.js](../../server/src/middleware/auth.js)) verifies the token with Supabase
4. If valid, attaches `req.user`, `req.profile`, and `req.token` to the request
5. Route handlers access `req.user.id` and `req.profile.role`

## Role-Based Access Control

The `authorize()` middleware restricts endpoints by role:

```javascript
// Only admin can access this endpoint
router.get("/alumni", authenticate, authorize("admin"), handler);

// Career advisors and admin can both access
router.get("/curriculum-impact", authenticate, authorize("career_advisor", "admin"), handler);
```

Frontend routing enforces the same rules via the `ProtectedRoute` component in [client/src/App.jsx](../../client/src/App.jsx):

```jsx
<Route path="reports" element={
  <ProtectedRoute allowedRoles={["admin"]}>
    <ReportsPage />
  </ProtectedRoute>
} />

<Route path="advisor/roster" element={
  <ProtectedRoute allowedRoles={["career_advisor"]}>
    <AdvisorRosterPage />
  </ProtectedRoute>
} />
```

## Roles

| Role | Value | Assigned During | Can Change? |
|------|-------|-----------------|-------------|
| `alumni` | `"alumni"` | Registration (default) | Admin can change via `PATCH /api/profiles/:id/role` |
| `student` | `"student"` | Registration (user selects) | Admin can change via `PATCH /api/profiles/:id/role` |
| `career_advisor` | `"career_advisor"` | Seeding script or admin assignment | Admin can change via `PATCH /api/profiles/:id/role` |
| `admin` | `"admin"` | Seeding script (`create-admin.mjs`) | Admin can change via `PATCH /api/profiles/:id/role` |

The `faculty` value is a legacy alias for `career_advisor` — it may appear in the database for older records. The `isCareerAdvisor` boolean in `AuthContext` handles both values.

## Token Refresh

Supabase automatically refreshes JWT tokens before they expire. The `AuthContext` `onAuthStateChange` listener handles session updates and profile re-fetches seamlessly.
