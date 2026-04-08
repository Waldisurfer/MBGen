# MBGen Setup Checklist

## Prerequisites
- GitHub repo: `Waldisurfer/MBGen`
- Netlify account (free)
- Supabase account (free)
- Render.com account (free)
- Anthropic account
- Replicate account

---

## 1. Supabase — Database, Auth, Storage

1. Go to **supabase.com** → New project
   - Name: `MBGen`
   - Set a strong database password (save it)
   - Pick closest region
   - Wait ~2 min to provision

2. **Settings → Database → Connection String → URI** → copy
   This is your `DATABASE_URL`
   Format: `postgresql://postgres:[PASSWORD]@db.[ref].supabase.co:5432/postgres`

3. **Settings → API** → copy all four values:
   - `Project URL` → `SUPABASE_URL`
   - `anon / public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ keep secret, backend only
   - `JWT Secret` → `SUPABASE_JWT_SECRET`

4. **Storage → New bucket**
   - Name: `styles`
   - Set to **Private**

5. **SQL Editor → New query** → paste and run:

```sql
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  strategy TEXT NOT NULL,
  audience JSONB NOT NULL,
  brand JSONB NOT NULL,
  brief JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  platform TEXT NOT NULL,
  content JSONB NOT NULL,
  prompt_used TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  external_job_id TEXT,
  model TEXT,
  user_id TEXT,
  estimated_cost_usd NUMERIC(10,6),
  actual_cost_usd NUMERIC(10,6),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user',
  monthly_spend_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
  monthly_reset_at TIMESTAMP DEFAULT NOW() NOT NULL,
  style_guidelines JSONB,
  style_file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

---

## 2. Anthropic API Key — Claude (AI copy, banner suggestions)

1. Go to **console.anthropic.com** → API Keys → Create Key
2. Name it `MBGen`
3. Copy the key → `ANTHROPIC_API_KEY`
   Format: `sk-ant-api03-...`

**Powers:** Banner AI Ideas, campaign copy, animation config, strategy import

---

## 3. Replicate API Key — Image & Video generation

1. Go to **replicate.com** → Sign up
2. Click avatar → API Tokens → Create token
3. Copy the token → `REPLICATE_API_KEY`
   Format: `r8_...`

**Powers:** All image models (FLUX, Recraft, Ideogram, SD) + Wan/MiniMax/Luma video

---

## 4. Render.com — Backend Hosting (free)

1. Go to **render.com** → New → Web Service
2. Connect GitHub → select `Waldisurfer/MBGen`
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. **Environment Variables** → add all of the following:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | from Supabase step 2 |
| `SUPABASE_URL` | from Supabase step 3 |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase step 3 |
| `SUPABASE_JWT_SECRET` | from Supabase step 3 |
| `ANTHROPIC_API_KEY` | from step 2 |
| `REPLICATE_API_KEY` | from step 3 |
| `FRONTEND_URL` | your Netlify URL (add after step 5) |
| `PORT` | `3001` |

5. Click **Create Web Service** → wait for first deploy
6. Copy your Render backend URL
   Format: `https://mbgen-backend.onrender.com`

> **Note:** Free tier spins down after 15 min idle. First request after idle takes ~30s. Fine for internal team use.

---

## 5. Netlify — Frontend Hosting (free)

1. Go to **netlify.com** → Add new site → Import from Git → GitHub → `Waldisurfer/MBGen`
2. Build settings are auto-detected from `netlify.toml` (no changes needed)
3. **Site configuration → Environment variables** → add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-render-url.onrender.com/api` |
| `VITE_SUPABASE_URL` | from Supabase step 3 |
| `VITE_SUPABASE_ANON_KEY` | from Supabase step 3 |

4. **Deploys → Trigger deploy**
5. Copy your Netlify URL → go back to Render → add it as `FRONTEND_URL`

---

## 6. Optional — Google Veo 2 Video

Only needed for Veo 2 video generation. Skip if not using video.

**Option A — AI Studio (simpler)**
1. Go to **aistudio.google.com** → Get API key → Create API key
2. Add to Render: `GOOGLE_GENAI_API_KEY=AIza...`

**Option B — Vertex AI (production/GCP)**
1. Create a GCP project with Vertex AI API enabled
2. Create a service account with `roles/aiplatform.user`
3. Add to Render:
   - `GOOGLE_CLOUD_PROJECT=your-project-id`
   - `GOOGLE_CLOUD_LOCATION=us-central1`
   - `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json`

---

## 7. Optional — Cloudflare R2 Storage

Without R2, generated images use temporary Replicate URLs (~1 hour expiry).
With R2, images are stored permanently.

1. Go to **cloudflare.com** → R2 → Create bucket → name: `mbgen-assets`
2. Bucket → Settings → Public Access → Allow → copy Public URL
3. R2 → Manage API Tokens → Create token (Object Read & Write on your bucket)
4. Add to Render:

| Key | Value |
|-----|-------|
| `R2_ACCOUNT_ID` | Cloudflare dashboard → right sidebar → Account ID |
| `R2_ACCESS_KEY_ID` | from token |
| `R2_SECRET_ACCESS_KEY` | from token |
| `R2_BUCKET_NAME` | `mbgen-assets` |
| `R2_PUBLIC_URL` | `https://pub-xxx.r2.dev` |

---

## 8. First Login & Admin Setup

1. Open your Netlify URL → you'll see the login screen
2. Click **Sign up** → enter your email + password
3. **First account automatically becomes admin** (unlimited API usage)
4. All subsequent signups get `user` role ($0.10/month limit)
5. To promote a teammate: go to **/admin** → Make admin

---

## Verification

After all steps, go to your Netlify URL → **Settings** page.
The Service Status card should show green for each configured service.

| Check | How |
|-------|-----|
| Auth works | Login redirects to dashboard |
| DB works | Settings → Service Status → Database: Configured |
| Claude works | Banner Studio → AI Ideas button works |
| Images work | Image Studio → generate an image |
| Admin panel | Navigate to `/admin` → see user table |
| Style import | Settings → Brand Style → upload a .css file |
| Spend limit | Regular user hits $0.10 → gets error message |

---

## All Environment Variables Reference

### Render (backend)
```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:...@db.xxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://your-site.netlify.app
ANTHROPIC_API_KEY=sk-ant-api03-...
REPLICATE_API_KEY=r8_...
GOOGLE_GENAI_API_KEY=AIza...          # optional, Veo 2 only
R2_ACCOUNT_ID=...                     # optional, permanent image storage
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=mbgen-assets
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

### Netlify (frontend)
```
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
