# Tech Stack Overview

## Architecture Summary

AlumniHub uses a modern JavaScript-based full-stack architecture with a Backend-as-a-Service (BaaS) platform.

## Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React.js | 18.x | UI component library (SPA architecture) |
| Vite | 5.x | Build tool and dev server (fast HMR) |
| Tailwind CSS | 3.x | Utility-first CSS framework |
| React Router | 6.x | Client-side routing with protected routes |
| Recharts | 2.x | Charting library for analytics dashboards |
| Axios | 1.x | HTTP client for API requests |
| Lucide React | 0.29x | Icon library |
| date-fns | 3.x | Date formatting utilities |

### Why React?
React was selected for its component-based architecture which maps directly to AlumniHub's modular structure (dashboard, profiles, messaging, analytics). The Komperla et al. (2022) study cited in our literature review supports React's suitability for scalable web applications.

### Why Vite?
Vite provides near-instant hot module replacement during development and optimized production builds. It's significantly faster than Create React App.

## Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18.x+ | JavaScript runtime |
| Express.js | 4.x | Web framework for REST API |
| Helmet | 7.x | Security headers |
| Morgan | 1.x | HTTP request logging |
| CORS | 2.x | Cross-origin resource sharing |
| express-rate-limit | 7.x | API rate limiting |

## Database & Backend Services (Supabase)

| Service | Purpose |
|---------|---------|
| PostgreSQL | Relational database (tables, indexes, triggers) |
| Supabase Auth | User authentication (email/password, JWT) |
| Supabase Realtime | Live updates for messaging |
| Supabase Storage | File storage for CV uploads |
| Row-Level Security | Database-level access control per user role |

### Why Supabase over Firebase + MySQL?
Supabase consolidates authentication, database, realtime, and storage into a single platform. It uses PostgreSQL (a more robust relational database than MySQL) and provides Row-Level Security for fine-grained access control. This reduces system complexity and eliminates the need to manage multiple services.

## AI Module

The AI features are implemented as custom algorithms in JavaScript running on the Express server. They use statistical analysis and pattern recognition on aggregated alumni data rather than external ML services.

| Feature | Approach |
|---------|----------|
| Career Path Prediction | Collaborative filtering on peer alumni career milestones |
| Smart Job Matching | Multi-factor weighted scoring (skills, industry, experience, program) |
| Curriculum Impact | Statistical aggregation and correlation analysis |

## Development Tools

| Tool | Purpose |
|------|---------|
| VS Code | Primary IDE |
| Figma | UI/UX prototyping |
| Git | Version control |
| npm workspaces | Monorepo management |
| Nodemon | Auto-restart server on changes |
