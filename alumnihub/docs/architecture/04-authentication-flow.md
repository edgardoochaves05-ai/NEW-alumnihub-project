# Authentication Flow

## Overview

AlumniHub uses Supabase Auth for user management. Authentication is email/password based with JWT tokens for session management.

## Registration Flow

1. User fills out the registration form (email, password, name, role)
2. Frontend calls `supabase.auth.signUp()` with user metadata
3. Supabase creates the user in `auth.users`
4. Database trigger `handle_new_user()` auto-creates a row in `profiles` with the user's role
5. User is redirected to the dashboard

## Login Flow

1. User enters email and password
2. Frontend calls `supabase.auth.signInWithPassword()`
3. Supabase returns a JWT access token and refresh token
4. `AuthContext` stores the user session and fetches their profile
5. The app renders role-appropriate navigation and routes

## Session Management

The `AuthContext` provider (`client/src/context/AuthContext.jsx`) manages the auth state:

- Checks for existing session on app load
- Listens for auth state changes (login, logout, token refresh)
- Fetches the user's profile (including role) from the `profiles` table
- Exposes `user`, `profile`, `isAlumni`, `isFaculty`, `isAdmin` to all components

## API Authentication

Every API request from the frontend includes the JWT token:

1. Axios interceptor in `api.js` gets the current session token
2. Attaches it as `Authorization: Bearer <token>` header
3. Server middleware (`server/src/middleware/auth.js`) verifies the token
4. If valid, attaches `req.user` and `req.profile` to the request
5. Route handlers can access `req.user.id` and `req.profile.role`

## Role-Based Access Control

The `authorize()` middleware restricts endpoints by role:

```javascript
// Only faculty and admin can access this endpoint
router.get("/reports", authenticate, authorize("faculty", "admin"), handler);
```

Frontend routing also enforces this via the `ProtectedRoute` component:

```jsx
<Route path="reports" element={
  <ProtectedRoute allowedRoles={["faculty", "admin"]}>
    <ReportsPage />
  </ProtectedRoute>
} />
```

## Roles

| Role | Set During | Can Change? |
|------|-----------|-------------|
| `alumni` | Registration (default) | No (admin can change via DB) |
| `faculty` | Registration or admin assignment | No (admin can change via DB) |
| `admin` | Admin assignment only | No |

## Token Refresh

Supabase automatically refreshes JWT tokens before they expire. The `AuthContext` listener handles session updates seamlessly.
