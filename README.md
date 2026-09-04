# tokenkablanbek

Full-stack, invite-only web app for a private digital scrapbook — built end-to-end with Next.js, Supabase, and Resend, deployed on Vercel. Birthday gift for my gf.

[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ECF8E)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com/)

> **Read-only source copy.** This is a public excerpt of a private application, published as a work sample. The database schema, migrations, row-level-security policies, environment templates and deployment configuration are not included, so this repository is not runnable. Dates and locations in the source are placeholders.

## Stack

- **Next.js (App Router) + TypeScript** — server components, server actions, route groups
- **Supabase** — Postgres, Auth, Row-Level Security, private storage with signed URLs
- **Tailwind CSS** — utility-first styling with a shared `components/ui` primitive layer
- **Resend** — transactional email from a verified custom domain for invites
- **Vercel** — CI/CD and hosting

## Architecture

```
app/(app)/       # gated routes: admin, memories, letters, bucket-list, together, invite
app/auth/        # sign-in, password reset, recovery callback
app/pending-approval/, app/banned/   # access-state screens
actions/         # server actions (admin, bucket, invite, letters, memory, visibility)
components/      # feature UI + custom animations (PeonyAnimation, TypewriterText)
lib/authz.ts     # role guards used by every server action
lib/storage.ts   # signed-URL minting for private buckets
lib/supabase/    # typed clients + middleware session handling
```

## Authentication & authorization

Access is enforced at **three independent layers**. Each is a complete check on its own; none is load-bearing alone.

| Layer | Where | What it does |
|---|---|---|
| 1. Middleware | `lib/supabase/middleware.ts` | Verifies the JWT with `getUser()` (a real network call, not a cookie read), looks up the caller's role, and routes: signed-out → `/auth`, banned → `/banned`, guest → `/pending-approval`, non-admin off `/admin`. Fails closed to `guest` if the role lookup errors. |
| 2. Server actions | `lib/authz.ts` | `assertCanRead` / `assertCanEdit` / `assertAdmin`. **Required**, because a Server Action is a POST to whatever route the browser is on — middleware is not a boundary for it. Also fails closed. |
| 3. Postgres RLS | *(not included here)* | The final backstop. Policies call `SECURITY DEFINER` helpers kept in a `private` schema, so PostgREST cannot expose them as RPC. |

### Who can see and do what

| Role | Pages | Reads | Writes |
|---|---|---|---|
| **anonymous** | landing, sign-in, password reset only | nothing — `anon` holds no grants on content tables, and both storage buckets are private | none |
| **guest** (every new signup) | `/pending-approval` only | nothing | none |
| **viewer** | all app pages | items where `hidden_from_viewer = false`; locked letters stay sealed until their unlock date | none |
| **editor** | all app pages | everything, including items hidden from viewers and locked letter drafts | full create/edit/delete |
| **admin** | all pages **+ `/admin`** | everything, plus the user roster | everything, plus roles, bans, approvals and per-item visibility |
| **banned** | `/banned` only | nothing — blocked at every table and both buckets | none |

### How content stays private

- **Photos** live in private buckets. Nothing stores a permanent URL: `storage_path` is the source of truth and a signed URL is minted per request, expiring in an hour.
- **Letters** marked locked have their body withheld *server-side* until the unlock date. Editors and admins keep access to their own drafts.
- **Per-item visibility** — an admin can hide any single memory, letter, bucket-list item or invite from the `viewer` role.
- **Sign-up is invite-only**: disabled at the Supabase project level, with a database allowlist as a second gate.

## License

Private — personal project, published for viewing only. Not licensed for use, redistribution or derivative works.
