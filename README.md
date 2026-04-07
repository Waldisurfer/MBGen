# MBGen

AI-powered marketing content generator. Creates copy, images, animations, and video ads from a campaign brief.

## Stack

- **Frontend**: Vue 3 + Vite + TypeScript + Tailwind CSS 4 + Pinia
- **Backend**: Express 5 + TypeScript + Drizzle ORM + PostgreSQL
- **Storage**: Cloudflare R2
- **AI**: Claude (copy/brief), Replicate FLUX (images), GSAP (animations), Google Veo 2 (video)

## Development

```bash
# Install all dependencies
npm install

# Copy env files and fill in values
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Run database migrations
npm run db:generate
npm run db:migrate

# Start both dev servers
npm run dev
```

Frontend runs at http://localhost:5174
Backend runs at http://localhost:3001

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`.
