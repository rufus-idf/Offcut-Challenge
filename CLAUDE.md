# Offcut Challenge

## What this is
A B2B marketplace for UK woodworking workshops to buy and sell timber offcuts.
Public-facing name: "Offcut Challenge". Project/code name: offcut-challenge.

## Business model
- £29/month subscription for verified workshops to access the platform
- 5% transaction fee on each sale between workshops
- Verified business accounts only (Companies House check + manual approval)

## Tech stack
- Next.js 15 (App Router, TypeScript, Tailwind)
- Supabase (Postgres, Auth, Storage)
- Stripe (Subscriptions for £29/mo, Connect for marketplace transactions)
- Resend (transactional email)
- Hosting: Vercel (frontend) + Supabase (backend)

## Core entities
- Workshops: business accounts, verified, have a subscription, can list and buy
- Users: individuals belonging to a workshop (multi-user accounts allowed)
- Listings: rectangular panel offcuts (length, width, thickness in mm, material, finish, quantity, price)
- Offers: buyer proposes alternate price, 48hr expiry
- Transactions: completed purchases, deduct 5% platform fee
- Subscriptions: per-workshop, monthly via Stripe
- Messages: buyer-seller communication

## Materials supported (initial)
MDF, Plywood, Chipboard, Oak, Birch ply, Pine, Walnut, Beech

## Finishes supported (initial)
Raw / unfinished, White melamine, Oak veneer, Walnut veneer, Black melamine,
Birch faced, Pre-primed, Laminated

## Build status
Currently: Day 1. Fresh Next.js project, pushed to GitHub. No Supabase yet,
no auth, no database, no UI beyond the default Next.js landing page.

## What's next
Week 1: Supabase setup, auth working, deployed to Vercel
Week 2: Database schema, port prototype UI, listings persisted
Week 3: Photo uploads, search & filters
Week 4: Companies House verification + admin approval flow
Week 5: Stripe Subscriptions paywall
Week 6: Stripe Connect for marketplace transactions
Week 7: Messaging, email notifications, polish
Week 8: Soft launch with 5-10 real workshops

## Code style preferences
- TypeScript strict mode
- Server Components by default; Client Components only when needed
- Tailwind for all styling, no CSS modules
- Server Actions over API routes where possible
- Explain non-obvious decisions in comments