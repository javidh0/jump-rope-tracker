# Jump Rope Tracker

[![Repo](https://img.shields.io/badge/GitHub-javidh0%2Fjump--rope--tracker-181717?logo=github)](https://github.com/javidh0/jump-rope-tracker)

Track jump rope sessions, run structured interval workouts, log calibration
tests, and set goals — all without needing a smartwatch or heart-rate
monitor.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **Prisma 6** + **SQLite** for local, file-based persistence
- **Recharts** for progress charts

## Local development

```bash
npm install
npm run db:migrate   # applies migrations, creates prisma/dev.db
npm run db:seed       # seeds preset workouts + skill ladder
npm run dev
```

This runs on a **random free port**, not Next's default `3000` — this
machine has another service (a Java/JDWP debugger) that also uses `3000`,
so rather than pick a different fixed port that could someday collide with
something else too, the dev/start scripts pass `-p 0`, which tells the OS
to hand back whatever port is actually free. Check the terminal output for
the URL, e.g.:

```
- Local:         http://localhost:54321
```

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Run the production build |
| `npm run db:migrate` | Create/apply a dev migration (interactive) |
| `npm run db:seed` | Re-seed preset workouts + skill ladder |
| `npm run db:studio` | Open Prisma Studio to browse the DB |

## iPhone remote sensor (this branch)

The Timer and Workout Runner can pair with an iPhone on the same LAN,
which detects jumps via its motion sensor instead of relying on a laptop
mic. This needs HTTPS — iOS Safari only grants motion-sensor permission
on a secure connection — so a one-time local certificate is required:

```bash
npx next dev --experimental-https   # generates certificates/, needs your
                                     # macOS password once to trust the CA
```

After that first run, use the regular HTTPS dev command going forward:

```bash
npm run dev:https
```

Then on the laptop, open the printed `https://<lan-ip>:<port>/timer` (or
`/workouts/.../run`) URL, and on the iPhone visit the `/remote` URL shown
on that screen. Regenerate `certificates/localhost.pem` (via `mkcert`,
already downloaded to `~/Library/Caches/mkcert/`) if your LAN IP changes —
the cert only covers the addresses it was issued for.

## Deploying

The app runs on SQLite locally, which is simplest for a single-user app —
but SQLite is a **file on disk**, so where you deploy matters:

### Option A — host with a persistent disk (recommended, minimal changes)

Platforms like **Render**, **Fly.io**, or **Railway** give you a persistent
volume. Point `DATABASE_URL` at a file on that volume, then on first deploy:

```bash
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

No schema changes needed — this is the same SQLite setup as local dev.

### Option B — serverless host (e.g. Vercel)

Serverless platforms have an **ephemeral filesystem** — a SQLite file
written at runtime won't persist across requests/deploys. To deploy there,
swap to a hosted Postgres database (e.g. [Neon](https://neon.tech) or
[Supabase](https://supabase.com)):

1. In `prisma/schema.prisma`, change the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` in your host's environment variables to the Postgres
   connection string.
3. Run once against the new database:
   ```bash
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   ```

No application code changes are needed beyond the datasource line — Prisma
abstracts the rest.

## What's not implemented yet

Metrics that require a smartwatch/heart-rate monitor (true VO₂ max,
heart-rate zones, HRV-based recovery) are intentionally left out. The app
tracks proxy metrics instead (e.g. time-for-500-skips as an aerobic proxy,
self-reported soreness for recovery) — see the Settings page for the
placeholder for connecting a wearable later.
