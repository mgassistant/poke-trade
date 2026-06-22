# AGENTS.md — Poke-Trade Build

## Project
- **Name**: Poke-Trade
- **Domain**: https://poke-trade.com
- **Repo**: /Users/mgassistant/poke-trade (github: mgassistant/poke-trade)
- **Stack**: Next.js 15 + TypeScript + Tailwind + ShadCN + Supabase + Stripe + Vercel

## Architecture Rules
1. App Router ONLY (no pages/)
2. All DB access through Supabase client helpers in `src/lib/supabase/`
3. Server components by default, 'use client' only when needed
4. RLS on EVERY user-facing table
5. Stripe Connect for marketplace payments
6. Dark mode first — charcoal bg, neon blue (#00D4FF) + purple (#8B5CF6) accents
7. Mobile responsive from day one
8. All forms use server actions or API routes (no direct DB mutations from client)

## File Structure
```
src/
  app/                    # Next.js App Router
    (auth)/               # Auth pages (login, register, etc.)
    (dashboard)/          # Authenticated user pages
    (marketing)/          # Public pages (home, pricing, etc.)
    admin/                # Admin dashboard
    api/                  # API routes
  components/
    ui/                   # ShadCN components
    layout/               # Header, Footer, Sidebar
    cards/                # Card-related components
    trade/                # Trade components
    marketplace/          # Marketplace components
    collection/           # Collection components
    profile/              # Profile components
  lib/
    supabase/             # Supabase clients + helpers
    stripe/               # Stripe helpers
    utils/                # Utilities
    types/                # TypeScript types
    hooks/                # Custom hooks
    constants/            # App constants
  styles/                 # Global styles
```

## Supabase Schema (Pending - needs project URL)
- Tables defined in supabase/migrations/
- RLS policies in same migration files
- Storage buckets: avatars, card-images, listing-images, trade-proof

## Legal
- NOT affiliated with Nintendo, Game Freak, Creatures, or The Pokémon Company
- Include disclaimers in footer and legal pages
