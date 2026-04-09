# MBGen — Team Guide: App Workflow & Features

## What is MBGen?

MBGen (Marketing Brief Generator) is an AI-powered content studio for marketing teams. It takes campaign briefs — either typed manually or imported from an external media plan — and generates all the creative content needed for a campaign: ad copy, images, animations, and video.

Two main use cases:
1. **Your own campaigns** — build from scratch using the campaign wizard
2. **External agency/media plan** — paste a document (from an agency like Widoczni), Claude extracts the campaigns automatically, and you generate visuals and additional content from there

---

## Step-by-Step Workflow

### 1. Log In
Go to the app and sign in. New users can register with an email. If you forget your password, use the reset link.

---

### 2. Dashboard
After login you land on the **Dashboard** — your campaign hub. It shows your 6 most recent campaigns with quick access to generate content for each.

From here you can:
- Open an existing campaign
- Create a new campaign manually
- Import a strategy document (the main workflow for agency campaigns)

---

### 3. Two Ways to Create a Campaign

#### Option A: Import from a Marketing Document (recommended for agency briefs)

**Go to: Navigation → Import Strategy**

This is the fastest path when you receive a media plan from an external agency (e.g., Widoczni, an in-house strategist, or any structured brief document).

1. **Paste the document** — copy and paste the raw text from the spreadsheet or brief. Any format works: Polish, English, German, tables, bullet points.
2. **Claude reads and extracts** — the AI identifies individual campaigns, target audiences, ad formats, copy examples, goals, and budgets.
3. **Review the suggestions** — each extracted campaign appears as a card showing:
   - Campaign name and goal (Awareness / Traffic / Engagement / Conversion)
   - Daily budget
   - Target audience
   - Copy examples that were found in the document
   - Recommended ad formats
4. **Click "Create Campaign"** on any suggestion — it automatically builds the campaign with all the extracted data and takes you directly to the content generation screen.

#### Option B: Create Campaign Manually

**Go to: Navigation → New Campaign**

Use this when you're building a campaign from scratch without an external brief.

The wizard has 4 steps:
1. **Strategy** — Campaign name + strategy description (what is this campaign for, what message should it convey)
2. **Audience** — Demographics, psychographics, pain points, platforms (Instagram, Facebook, TikTok, YouTube, LinkedIn, Twitter)
3. **Brand** — Brand name, tone of voice, colors, fonts, optional logo upload
4. **Inspiration** — Upload reference images to guide the visual direction

After submitting, Claude automatically generates a structured **Brief** — a strategic summary used as context for all content generation.

---

### 4. Generate Content

After creating a campaign (either way), you land on the **Generate** screen. This is the main creative workspace.

It has 4 generators:

#### Copy
Generates platform-adapted ad copy based on your campaign brief.
- Click **Generate** to create copy
- Use the **Instruct** bar to refine it: "Make it shorter", "Add urgency", "Translate to German"
- Copy to clipboard

#### Images
Generates ad creatives using AI image models (Replicate FLUX and others).
- Select **aspect ratio**: 1:1 (square), 9:16 (stories/reels), 16:9 (landscape), 4:3, 3:4
- Select **model**: FLUX 1.1 Pro or others
- Click **Generate** — generation takes 15–60 seconds
- Use **Instruct** to refine: "Change background to white", "Add product in foreground"
- Download as WebP

#### Animations
Generates GSAP animation configurations for banner ads.
- Click **Generate** to create an animation timeline
- Use **Instruct** to adjust: "Speed up entrance animation", "Add a fade-out"
- Export as JSON config (used with the GSAP library)

#### Video
Generates short marketing videos.
- Select **model**: Google Veo 2 (~3 min), Wan 2.1 (~1 min), Luma, others
- Click **Generate** — a progress bar tracks completion
- Use **Instruct** to refine
- Download as MP4

---

### 5. Preview & History

**Campaign Preview** (`/campaign/:id/preview`) — see all generated content for a specific campaign in one place. Images, videos, copy, animations. Export from here.

**History** (`/history`) — full log of every generation across all campaigns. Searchable by type, platform, and status. Export any item.

---

### 6. Supporting Tools

#### Image Studio (`/images`)
Freeform image generation — not tied to a campaign. Enter a free-text prompt, choose aspect ratio and model, generate. Good for quick creative experiments.

#### Banner Studio (`/banner`)
AI-generated banner suggestions. Input brand info and get back:
- Headlines, subheadlines, CTAs
- Color palette recommendations
- Marketing angles with complete copy variations

#### Settings (`/settings`)
- **Brand Style Upload** — upload a CSS/SCSS/Vue file with your brand styles. Claude will use detected colors and fonts in all generations automatically.
- **Service Health** — shows which AI services are operational (Anthropic, Replicate, Google AI, R2 storage, database).

---

## How to Use the Poliglotter Campaign Input

The input from Widoczni is a media plan with two main campaigns and six ad sets. Here is how to work with it in MBGen:

### What the Input Contains

**Campaign 1: WIDOCZNI - AKTYWNOŚĆ** (Awareness / Fanpage visits)
- 4 ad sets targeting different regions and languages:
  - Poland → Polish audience (copy in Polish)
  - Poland → English-language audience (copy in English)
  - Germany → German-language audience (copy in German)
  - Germany → English-language audience (copy in English)
- Budget: 5 PLN/day per ad set
- Formats needed: 1080×1080 (square), 1080×1350 (portrait), 1920×1080 (landscape), 9:16 video
- Copy: already written and provided in the document for each language

**Campaign 2: WIDOCZNI - SPRZEDAŻ** (Sales / Purchase)
- 2 ad sets:
  - Professionals (Poland, Polish): focus on learning during work hours
  - Students (Poland, Polish): focus on learning while watching Netflix
- Budget: 40 PLN/day per ad set
- Formats: same 3 graphic formats
- Copy: already written in Polish for both

### Step-by-Step: Creating These Campaigns in MBGen

**Step 1 — Import the document**

Go to **Import Strategy** in the navigation. Paste the full spreadsheet content into the input field.

Claude will parse it and should suggest 2 campaigns: WIDOCZNI - AKTYWNOŚĆ and WIDOCZNI - SPRZEDAŻ.

**Step 2 — Create the AKTYWNOŚĆ campaign**

Click "Create Campaign" on the AKTYWNOŚĆ suggestion. This creates one campaign that covers the awareness objective.

> Note: The 4 ad sets (PL/Polish, PL/English, DE/German, DE/English) are variations of the same campaign goal. MBGen handles this by generating per-platform content. You can use the **Instruct** feature to specify language: "Generate this copy in German for the DE audience".

**Step 3 — Generate images for AKTYWNOŚĆ**

In the Generate screen:
- The copy is already supplied by Widoczni — you don't need to regenerate it unless you want variations
- Focus on **Image generation**: generate all 3 formats
  - 1:1 aspect ratio → 1080×1080
  - 4:3 or 3:4 portrait → 1080×1350
  - 16:9 landscape → 1920×1080
- For video: generate 9:16 format using the Video generator
- Use Instruct to adapt for each language/region: "Version for German audience"

**Step 4 — Create the SPRZEDAŻ campaign**

Repeat the import/create flow for the SPRZEDAŻ suggestion. This campaign targets conversion, so the creatives should be more product-focused.

Two audience segments (Profesjonalista and Student) can be handled in MBGen as two separate generation runs with different platform/audience instructions, or as two separate campaigns if you need to keep them cleanly separated.

**Step 5 — Export and deliver**

Use the **Preview** view to review all generated images and videos. Download each in the required format. MBGen exports images as WebP and video as MP4.

---

### What MBGen Does vs. What Widoczni Already Provided

| Asset | Status | Action in MBGen |
|-------|--------|----------------|
| Ad copy (all languages) | Provided by Widoczni | Import via strategy import; use as-is or regenerate variations |
| Square images (1080×1080) | Needs creation | Generate with Image generator, 1:1 ratio |
| Portrait images (1080×1350) | Needs creation | Generate with Image generator, 3:4 ratio |
| Landscape images (1920×1080) | Needs creation | Generate with Image generator, 16:9 ratio |
| Video (9:16) | Needs creation | Generate with Video generator, 9:16 format |
| Campaign strategy / targeting | Provided by Widoczni | Extracted automatically on import |

---

## User Permissions

| Role | Access | Spend Limit |
|------|--------|------------|
| User | All features except admin | $0.10/month |
| Admin | All features + user management | Unlimited |

Admins can reset user spend and assign the admin role from the `/admin` panel.

---

## Cost Tracking

Every generation shows its estimated cost in USD. The UI tracks total monthly spend per user. When a user approaches their limit, generation is blocked until an admin resets their budget. All costs are logged and visible in the admin panel.
