# Coding Standards

## General

- Use ES modules (`import/export`) throughout — no `require()`
- Use `const` by default, `let` when reassignment is needed, never `var`
- Use arrow functions for callbacks and inline functions
- Use template literals for string interpolation
- Use optional chaining (`?.`) and nullish coalescing (`??`) where appropriate
- Destructure objects and arrays when accessing multiple properties

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files (components) | PascalCase | `ProfilePage.jsx` |
| Files (utilities) | camelCase | `formatDate.js` |
| Files (routes) | camelCase | `messages.js` |
| React components | PascalCase | `function AlumniCard()` |
| Functions | camelCase | `computeMatchScore()` |
| Variables | camelCase | `const matchScore = 85` |
| Constants | UPPER_SNAKE | `const MAX_RETRIES = 3` |
| Database columns | snake_case | `first_name`, `created_at` |
| API routes | kebab-case | `/api/message-requests` |
| CSS classes | Tailwind utilities | `bg-blue-600 text-white` |

## React Patterns

### Component Structure
```jsx
// 1. Imports
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

// 2. Component
export default function ComponentName() {
  // 3. Hooks
  const [data, setData] = useState(null);
  const { user } = useAuth();

  // 4. Effects
  useEffect(() => { /* ... */ }, []);

  // 5. Handlers
  const handleSubmit = () => { /* ... */ };

  // 6. Render
  return <div>...</div>;
}
```

### State Management
- Use `useState` for local component state
- Use `useContext` (via `AuthContext`) for auth state
- Pass data via props for parent-child communication
- Lift state up when siblings need shared data

### API Calls
Always use the service functions from `services/api.js` — never call Axios or Supabase directly from components.

```jsx
// Good
import { profileService } from "../services/api";
const { data } = await profileService.getMyProfile();

// Bad
const { data } = await axios.get("/api/profiles/me");
```

## Express Patterns

### Route Handler Structure
```javascript
router.get("/endpoint", authenticate, async (req, res, next) => {
  try {
    // 1. Extract params
    const { id } = req.params;
    const { search, page } = req.query;

    // 2. Business logic / DB query
    const { data, error } = await supabase.from("table").select("*");
    if (error) throw error;

    // 3. Send response
    res.json(data);
  } catch (err) {
    next(err); // Pass to error handler
  }
});
```

### Error Handling
- Always wrap async route handlers in try/catch
- Use `next(err)` to pass errors to the global error handler
- Return appropriate HTTP status codes
- Never expose stack traces in production

## File Organization Rules

- One component per file
- Group related components in subdirectories (e.g., `components/messaging/`)
- Keep page components thin — extract logic into hooks and services
- Keep route files focused on HTTP handling — extract business logic into `services/`

## Comments

- Comment the "why", not the "what"
- Use JSDoc for complex function parameters
- Add TODO comments for incomplete features with context
