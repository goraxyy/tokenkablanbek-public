# tokenkablanbek-public

Full-stack, invite-only web app for a private digital scrapbook — built end-to-end with Next.js, Supabase, and Resend, deployed on Vercel. Birthday gift for my gf.

[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ECF8E)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com/)

## Stack

- **Next.js (App Router) + TypeScript** — server components, server actions, route groups
- **Supabase** — Postgres, Auth, Row-Level Security, typed client via generated `database.types.ts`
- **Tailwind CSS** — utility-first styling with a shared `components/ui` primitive layer
- **Resend** — transactional email from a verified custom domain for invites
- **Vercel** — CI/CD and hosting
- **Middleware-based access control** — custom `middleware.ts` enforces auth/approval/ban state on every request

## Architecture

```
app/(app)/       # gated routes: admin, memories, letters, bucket-list, together, invite
app/auth/        # sign-in flow
app/pending-approval/, app/banned/   # access-state screens
actions/         # server actions (admin, bucket, invite, letters, memory, visibility)
components/      # feature UI + custom animations (PeonyAnimation, TypewriterText)
lib/supabase/    # typed Supabase client
lib/resend.ts    # email client
supabase/        # schema.sql + migrations
```

## Highlights

- Row-Level Security-backed multi-tenant-style access: every read/write is scoped by auth state.
- Invite-only onboarding — server actions trigger Resend emails; no public sign-up.
- Granular content visibility controls exposed through an admin panel.
- Three-state access gate (auth → pending → approved/banned) enforced centrally in middleware, not per-page.

## Local Development

```bash
git clone https://github.com/goraxyy/tokenkablanbek.git
cd tokenkablanbek
npm install
cp .env.local.example .env.local   # add Supabase + Resend credentials
npm run dev
```

Apply `supabase/schema.sql` and `supabase/migrations/` to your Supabase project before running.

## Deployment

Configured for Vercel via `vercel.json`. Push to `main` to deploy; mirror `.env.local.example` in the project's environment variables.

## License

Private — personal project, not for redistribution.
