# MBGen

> AI-powered marketing content studio. Turn a campaign brief into ready-to-use copy, images, animations, and video ads — in seconds.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![Vue 3](https://img.shields.io/badge/Vue-3-42b883)

## Features

- **Copy generation** — platform-specific ad copy (Facebook, Instagram, Google, LinkedIn, TikTok) powered by Claude
- **Image studio** — generate visuals with FLUX, FLUX Pro, and FLUX Schnell via Replicate
- **Banner studio** — interactive HTML/CSS banner editor with AI-suggested headlines and layouts
- **Video ads** — generate short-form video with Google Veo 2 and Wan
- **Brand & audience library** — store brand guidelines and target personas, reuse them across campaigns
- **Campaign wizard** — structured brief → AI parses tone, goals, and platform strategy automatically
- **Cost tracking** — per-user monthly spend limits with real-time usage bar
- **Generation history** — browse, filter, and export all previous outputs

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 · Vite · TypeScript · Tailwind CSS 4 · Pinia |
| Backend | Express 5 · TypeScript · Drizzle ORM · PostgreSQL |
| Auth | Supabase (JWT + JWKS) |
| Storage | Cloudflare R2 |
| AI | Claude (copy) · Replicate FLUX (images) · GSAP (animations) · Google Veo 2 (video) |
| Deployment | Netlify (frontend) · Render (backend) |

## Quick Start

```bash
# Install all dependencies (npm workspaces)
npm install

# Copy env files and fill in API keys
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Run database migrations
npm run db:generate
npm run db:migrate

# Start both dev servers
npm run dev
```

Frontend → http://localhost:5174  
Backend → http://localhost:3001

See [`SETUP.md`](SETUP.md) for full infrastructure setup (Supabase, R2, Render, Netlify).

## Project Structure

```
mbgen/
├── backend/
│   └── src/
│       ├── routes/        # 11 REST endpoints
│       ├── controllers/   # Request handling + Zod validation
│       ├── services/      # Claude, Replicate, Veo, R2 integrations
│       ├── db/            # Drizzle schema + migrations
│       └── middleware/    # Auth, rate limiting, error handling
└── frontend/
    └── src/
        ├── views/         # 12 route views
        ├── components/    # Banner editor, generators, UI primitives
        ├── composables/   # Async logic (copy, images, video, export)
        └── stores/        # Pinia: auth, campaigns, generations, UI
```

## Environment Variables

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example).

Required keys: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `REPLICATE_API_TOKEN`, `GOOGLE_AI_API_KEY`.

## License

MIT © 2026 Waldisurfer
