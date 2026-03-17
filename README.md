# NeighborServe Home Concierge

Internal tool for the NeighborServe service team to manage Home Concierge clients, track proactive outreach, and surface seasonal maintenance recommendations.

## Features

- **Client Dashboard** — All clients listed and sorted by who needs contact this month, with search
- **Client Creation** — Add clients with selectable seasonal/recurring home maintenance services
- **Client Detail View** — Seasonal recommendations based on current month, communication logging with auto-dated notes, full communication history
- **30-Day Advance Notice** — Recommendations appear one month before service is due
- **Delete Clients** — Remove clients who are no longer active

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** (NeighborServe brand colors)
- **Supabase** (PostgreSQL database)
- **Vercel** (hosting)

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd neighborserve-concierge
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Copy your project URL and anon key from **Settings > API**

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy

## Database Schema

- **clients** — id, name, email, phone, address, notes, services (text array), timestamps
- **communications** — id, client_id (FK), note, communicated_at, created_at
