# MBGen

AI-powered marketing content generator. Creates copy, images, animations, and video ads from a campaign brief.

## Stack

- **Frontend**: Vue 3 + Vite + TypeScript + Tailwind CSS 4 + Pinia
- **Backend**: Express 5 + TypeScript + Drizzle ORM + PostgreSQL
- **Storage**: Cloudflare R2
- **AI**: Claude (copy/brief), Replicate FLUX (images), GSAP (animations), Google Veo 2 (video)

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project (free tier works) — [supabase.com](https://supabase.com)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Fill in `backend/.env` with your actual values (see [Environment Variables](#environment-variables) below).

For `frontend/.env.local`, set:
```
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

### 3. Run database migrations

```bash
npm run db:migrate
```

This applies all Drizzle migrations to your Supabase database. Uses `DATABASE_URL_DIRECT` (direct connection, port 5432) if set, otherwise falls back to `DATABASE_URL`.

### 4. Start both servers

```bash
npm run dev
```

- Frontend: http://localhost:5174
- Backend: http://localhost:3001

### 5. First login

1. Open http://localhost:5174 and register an account
2. New accounts are **pending** by default — they require admin approval
3. To approve yourself: set `ADMIN_EMAILS=your@email.com` in `backend/.env`, then restart the backend. Your account will be auto-promoted to admin on next login.
4. Go to `/admin` to approve other users

---

## Environment Variables

### Backend (`backend/.env`)

See `backend/.env.example` for the full template with comments.

| Variable | Required | Notes |
|---|---|---|
| `PORT` | No | Defaults to 3001 |
| `NODE_ENV` | No | `development` or `production` |
| `FRONTEND_URL` | Yes | CORS origin — `http://localhost:5174` for local dev |
| `SUPABASE_URL` | Yes | From Supabase → Project Settings → API |
| `SUPABASE_ANON_KEY` | Yes | From Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | From Supabase → Project Settings → API (secret) |
| `DATABASE_URL` | Yes | Pooler connection string (port 6543) — for runtime |
| `DATABASE_URL_DIRECT` | Yes | Direct connection string (port 5432) — for migrations |
| `ANTHROPIC_API_KEY` | Yes | From console.anthropic.com |
| `REPLICATE_API_KEY` | Yes | From replicate.com → Account Settings |
| `GOOGLE_GENAI_API_KEY` | For Veo 2 | From aistudio.google.com → API Keys |
| `R2_ACCOUNT_ID` | For storage | Cloudflare R2 — optional, falls back to temp URLs |
| `R2_ACCESS_KEY_ID` | For storage | Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY` | For storage | Cloudflare R2 |
| `R2_BUCKET_NAME` | For storage | Cloudflare R2 |
| `R2_PUBLIC_URL` | For storage | Cloudflare R2 |
| `SSE_TOKEN_SECRET` | Yes | 64-char hex string for video SSE tokens |
| `ADMIN_EMAILS` | No | Comma-separated emails auto-promoted to admin |
| `LOG_LEVEL` | No | Pino log level, defaults to `info` |

Generate `SSE_TOKEN_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend (`frontend/.env.local`)

| Variable | Notes |
|---|---|
| `VITE_API_URL` | Backend URL — `http://localhost:3001/api` for local dev |
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` above |
| `VITE_SUPABASE_ANON_KEY` | Same as `SUPABASE_ANON_KEY` above (public key, safe for frontend) |

---

## Sharing with Team Members

**`backend/.env` contains secrets — never commit it.**

Share secrets via a password manager with team sharing (1Password, Bitwarden) or your team's secret manager (Doppler, Infisical).

### What each team member needs

| File | Contains | How to share |
|---|---|---|
| `backend/.env` | All backend secrets (DB, API keys, Supabase service role, R2) | Share via password manager or secret manager |
| `frontend/.env.local` | Only public Supabase keys + local API URL | Can share openly — contains no secrets |

### What's already in the repo (safe to commit)

| File | Notes |
|---|---|
| `backend/.env.example` | Template with placeholder values only |
| `frontend/.env.example` | Template with placeholder values only |
| `frontend/.env.production` | Production Supabase anon key (public key, safe to commit) |

### Checklist for a new team member

- [ ] Clone repo and run `npm install`
- [ ] Get `backend/.env` from the team password manager
- [ ] Copy `frontend/.env.example` → `frontend/.env.local` and fill in Supabase URL + anon key (same as `SUPABASE_URL` / `SUPABASE_ANON_KEY` in backend `.env`)
- [ ] Run `npm run db:migrate`
- [ ] Run `npm run dev`
- [ ] Register an account and ask an admin to approve it, or add your email to `ADMIN_EMAILS`

---

## Dev Scripts

```bash
npm run dev              # Start frontend + backend concurrently
npm run dev:frontend     # Frontend only (Vite)
npm run dev:backend      # Backend only (tsx watch)
npm run build:frontend   # Production build (includes type check)
npm run build:backend    # TypeScript compile
npm run db:generate      # Generate Drizzle migration from schema changes
npm run db:migrate       # Apply pending migrations to DB
```

---

## Deployment

- **Frontend**: Netlify — see `netlify.toml`
- **Backend**: Render — see `render.yaml`

Set all backend env vars in the Render dashboard → Environment. Set `VITE_*` frontend vars in Netlify → Site settings → Environment variables.

---

## Known Weakpoints & Technical Debt

These are architectural weaknesses that work fine for current scale but are worth addressing as the team grows:

### Backend

- **No service/repository layer** — controllers import `db` directly. Makes unit testing hard.
- **`claude.service.ts` is a god object** — 535 lines covering briefs, copy, animations, banners, strategy. Should be split by domain.
- **Duplicated generation recording** — the insert-to-generations pattern is repeated across copy, images, animations, and banner controllers. Should be a shared helper.
- **Business logic in auth middleware** — profile creation, email sync, and monthly spend reset live in `auth.middleware.ts`. Should be a `UserService`.
- **Cost tracking is scattered** — split across `utils/spend.ts`, `config/models.ts`, and inline in controllers.
- **JSON extraction regex is fragile** — `text.match(/\{[\s\S]*\}/)` used 5+ times in `claude.service.ts`. Breaks on multi-object responses.
- **Spend recorded before upload** — `images.controller.ts` records cost before R2 upload completes. User is charged on upload failure.
- **Race condition in spend reset** — no DB-level locking around the monthly spend reset in auth middleware.

### Frontend

- **`v-html` renders API content** — `BannerStudioView.vue` renders banner HTML from the API without sanitization. XSS risk if backend is ever compromised.
- **Form/business logic in views** — `AudienceLibraryView`, `BrandLibraryView`, and `BannerStudioView` contain form state and validation that should be composables.
- **Module-level cache in `useModelList`** — never invalidates, never retries on network error. Users get empty model list if the first fetch fails.
- **`auth.store.ts` does too much** — session, profile, spend limits, auth flow, and event listeners all in one store.
- **EventSource leaks** — SSE connections in `generation.store.ts` are not cleaned up on component unmount.
- **`console.log` in production** — debug logs throughout `api.ts`, `auth.store.ts`, `claude.service.ts`.

### Simplification opportunities

- Extract `useLibraryForm<T>()` composable — `AudienceLibraryView` and `BrandLibraryView` have identical CRUD form logic.
- Extract `useAsyncOperation()` — every composable manually declares `isLoading`, `error`, and try/catch boilerplate.
- Backend: extract `getOwnedResource(table, id, userId)` — the "find by id + userId, 404 if missing" pattern appears in 10+ places.
- Backend: centralize Zod schemas — `z.string().uuid()`, status enums, and privacy booleans are repeated 15+ times.
