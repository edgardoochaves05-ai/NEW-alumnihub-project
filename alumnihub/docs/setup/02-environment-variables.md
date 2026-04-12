# Environment Variables

All environment variables are stored in a single `.env` file at the project root. Copy `.env.example` to `.env` and fill in the values.

## Required Variables

| Variable | Used By | Description |
|----------|---------|-------------|
| `VITE_SUPABASE_URL` | Client + Server | Your Supabase project URL (e.g., `https://abc123.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase anonymous/public key for client-side operations |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase service role key for admin-level server operations |

## Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Express server port |
| `NODE_ENV` | `development` | Environment mode (`development` or `production`) |
| `VITE_API_URL` | `http://localhost:3001/api` | Backend API base URL |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL for CORS |
| `JWT_SECRET` | — | For custom JWT signing if needed |

## Notes

- Variables prefixed with `VITE_` are exposed to the React frontend via Vite
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER be exposed to the frontend — it bypasses Row-Level Security
- In production, set `NODE_ENV=production` and update `CLIENT_URL` to your deployed frontend URL
