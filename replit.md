# Pidaka - Anonymous Social Wall

## Overview
Pidaka is a fully anonymous social media web application where users post short text messages called "Pidakas" on a shared public wall. Posts expire after 48 hours. Users can send anonymous messages ("Burns") to pidaka creators. Complete anonymity is maintained throughout - no profiles, no followers, no identity exposure.

## Recent Changes
- 2026-02-12: Initial build - full-stack anonymous social wall with auth, wall, burns, inbox, auto-expiry

## User Preferences
- Dark mode friendly design preferred
- Mobile-responsive layout
- Minimal clean interface

## Project Architecture

### Tech Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: JWT-based (bcrypt for password hashing)
- **Routing**: wouter (frontend), Express routes (backend)

### Structure
```
client/src/
  App.tsx            - Main app with routing & auth guard
  lib/auth.tsx       - Auth context provider with JWT token management
  lib/theme.tsx      - Dark/light theme provider
  pages/auth.tsx     - Login/register page
  pages/wall.tsx     - Main wall with pidaka posting, burn dialog, stats
  pages/inbox.tsx    - Burn inbox page
  
server/
  index.ts           - Express server entry
  routes.ts          - API routes (auth, pidakas, burns) + cron job
  storage.ts         - Database storage layer (IStorage interface)
  db.ts              - Drizzle database connection

shared/
  schema.ts          - Drizzle schema (users, pidakas, burns) + Zod validation
```

### Database Tables
- **users**: id, email, password, anonymous_name, burns_sent_count, burns_received_count, created_at
- **pidakas**: id, content, creator_user_id, created_at, expires_at (48h)
- **burns**: id, pidaka_id, sender_user_id, receiver_user_id, message, created_at

### Key Features
- Auto-generated anonymous usernames (pidaka_XXXXXX)
- 48-hour post expiry with cron cleanup every 30 minutes
- Burns: anonymous messages sent to pidaka creators
- Burn statistics: sent count and received count per user
- No identity exposure in any API response
- Dark/light theme toggle
