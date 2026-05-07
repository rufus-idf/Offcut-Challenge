# Offcut Challenge

## What this is
A B2B marketplace for UK workshops to buy and sell material offcuts.
Public-facing name: "Offcut Challenge". Project/code name: offcut-challenge.
Currently in active development — soft launch target is 5–10 real workshops.

## Business model
- £29/month flat subscription for verified workshops to access the platform
- 5% transaction fee on each sale between workshops (taken automatically via Stripe Connect)
- Verified business accounts only (Companies House check + manual admin approval)
- Planned add-on: camera app integration for automated stock capture (see Camera App section below)

## Live URLs
- Production: https://offcut-challenge.vercel.app
- Supabase project: https://ntrpkwvhnbssnlmorwqv.supabase.co
- GitHub: https://github.com/rufus-idf/Offcut-Challenge
- Admin panel: https://offcut-challenge.vercel.app/admin (rufus@i-designfurniture.com only)

## Tech stack
- Next.js 15 (App Router, TypeScript, Tailwind v4, Turbopack)
- Supabase (Postgres, Auth, Storage)
- Stripe (Subscriptions for £29/mo, Connect for marketplace transactions) — not yet built
- Resend (transactional email) — partially integrated
- Leaflet + OpenStreetMap (workshop map)
- Postcodes.io (free UK geocoding, no API key needed)
- Companies House REST API (company verification)
- Hosting: Vercel (frontend) + Supabase (backend)

## Infrastructure & deployment flow
- Code lives locally on Windows PC, pushed to GitHub
- Vercel auto-deploys on every push to main (build takes ~90 seconds)
- One shared Supabase project used by both local dev and production
- Environment variables stored in .env.local (local) and Vercel dashboard (production)
- Dynamic imports with ssr:false must live inside 'use client' files — Turbopack requirement

## Code style preferences
- TypeScript strict mode
- Server Components by default; Client Components only when needed
- Tailwind for all styling, no CSS modules
- Server Actions over API routes where possible
- No comments unless the WHY is non-obvious

---

## Database schema (Supabase)

### workshops
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | Workshop display name |
| slug | text | Unique URL slug |
| companies_house_number | text | 8-char CH number |
| companies_house_name | text | Name returned by CH API |
| vat_number | text | Optional |
| town | text | Shipping location |
| county | text | |
| postcode | text | Full postcode |
| lat | float8 | Geocoded from postcode via postcodes.io |
| lng | float8 | Geocoded from postcode via postcodes.io |
| verification_status | text | unverified / pending / approved / rejected |
| rejection_reason | text | Set by admin on rejection |
| verified_at | timestamptz | Set on approval |
| created_at | timestamptz | |

### profiles
| Column | Type | Notes |
|---|---|---|
| id | uuid | FK → auth.users |
| workshop_id | uuid | FK → workshops |
| created_at | timestamptz | |

Auto-created via DB trigger on auth.users insert.

### listings
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| workshop_id | uuid | FK → workshops |
| category | text | Wood / Metal / Plastic / Other |
| material | text | See constants.ts |
| finish | text | See constants.ts |
| length_mm | integer | |
| width_mm | integer | |
| thickness_mm | integer | |
| quantity | integer | |
| price_pence | integer | Stored as pence to avoid float issues |
| description | text | Optional |
| status | text | active / sold / archived |
| created_at | timestamptz | |

### listing_images
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| listing_id | uuid | FK → listings |
| storage_path | text | Path in Supabase Storage bucket 'listing-images' |
| position | integer | Display order |
| created_at | timestamptz | |

---

## Categories and materials

### Wood
Materials: MDF, Plywood, Chipboard, Oak, Birch ply, Pine, Walnut, Beech
Finishes: Raw / unfinished, White melamine, Oak veneer, Walnut veneer, Black melamine, Birch faced, Pre-primed, Laminated

### Metal
Materials: Mild steel, Stainless steel, Aluminium, Copper, Brass, Cast iron
Finishes: Raw / unfinished, Powder coated, Galvanised, Brushed, Anodised, Painted, Polished

### Plastic
Materials: Acrylic, HDPE, Polypropylene, PVC, Polycarbonate, ABS
Finishes: Natural, Clear, Frosted, Coloured, Textured

### Other
Materials: Foam, Rubber, Cork, Composite, Carbon fibre, Glass
Finishes: Raw / unfinished, Coated, Treated

---

## Core entities
- **Workshops**: business accounts, verified via Companies House, have a subscription, can list and buy
- **Users**: individuals belonging to a workshop (multi-user invite system not yet built — workaround: share login)
- **Listings**: material offcuts with category, dimensions, price, photos, status
- **Listing images**: photos stored in Supabase Storage, displayed on browse cards and detail page
- **Offers**: buyer proposes alternate price — NOT YET BUILT
- **Transactions**: completed purchases with 5% fee — NOT YET BUILT
- **Subscriptions**: per-workshop monthly Stripe subscription — NOT YET BUILT
- **Messages**: buyer-seller communication — NOT YET BUILT

---

## Key pages and routes

| Route | Description |
|---|---|
| / | Public landing page |
| /auth/login | Email/password login |
| /auth/signup | Sign up — triggers onboarding after |
| /onboarding | Create workshop name (required after signup) |
| /verification | Submit CH number, VAT, location for approval |
| /dashboard | Workshop's own listings, verification status banner |
| /listings | Browse all active listings with filters |
| /listings/new | Create a listing (approved workshops only) |
| /listings/[id] | Listing detail, photo upload (owner only) |
| /workshops | UK map of all approved workshops (Leaflet) |
| /admin | Admin panel — rufus@i-designfurniture.com only |

---

## What's been built (completed)

### Week 1 — Foundation
- Next.js 15 project with Tailwind v4 and TypeScript
- Supabase auth (email/password signup, login, logout, session refresh via middleware)
- Protected /dashboard — server-side auth check
- Deployed to Vercel with GitHub auto-deploy

### Week 2 — Database and listings
- Supabase schema: workshops, profiles, listings tables with RLS policies
- DB trigger auto-creates profile on signup
- Workshop onboarding flow (/onboarding)
- Create listing form (/listings/new) with Server Action
- Browse page (/listings) with listing cards
- Dashboard shows workshop's own listings in a table

### Week 3 — Photos, search, filters
- Supabase Storage bucket 'listing-images' for listing photos
- Photo upload on listing detail page (owner only, JPEG/PNG/WebP, max 5MB)
- Browse filters: category, material, finish, max price, location (town), postcode distance
- Distance sorting using postcodes.io geocoding + Haversine formula
- Browse cards show first photo with hover effect
- Listing detail page with photo gallery and info panel

### Week 4 — Verification and admin
- Companies House REST API integration (Basic Auth, server-side)
- /verification form: CH number, VAT, town, county, postcode
- verification_status workflow: unverified → pending → approved → rejected
- /admin panel: list all workshops, approve/reject with reason
- Admin protected by email check (404 for non-admins)
- Dashboard banners for each verification state
- New listing gated behind approved status
- Location stored and geocoded at verification time (lat/lng via postcodes.io)
- Workshop map at /workshops using Leaflet + OpenStreetMap
- Resend email alert to admin when a workshop submits for verification

---

## What's next

### Immediate (before Stripe)
- Mark listing as sold / archive listing (functional gap — no way to update status currently)
- Edit a listing after creation
- Workshop profile page (/workshops/[slug]) showing all their active listings

### Week 5 — Stripe Subscriptions
- Stripe account needed (register as sole trader or Ltd company)
- Apply for Stripe Connect platform access in Stripe dashboard
- £29/month subscription gate — workshops can't access marketplace without active subscription
- Stripe Checkout for payment
- Webhook handling for subscription lifecycle (created, cancelled, payment failed)
- subscription_status stored on workshops table

### Week 6 — Stripe Connect (marketplace transactions)
- Seller onboarding with Stripe Express (workshops connect their own bank account)
- Buy button on listing detail page
- Payment splits automatically: 95% to seller, 5% to platform
- Transactions recorded in database
- Depends on Week 5 being solid first

### Week 7 — Messaging, emails, polish
- Buyer-seller messaging (stored in DB)
- Transactional emails via Resend (listing sold, new message, offer received)
- Multi-user workshop invites (currently one login per workshop)
- Mobile layout improvements
- Price sort option on browse page

### Week 8 — Soft launch
- Invite 5–10 real workshops
- Monitor, fix issues, gather feedback

---

## Camera app integration (planned — not yet built)

### What the camera app is
A separate Python desktop application (PySide6, Windows EXE) that sits above a CNC bed.
Uses a camera (Intel RealSense depth camera or USB 2D camera) and OpenCV computer vision
to detect and measure offcut shapes automatically. Currently saves to Google Sheets.
The intention is to replace/supplement the Google Sheets output with direct Supabase integration.

### What data it captures per offcut
- `shape_type`: RECT / L / C / POLY (classified by vertex count)
- `vertices_mm`: polygon as `[[x,y], ...]` in mm relative to bed origin — the canonical geometry
- `svg_path_data`: SVG path string derived from vertices — ready to render in browser
- `area_mm2`: true polygon area
- `bbox_w_mm`, `bbox_h_mm`: bounding box dimensions
- `thickness_mm`: auto-measured from depth camera (P95 height above bed)
- `material`, `qty`, `grade`, `notes`: operator-entered at save time
- Confidence score: HIGH / MEDIUM / LOW with specific issue descriptions

### How the push currently works
Operator clicks "Save + Push to Google Sheets" → desktop app POSTs a JSON bundle
to a Google Apps Script /exec URL via urllib.request. The Apps Script writes to 4 sheet tabs.
Integration path: add a second POST destination in post_workshop_bundle() pointing to a
Next.js API route. Estimated change to camera app: ~10 lines of Python.

### What the Supabase schema needs to support shapes
The current listings table assumes rectangles (length_mm, width_mm, thickness_mm).
New columns needed (additive — doesn't break existing rectangular listings):
- `shape_type` text (RECT / L / C / POLY)
- `vertices_mm` jsonb ([[x,y],...])
- `svg_path_data` text
- `area_mm2` float
- `bbox_w_mm` float
- `bbox_h_mm` float
- `source` text ('manual' or 'camera')

For rectangular camera scans: bbox_w_mm and bbox_h_mm map to existing length_mm/width_mm.
For L, C, POLY shapes: bounding box gives rough size, SVG gives true shape for display.

### What the app UI needs to support shapes
- Listing cards: render SVG outline instead of text dimensions for non-rectangular pieces
- Listing detail: scaled SVG with annotated dimensions
- Dashboard: draft queue for incoming camera scans awaiting workshop review
- Browse filters: shape_type and area_mm2 as additional filter options

### API key authentication (for camera → Supabase push)
Each workshop gets a unique API key generated in their dashboard.
Camera app stores it once (pasted in by operator during setup).
Every POST to the ingest endpoint includes the key in the Authorization header.
The endpoint verifies the key, resolves the workshop, creates a draft listing.

### Important notes
- Camera photos (preview.png, mask.png) are saved locally only — not pushed to Google Sheets.
  If marketplace listings need photos, the camera app needs a new upload step to Supabase Storage.
- The camera app's offcut_id (e.g. COOP-RECT-48234.5) is NOT a stable unique key — can collide.
  Always generate a UUID primary key on the Supabase side; treat offcut_id as a human-readable label.
- Human review is always required — operator must click Save for each scan. Nothing auto-submits.

### Phasing recommendation
1. Now: add shape columns to listings table (non-breaking migration)
2. After Stripe: build POST /api/ingest endpoint and camera → Supabase push
3. Alongside: update listing card and detail UI to render SVGs for camera-sourced listings
