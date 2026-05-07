# Offcut Challenge

## What this is
A B2B marketplace for UK workshops to buy and sell material offcuts.
Public-facing name: "Offcut Challenge". Project/code name: offcut-challenge.
Currently in active development — soft launch target is 5–10 real workshops.

## Business model
- £29/month flat subscription (single tier) — includes marketplace access AND private stock tracking
- 5% transaction fee on each sale between workshops (taken automatically via Stripe Connect)
- Verified business accounts only (Companies House check + manual admin approval)
- Camera app is a separate purchasable product (see Camera App section) — not included in £29/mo

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

## Core architecture: Stock → Marketplace

### The two-layer model
Every offcut exists in two possible states:

**Stock** (private, per workshop)
- Everything a workshop has — scanned via camera OR manually entered
- Never visible to other workshops
- Workshops manage their full inventory here
- Statuses: available / listed / sold / used / archived

**Marketplace listing** (public)
- A curated subset of stock the workshop has chosen to sell
- Linked back to its stock item
- Visible to all verified workshops on the browse page

### How items flow
```
Camera scan → stock_item (draft, available)
                    ↓ workshop reviews
              publish to marketplace → listing (active, public)

Manual entry → stock_item (available) + listing (active)  [created together, published immediately]
                    ↓ when sold
              stock_item.status = sold, listing.status = sold
```

### Key decisions
- **Manual rectangular listings** auto-publish to the marketplace in one step (no separate publish action needed). The stock item is created silently underneath.
- **Camera scans** land in stock first as drafts, workshop reviews and publishes separately. (Camera integration not yet built.)
- **Price belongs to the listing**, not the stock item. Stock tracks what you have; listings track what you're selling and for how much.
- **Manual listings are rectangular only** (length × width × thickness). Camera adds support for L, C, and POLY shapes.
- The stock layer uses a camera-ready schema from day one — shape columns (vertices_mm, svg_path_data etc.) are present but null for manual entries.

---

## Database schema (Supabase)

### workshops
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | Workshop display name |
| slug | text | Unique URL slug |
| companies_house_number | text | |
| companies_house_name | text | Returned by CH API |
| vat_number | text | Optional |
| town | text | Shipping location |
| county | text | |
| postcode | text | Full postcode |
| lat | float8 | Geocoded via postcodes.io |
| lng | float8 | Geocoded via postcodes.io |
| verification_status | text | unverified / pending / approved / rejected |
| rejection_reason | text | |
| verified_at | timestamptz | |
| created_at | timestamptz | |

### profiles
| Column | Type | Notes |
|---|---|---|
| id | uuid | FK → auth.users |
| workshop_id | uuid | FK → workshops |
| created_at | timestamptz | |

Auto-created via DB trigger on auth.users insert.

### stock_items
The canonical inventory record. Every offcut — whether from camera or manual entry — lives here first.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| workshop_id | uuid | FK → workshops |
| source | text | 'manual' or 'camera' |
| shape_type | text | RECT / L / C / POLY |
| category | text | Wood / Metal / Plastic / Other |
| material | text | |
| finish | text | |
| length_mm | integer | Rectangular pieces only |
| width_mm | integer | Rectangular pieces only |
| thickness_mm | integer | |
| bbox_w_mm | float | Bounding box — same as length_mm for RECT |
| bbox_h_mm | float | Bounding box — same as width_mm for RECT |
| area_mm2 | float | length × width for RECT; true polygon area for shapes |
| vertices_mm | jsonb | [[x,y],...] in mm — null for manual RECT entries |
| svg_path_data | text | SVG path string — null for manual RECT entries |
| quantity | integer | |
| description | text | Optional |
| notes | text | Optional, camera operator notes |
| status | text | available / listed / sold / used / archived |
| created_at | timestamptz | |

### listings
The public marketplace record. Always linked to a stock_item (for new entries).

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| workshop_id | uuid | FK → workshops |
| stock_item_id | uuid | FK → stock_items (null for pre-migration legacy listings) |
| category | text | |
| material | text | |
| finish | text | |
| length_mm | integer | |
| width_mm | integer | |
| thickness_mm | integer | |
| quantity | integer | |
| price_pence | integer | Stored as pence |
| description | text | |
| status | text | active / sold / archived |
| created_at | timestamptz | |

### listing_images
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| listing_id | uuid | FK → listings |
| storage_path | text | Path in Supabase Storage 'listing-images' bucket |
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

## Key pages and routes

| Route | Description |
|---|---|
| / | Public landing page |
| /auth/login | Email/password login |
| /auth/signup | Sign up |
| /onboarding | Create workshop name (required after signup) |
| /verification | Submit CH number, VAT, location for approval |
| /dashboard | Stock inventory + verification status banner |
| /listings | Browse all active marketplace listings with filters |
| /listings/new | Add item to stock and publish to marketplace immediately |
| /listings/[id] | Listing detail, photo upload (owner only) |
| /workshops | UK map of all approved workshops (Leaflet) |
| /admin | Admin panel — rufus@i-designfurniture.com only |

---

## What's been built (completed)

### Week 1 — Foundation
- Next.js 15 project, Supabase auth, protected routes, deployed to Vercel

### Week 2 — Database and listings
- Schema: workshops, profiles, listings + RLS
- Workshop onboarding, create/browse listings, dashboard

### Week 3 — Photos, search, filters
- Supabase Storage for listing photos (5MB, JPEG/PNG/WebP)
- Browse filters: category, material, finish, max price, location, postcode distance sort
- Listing detail page with photo gallery

### Week 4 — Verification, admin, map
- Companies House API verification
- /verification form and /admin approval panel
- Workshop map (Leaflet + OpenStreetMap)
- Resend email alert on verification submission
- Location geocoding (postcodes.io), distance sorting

### Stock/marketplace split (in progress)
- stock_items table as canonical inventory
- Manual listings create stock_item + listing together (auto-published)
- Dashboard shows stock inventory with sold/archive actions
- Camera-ready schema columns present on stock_items from day one

---

## What's next

### Immediate
- Finish stock/marketplace split (in progress)
- Edit a listing after creation
- Workshop profile page (/workshops/[slug])

### Week 5 — Stripe Subscriptions
- Register Stripe account (sole trader or Ltd company)
- Apply for Stripe Connect platform access
- £29/month subscription gate
- Stripe Checkout + webhook handling
- subscription_status on workshops table

### Week 6 — Stripe Connect (marketplace transactions)
- Seller Stripe Express onboarding
- Buy button + Stripe payment
- Automatic 95/5 split
- Transaction records in DB

### Week 7 — Messaging, emails, polish
- Buyer-seller messaging
- Transactional emails via Resend
- Multi-user workshop invites
- Mobile layout improvements

### Week 8 — Soft launch
- Invite 5–10 real workshops

---

## Camera app integration (planned — not yet built)

### Product model
The camera app is a separate purchasable product with two output options:
1. **Push to Google Sheets** — standalone, no Offcut Challenge subscription needed
2. **Push to Supabase** — add-on integration, requires Offcut Challenge subscription

Stripe billing for camera app packages to be designed separately.

### What the camera app is
A Python desktop application (PySide6, Windows EXE) with OpenCV computer vision.
Sits above a CNC bed, detects and measures offcut shapes using an Intel RealSense
depth camera or USB 2D camera. Currently saves to Google Sheets.

### What data it captures per offcut
- `shape_type`: RECT / L / C / POLY (classified by vertex count: 4/6/8/other)
- `vertices_mm`: polygon as `[[x,y], ...]` in mm — the canonical geometry
- `svg_path_data`: SVG path string — ready to render in browser
- `area_mm2`: true polygon area
- `bbox_w_mm`, `bbox_h_mm`: bounding box dimensions
- `thickness_mm`: auto-measured from depth camera
- `material`, `qty`, `notes`: operator-entered at save time
- `confidence`: HIGH / MEDIUM / LOW with issue descriptions

### Integration path
Current push: desktop app → POST JSON bundle → Google Apps Script → 4 sheet tabs
Integration: add second POST destination in post_workshop_bundle() → Next.js API route → stock_items table
Estimated camera app change: ~10 lines of Python

Camera scans land in stock_items as 'available' (draft).
Workshop reviews in dashboard, clicks "Publish to marketplace" → creates listing with price.

### API key authentication
Each workshop gets a unique API key from their dashboard.
Pasted into camera app once during setup.
Every POST includes the key in Authorization header.
Endpoint verifies key, resolves workshop, creates draft stock_item.

### Important notes
- Camera photos saved locally only — not pushed. Marketplace photos need a separate upload step.
- Camera's offcut_id (e.g. COOP-RECT-48234.5) can collide — always use Supabase UUID as PK.
- Human review always required — operator clicks Save per scan, nothing auto-submits.
- stock_items schema already includes all camera columns — no schema changes needed when camera integration is built.
