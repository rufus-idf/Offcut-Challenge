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

## Database migration convention
All SQL changes are saved in `supabase/migrations/` as numbered files before being given to the user to run.

**Rule for all agents: whenever you write a SQL block for the user to run, you MUST also save it as a migration file first.**

File naming: `NNN_short_description.sql` (e.g. `007_add_offers_table.sql`)
Each file has a comment header explaining what it does and when it was run.

Current migrations:
- `001_initial_schema.sql` — workshops, profiles, listings, RLS, trigger
- `002_listing_images.sql` — listing_images table and storage bucket
- `003_categories.sql` — category column, expanded material/finish constraints
- `004_verification.sql` — verification_status workflow, CH/VAT/location fields
- `005_geocoding.sql` — lat/lng columns on workshops
- `006_stock_items.sql` — stock_items table, stock_item_id on listings

**Do NOT save one-off data operations** (DELETE, UPDATE on existing rows) as migrations — only save schema changes (CREATE TABLE, ALTER TABLE, CREATE POLICY etc.).

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
Camera scan → stock_item (source=camera, status=available)
                    ↓ workshop reviews in dashboard
              /stock/[id]/publish → set finish + price → listing (active, public)

Manual entry → /listings/new → stock_item (source=manual, status=available)
                    ↓ workshop reviews in dashboard
              /stock/[id]/publish → set finish + price → listing (active, public)

                    ↓ when sold
              stock_item.status = sold, listing.status = sold
```

### Key decisions
- **Both manual and camera items follow the same two-step flow**: add to stock → review in dashboard → publish to marketplace with price. There is no auto-publish. This gives workshops a chance to review before going live.
- **Camera scans** land in stock first as drafts (finish=null, status=available). Workshop sets finish and price at publish time.
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

### Stock/marketplace split (complete)
- stock_items table as canonical inventory (source: manual or camera)
- Two-step flow: /listings/new creates stock_item → /stock/[id]/publish creates listing with price
- Dashboard shows stock inventory with filter tabs (all / in stock / listed / sold / archived)
- Sold, archive, and relist actions on dashboard rows
- Edit stock item before publish: /stock/[id]/edit (available items only)
- Edit listing after publish: /listings/[id]/edit (price, quantity, finish, description)
- Camera API endpoint live at /api/ingest — API key auth, creates draft stock_items
- API key management in dashboard (approved workshops only)
- Camera-ready schema columns present on stock_items from day one
- Workshop profile page: /workshops/[slug] — shows active listings for any approved workshop

---

## Build phases

The app is being built in four sequential phases. Do not skip ahead — each phase gates the next.

### Phase 1 — Full functionality (current)
Get every feature working end-to-end before touching layout or payments.
The goal is: can the app do everything it needs to do?

**Remaining items:**
- Fix Resend sender domain (test domain → verified custom domain)
- Wire enquiry emails to the actual seller, not just admin
- Page titles / metadata (generateMetadata on each page)
- Bulk dashboard actions (archive/mark sold multiple items)
- Terms & Conditions and Privacy Policy pages (legal requirement)
- Stripe webhook handler skeleton (ready for Phase 3)

### Phase 2 — Layout, style and UX polish
Once all functionality is in place, do a full design pass:
- Visual design system (typography, spacing, colour tokens)
- Page layout and navigation structure
- Component consistency across the app
- Empty states, error pages (404, 500)
- Loading skeletons
- Accessibility audit

### Phase 3 — Stripe payments
Only start this after Phase 2 is signed off.
- Register Stripe account and apply for Connect platform access
- Build separate marketplace/storefront website (separate Next.js repo)
- Stripe Payment Link on storefront → webhook → invite email via Resend
- £29/month subscription gate in app
- Seller Stripe Express onboarding
- Buy button + PaymentIntent (95/5 split via Connect)
- Transaction records in DB

### Phase 4 — Responsive web (mobile browser)
Full mobile layout pass after desktop is stable and payments are live.
This is NOT the native app — it just makes the web app usable on phones.
- Responsive dashboard (currently table-based, breaks on small screens)
- Mobile navigation (hamburger / bottom nav)
- Touch-friendly interactions (larger tap targets, swipe gestures)
- Test on real devices before soft launch

### Soft launch
Invite 5–10 real UK workshops once Phase 3 is complete and Phase 4 is acceptable.

---

## Phase 5 — Native mobile app (future project)

**Do not start until:** web app is fully launched, Stripe is live, and the product is stable.
Building mobile against a moving backend creates maintenance debt on two codebases simultaneously.

### Platform decision: React Native (Expo)
- Single codebase for iOS and Android
- TypeScript — same language as the web app
- Supabase has a first-class React Native SDK — connects to the same database, same auth, same RLS policies
- Expo Go enables testing on real devices without App Store review
- Can share types, constants, and some business logic between web and mobile repos
- **Do NOT use PWA** — Apple's PWA support is too limited for a real product

### Key accounts needed
- Apple Developer Program: £79/year — required to submit to App Store (review takes 1–4 weeks)
- Google Play Console: £20 one-time — required to publish on Android (review takes a few days)

### What the native app should do
The mobile app is not just a companion viewer — it should absorb the camera scanning feature,
replacing the current Python desktop app entirely.

**Core screens:**
- Auth (Supabase, shared sessions with web)
- Browse listings (same marketplace data)
- Workshop profiles and map
- My Stock dashboard (manage inventory on the go)
- Publish to marketplace
- **Camera scanner** — replaces the Python desktop EXE:
  - Use Expo Camera + device camera
  - Capture offcut above CNC bed or workbench
  - Detect shape, measure dimensions (or manual entry on phone)
  - POST to /api/ingest with API key → lands in stock as draft
  - Much better UX than a Windows desktop app

### Architecture
```
React Native (Expo) app
        ↓
Supabase JS SDK (same project as web)
        ↓
Same Postgres DB, same RLS policies, same auth
        ↓
/api/ingest endpoint (for camera push — already built)
```

### Shared between web and mobile
- Supabase project (database, auth, storage)
- All stock_items, listings, workshops data
- API keys for camera integration
- Stripe customer/subscription records
- Types can be shared via a shared package or duplicated manually

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

---

## Future Features — Phase 6+

The following features have been identified for development after the core platform (Phases 1–5) is stable and live. These are architectural ideas — detailed design work is required before implementation begins.

### In-app messaging and enquiry tracking
- Replace the current email-only enquiry system with real-time in-app chat between buyer and seller workshops
- Every message stored in the database and auditable by admin — prevents fraud and out-of-app transaction attempts
- Auto-moderation: flag or block messages containing bank account details, external payment links, phone numbers, or WhatsApp references (fee evasion prevention)
- Message threads linked to a specific listing so full context is preserved alongside the conversation
- Typing indicators and read receipts via Supabase Realtime subscriptions
- Tech: `messages` table (id, listing_id, sender_workshop_id, body, flagged, created_at), Supabase Realtime for live UI updates, server-side moderation on insert

### Offer and negotiation system
- Buyers can submit a counter-offer below the listed price on any active listing
- Seller receives in-app notification + email and can: Accept (locks in price, triggers payment), Counter (new price), or Decline
- Offers expire automatically after 48 hours with no response
- Full offer history visible to both parties; admin can view all offers for compliance monitoring
- Tech: `offers` table (listing_id, buyer_workshop_id, offered_price_pence, status, expires_at), Resend for email notifications

### Bundle and quantity discount tiers
- Sellers set tiered pricing on a listing: e.g. 1–4 pieces at £12 each, 5–9 at £10 each, 10+ at £8 each
- Tier pricing automatically calculated at checkout based on quantity selected by buyer
- Pricing tiers displayed clearly on listing cards and the listing detail page
- Tech: `listing_price_tiers` table (listing_id, min_qty, price_pence) or a JSON column on listings — to be decided at design time

### Photo verification
- During photo upload, run a lightweight AI check to verify the image is plausibly relevant to the declared material and category
- Flag obvious mismatches (e.g. a person's face uploaded for an oak board listing) for admin review — not an outright block, listings remain live
- Result and confidence score stored on `listing_images` for admin visibility
- Tech: Anthropic Claude API (vision) called server-side inside the upload Server Action; result stored in a `verification_status` column on listing_images

### In-app AI chatbot for material search
- Natural language search: "I need 20 pieces of 18mm birch ply, at least 1200mm long, within 50 miles of Bristol"
- Claude API with tool use parses the request and runs a structured query against `listings`
- Returns matching results inside the chat UI with direct links to listings
- Can also surface workshops that regularly stock requested materials based on sold/listed history
- Tech: Claude API (tool use / function calling), streamed responses, dedicated `/chat` route in the app

### Discord community and stock alert bot
- Official Offcut Challenge Discord server for the workshop community: announcements, tips, and platform updates
- `#new-listings` channel: bot posts automatically when new items go live — includes material, dimensions, price, and workshop location, with category filtering
- `#stock-alerts`: workshops subscribe to notifications for specific materials or dimensions (e.g. "notify me when 18mm+ oak boards appear")
- Bot commands: `!search [material] [thickness]` returns matching live listings inline in Discord
- Platform release notes pushed to Discord automatically
- Tech: Discord.js bot, Supabase database webhooks or pg_notify triggering bot events, Discord REST API for message posting
