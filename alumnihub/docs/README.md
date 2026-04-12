# AlumniHub Documentation

> A Web-Based Alumni Tracking System with AI-Powered Career Progress and Curriculum Impact Analytics for Higher Education Institutions (HEIs)

## Documentation Index

### Getting Started
- [Setup Guide](setup/01-setup-guide.md) — Installation, Supabase config, running the project
- [Environment Variables](setup/02-environment-variables.md) — All env vars explained
- [Supabase Setup](setup/03-supabase-setup.md) — Creating project, storage buckets, auth config

### Architecture
- [Tech Stack Overview](architecture/01-tech-stack.md) — Technologies used and why
- [Project Structure](architecture/02-project-structure.md) — Folder layout and file organization
- [System Architecture](architecture/03-system-architecture.md) — Three-tier architecture breakdown
- [Authentication Flow](architecture/04-authentication-flow.md) — Supabase Auth, JWT, role-based access

### Features
- [User Roles & Permissions](features/01-user-roles.md) — Alumni, Faculty, Admin access matrix
- [Profile & Privacy System](features/02-profile-privacy.md) — Profile management, privacy toggle
- [CV Upload & AI Parsing](features/03-cv-upload-ai-parsing.md) — CV upload flow and milestone extraction
- [Inbox & Messaging](features/04-inbox-messaging.md) — Search, filters, message requests
- [Job Posting & Smart Matching](features/05-job-posting-matching.md) — Job board with AI matching
- [Career Path Prediction](features/06-career-prediction.md) — AI prediction engine
- [Curriculum Impact Analytics](features/07-curriculum-impact.md) — Program effectiveness analysis

### API Reference
- [API Overview](api/01-api-overview.md) — Base URL, auth headers, error format
- [API Endpoints](api/02-api-endpoints.md) — Full endpoint reference with request/response examples

### Database
- [Database Schema](database/01-database-schema.md) — All tables, columns, relationships
- [Row-Level Security](database/02-row-level-security.md) — RLS policies explained

### AI Module
- [AI Overview](ai/01-ai-overview.md) — How the three AI features work
- [Career Path Prediction Algorithm](ai/02-career-prediction-algorithm.md) — Technical deep dive
- [Smart Job Matching Algorithm](ai/03-job-matching-algorithm.md) — Scoring breakdown
- [Curriculum Impact Algorithm](ai/04-curriculum-impact-algorithm.md) — Analytics methodology

### Guidelines
- [Coding Standards](guidelines/01-coding-standards.md) — Code style, naming, patterns
- [Styling Guide](guidelines/02-styling-guide.md) — Tailwind classes, design tokens, UI patterns
