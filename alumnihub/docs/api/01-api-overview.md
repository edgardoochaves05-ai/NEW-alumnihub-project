# API Overview

## Base URL

```
Development: http://localhost:3001/api
Production:  https://your-domain.com/api
```

## Authentication

All endpoints (except `POST /api/auth/register`) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <supabase_access_token>
```

The frontend Axios interceptor handles this automatically.

## Request Format

- Content-Type: `application/json` (except file uploads which use `multipart/form-data`)
- Request bodies are JSON objects

## Response Format

### Success
```json
{
  "data": { ... }
}
```
Or for lists:
```json
{
  "items": [...],
  "total": 50,
  "page": 1,
  "totalPages": 3
}
```

### Error
```json
{
  "error": "Human-readable error message"
}
```

HTTP status codes:
- `200` — Success
- `201` — Created
- `400` — Bad request (missing/invalid params)
- `401` — Unauthorized (missing/invalid token)
- `403` — Forbidden (insufficient role)
- `404` — Not found
- `409` — Conflict (duplicate record)
- `500` — Server error

## Rate Limiting

100 requests per 15-minute window per IP address. When exceeded:

```json
{
  "error": "Too many requests, please try again later."
}
```

## Pagination

List endpoints support pagination via query params:
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20)

Response includes `total` count and `totalPages`.
