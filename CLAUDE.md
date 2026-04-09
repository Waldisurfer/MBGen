# MBGen — Marketing Brief Generator

## Stack

**Frontend** (`@mbgen/frontend`)
- Vue 3 (Composition API, `<script setup>`)
- TypeScript 5, strict
- Vite 6 + Tailwind CSS v4
- Pinia (stores), Vue Router 4 (lazy-loaded routes)
- Axios, @supabase/supabase-js (auth only on frontend)
- GSAP, html2canvas

**Backend** (`@mbgen/backend`)
- Node.js + Express 5, TypeScript
- Drizzle ORM → PostgreSQL (via `pg`)
- Supabase JWT auth (P-256 / ECC keys via `jsonwebtoken`)
- AI: Anthropic SDK, Replicate, @google/genai
- Storage: Cloudflare R2 (AWS S3-compatible)
- Zod for request validation

**Monorepo root**: npm workspaces, `concurrently` for dev

## Architecture

```
frontend/src/
  views/        # one file per route, lazy-loaded
  stores/       # Pinia: auth, campaign, generation, ui
  composables/  # useCopy, useImages, useVideo, useAnimations, useBannerAI, useExport, useModelList
  lib/api.ts    # axios wrapper
  router/       # route guards (requiresAuth, requiresAdmin, requiresCampaign)

backend/src/
  routes/       # campaigns, copy, images, video, animations, history, banner, admin, styles
  services/     # claude.service, image.service, storage.service, veo.service
  middleware/   # auth.middleware (Supabase JWT), rateLimiter, errorHandler
  db/           # schema.ts (Drizzle), client.ts
```

## Data Model (Drizzle schema)

- `campaigns`: id, name, strategy, audience (jsonb), brand (jsonb), brief (jsonb)
- `generations`: id, campaignId, type (copy|image|animation|video), platform, content (jsonb), model, userId, estimatedCostUsd, actualCostUsd
- `userProfiles`: userId, role (user|admin), monthlySpendUsd, monthlyResetAt, styleGuidelines (jsonb), styleFileUrl

## Auth

- Supabase issues JWTs (P-256 / ES256)
- Backend validates with `jsonwebtoken` + Supabase JWKS
- All `/api/*` routes require auth except `/api/health`
- Admin routes check `role === 'admin'` from `userProfiles`

## Key Conventions

- No `any` — use `unknown` or explicit types
- Zod validates all incoming request bodies on the backend
- Composables own async logic; stores own state
- Route guards fetch campaign from DB if store is stale
- Cost tracking: estimate before generation, record actual after

## Services

- `claude.service`: Claude API calls (copy, banner, strategy import)
- `image.service`: Replicate + Google AI image generation
- `storage.service`: R2 upload/presign
- `veo.service`: Google Veo video generation

## Environment Variables (backend)

```
ANTHROPIC_API_KEY
REPLICATE_API_KEY
GOOGLE_GENAI_API_KEY
GOOGLE_CLOUD_PROJECT + GOOGLE_APPLICATION_CREDENTIALS
R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
DATABASE_URL
SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
FRONTEND_URL
PORT (default 3001)
```

## Dev Commands

```bash
npm run dev              # frontend + backend concurrently
npm run dev:frontend
npm run dev:backend
npm run db:generate      # drizzle-kit generate
npm run db:migrate       # drizzle-kit migrate
```

## Deployment

- Frontend: Netlify (`netlify.toml`)
- Backend: Render (`render.yaml`)
