# LogStrata

LogStrata is a log-driven Kubernetes autoscaling and security analytics product prototype. The public playground works without an account; Supabase-backed accounts can save scenarios and manage cluster foundation records.

## Setup

```bash
npm install
cp .env.example .env.local
```

## Supabase

The project supports local Supabase CLI development and hosted Supabase projects.

For local development:

```bash
npx supabase start
npx supabase db reset
```

Copy the local API URL and publishable key into `.env.local`. For hosted projects, use the hosted project URL and publishable key, then apply the migrations in `supabase/migrations`.

Enable Google OAuth in Supabase Auth and configure this callback:

```text
http://localhost:3000/auth/callback
```

Start Next.js:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm run build
```
