# VegGain 8

High-protein vegetarian and vegan meal plan (Indian, Korean, Chinese, Japanese, Thai, Mexican, Mediterranean, Italian and everyday American dishes, plus drinks and fruit bowls) for muscle gain, weight gain, focus and skin health over 8 weeks. Built with **Next.js 16 (App Router) + React 19 + TypeScript**.

## Pages
| Route | What it has |
|---|---|
| `/` | Targets, how it works, sample day, links to every section |
| `/menu` | 79 recipes: meals, drinks, fruit bowls and skin-glow picks; search, sort, diet/cuisine filters, saved list, 4 layouts |
| `/menu/[id]` | Shareable page for every recipe (prerendered), with photo credit and related dishes |
| `/plan` | Day builder and the 8-week progression |
| `/health` | Brain-focus and skin nutrients, what food can and cannot do |
| `/shop` | Weekly grocery list, Bay Area stores by cuisine, seasonal fruit calendar |
| `/chefs`, `/chefs/[id]` | 20 chefs with their latest vegetarian videos and every matching VegGain recipe |
| `/agents` | Data agent status, settings and resources |
| `/credits` | Photo sources and licenses |
| `/learn` | Indian chefs, YouTube channels and monetization, business ideas, deploy steps |

## Features
- **Kidney care:** 18 low-salt recipes with sodium, potassium and phosphorus from USDA FoodData Central, checked against National Kidney Foundation meal targets; a kidney-health setting in the calculator (KDOQI 2020 protein ranges) that pauses the muscle-gain weekly plan.
- **Cuisines:** Punjabi, Gujarati, Marathi, Rajasthani/Marwari, South Indian, Bihari and North Indian home-style, plus Korean, Chinese, Japanese, Thai, Mexican, Mediterranean and Italian
- **Egg-free:** "Vegetarian" means lacto-vegetarian (dairy yes; no meat, fish or eggs). Vegan recipes are tagged separately
- **Real photos** for every dish from Wikimedia Commons and Openverse (Creative Commons / public domain), cropped to 800×600 WebP in `public/meals/`, credited on `/credits`
- **Layouts:** Cards, Squares, Wide rectangles and List (remembered per browser)
- Recipes take ≤30 min active cooking, with ingredients, steps, macros, vitamins, cost (USD / INR) and a YouTube cook-along link; ingredients are available in Bay Area stores
- Left-side drawer (burger icon): recipe categories with live counts, diet and cuisine filters, and page links
- Card motion: staggered entrance; compact cards that lift on hover while a zoom-in popup shows the full recipe; tap opens a full view on phones; animated dish illustrations with steam
- 9 switchable designs: Bento grid, Neomorphism, Skewmorphism, Glassmorphism, Skeuomorphism, Brutalism, Minimalism, Liquid glass, Spatial UI (also via URL hash, e.g. `/#brutal`)
- Day builder that totals protein, calories, carbs, fat and cost against targets from your body weight
- Light/dark mode, keyboard accessible, respects Reduce Motion

## Requirements
- Node.js 20.9 or newer (`node -v`)

## Data agents (fresh data on every start)
Four agents in `agents/` run automatically before every build, so the site always shows fresh details when you start it.

| Agent | What it fetches | Source (free) | Settings | Output |
|---|---|---|---|---|
| `chefs` | Latest vegetarian videos for 20 chefs (meat/fish/egg titles filtered out) | YouTube channel pages, or YouTube Data API v3 with an optional key | `agents/chefs/.env` | `data/chefs.json` |
| `nutrition` | Protein, calories, fiber, iron, calcium, zinc, vitamin C per 100 g for 22 protein foods | USDA FoodData Central (`DEMO_KEY` or free key) | `agents/nutrition/.env` | `data/nutrition.json` |
| `currency` | Today's USD → INR/EUR/GBP rates | ExchangeRate-API open endpoint | `agents/currency/.env` | `data/currency.json` |
| `photos` | Re-verifies every photo credit; finds, crops and credits photos for new recipes | Wikimedia Commons API + sharp | `agents/photos/.env` | `public/meals/*.webp`, `lib/photo-credits.json` |

- Each agent folder has `agent.mjs`, `.env` (your settings, git-ignored), `.env.example`, and `resources.json` (the sources it uses).
- `npm run agents` refreshes (respecting each agent's `*_TTL_HOURS`); `npm run agents:force` refreshes everything.
- A failing agent never stops the app; it keeps its last good data. Status and resources are shown at `/agents`.
- Optional keys: `CHEFS_YOUTUBE_API_KEY` (https://console.cloud.google.com), `NUTRITION_USDA_API_KEY` (https://fdc.nal.usda.gov/api-key-signup).

## Setup and run
```bash
cd veggain8
npm install
npm run dev          # http://localhost:3000
```

Production build:
```bash
npm run build
npm start            # http://localhost:3000
```

## Project structure
```
app/layout.tsx              root layout: fonts (next/font), metadata, header, drawer, footer
app/page.tsx                home
app/{menu,plan,health,shop,learn}/page.tsx   one route per section
app/sitemap.ts, robots.ts   SEO files
lib/site.ts                 page list used by the nav, drawer and sitemap
app/globals.css             all nine design styles (body[data-style=...])
lib/meals.ts                meal data — edit recipes, prices, YouTube queries here
components/PlannerProvider  shared state (style, currency, day, filters, drawer) + localStorage
components/Header           burger, nav, design dropdown, currency toggle
components/CategoryDrawer   left-side category drawer
components/MealExplorer     filters, card grid, full-view dialog
components/MealCard         card with motion, recipe details and actions
components/MealPhoto        next/image wrapper + photo credit line
components/DayBuilder       daily totals calculator
components/content/*        static content (server components, no client JS)
components/SeasonalFruit    fruit calendar that highlights the current season
```

## Replacing a photo
1. Save an 800×600 (4:3) image as `public/meals/<recipe id>.webp`, e.g. `public/meals/b1.webp`.
2. Update that recipe's entry in `lib/photo-credits.json` (title, author, license, source page).
3. Only use photos you own or that are licensed for commercial reuse with attribution.

## Deploy
**Free (Vercel Hobby, personal/non-commercial):**
1. Push this folder to a GitHub repo.
2. Go to https://vercel.com/new, import the repo; Next.js is detected automatically.
3. Or from the folder: `npx vercel` (then `npx vercel --prod`).

**Paid (commercial use):** Vercel Pro ($20/month) — https://vercel.com/pricing. Add a custom domain under Project → Settings → Domains.

Other free hosts: Netlify (https://www.netlify.com/pricing/), Cloudflare Pages.

## Disclaimer
Educational information, not medical advice. Food supports health but does not cure disease. Consult a doctor or registered dietitian before changing your diet or taking supplements. Macros and costs are estimates (Oct 2026).

## Performance notes
- Every route is prerendered as static HTML at build time.
- Static content is rendered by server components, so only the interactive parts (menu, day builder, drawer, header) ship JavaScript, and the menu code loads only on `/menu`.
- Fonts are self-hosted by `next/font`; the two secondary faces are not preloaded.
- Cards are memoized and the shared context value is memoized to avoid needless re-renders.
- Sections below the fold use `content-visibility: auto`.
- Set `NEXT_PUBLIC_SITE_URL` to your domain so the sitemap and social tags use it.
