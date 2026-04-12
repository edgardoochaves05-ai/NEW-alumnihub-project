# Setup Guide

## Prerequisites

- **Node.js** >= 18 ([download](https://nodejs.org))
- **npm** >= 9 (comes with Node.js)
- **Git** ([download](https://git-scm.com))
- **VS Code** ([download](https://code.visualstudio.com))
- **Supabase account** (free tier at [supabase.com](https://supabase.com))

## Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd alumnihub

# 2. Install all dependencies (root, client, server)
npm install

# 3. Copy environment template
cp .env.example .env
```

## Configure Supabase

See [Supabase Setup](03-supabase-setup.md) for detailed instructions. Quick version:

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** and copy your Project URL and keys
3. Paste them into your `.env` file
4. Run the SQL migration scripts in the Supabase SQL Editor

## Run the Project

```bash
# Start both frontend and backend
npm run dev

# Or run them separately
npm run dev:client    # React on http://localhost:5173
npm run dev:server    # Express on http://localhost:3001
```

## Create Test Users

1. Go to your Supabase Dashboard > **Authentication > Users**
2. Click **Add User** and create accounts with these roles:
   - `alumni@test.com` — set metadata: `{"role": "alumni", "first_name": "Juan", "last_name": "Dela Cruz"}`
   - `faculty@test.com` — set metadata: `{"role": "faculty", "first_name": "Maria", "last_name": "Santos"}`
   - `admin@test.com` — set metadata: `{"role": "admin", "first_name": "Admin", "last_name": "User"}`

3. Profiles are auto-created via the database trigger

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server |
| `npm run dev:client` | Start React dev server only |
| `npm run dev:server` | Start Express server only |
| `npm run build` | Build React for production |
| `npm run start` | Start Express in production mode |

## Troubleshooting

**Port already in use:** Kill the process using the port or change it in `.env`.

**Supabase connection failed:** Verify your `VITE_SUPABASE_URL` and keys in `.env`. Make sure they don't have trailing spaces.

**CORS errors:** The server is configured to accept requests from `http://localhost:5173`. If you changed the client port, update `CLIENT_URL` in `.env`.
