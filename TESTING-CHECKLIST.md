# Poké-Trade Testing Checklist
**Date:** June 24, 2026
**URL:** https://www.poke-trade.com

---

## 🔑 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@poke-trade.com | PokeTrade2026! |
| Admin | assistantmg06@gmail.com | PokeTrade2026! |
| Free User | free@poke-trade.com | PokeTrade2026! |
| Pro User | pro@poke-trade.com | PokeTrade2026! |
| Elite User | elite@poke-trade.com | PokeTrade2026! |

---

## 1. PUBLIC PAGES (No Login Required)

### Homepage (/)
- [ ] Page loads without errors
- [ ] Logo displays correctly
- [ ] Hero section — 4 Pokémon card images visible (Charizard, Pikachu, Mew, Umbreon)
- [ ] "Start Trading" button → goes to /register
- [ ] "Create Free Account" button → goes to /register
- [ ] Trending Cards section — 8 cards display with images
- [ ] Card prices show (or "—" if no market data)
- [ ] Trade Match section renders (3 steps)
- [ ] Collection section renders (portfolio preview)
- [ ] Benefits section renders (6 benefit cards)
- [ ] Reputation section renders (trust levels)
- [ ] Pricing section renders (Free/Pro/Elite tiers)
- [ ] Testimonials section renders
- [ ] CTA section renders
- [ ] Footer renders with legal text
- [ ] Mobile responsive — check on phone

### Card Detail (/card/[id])
- [ ] Click a card from Trending → card detail page loads
- [ ] Card image displays (large)
- [ ] Card name, set, rarity show
- [ ] Price data displays
- [ ] "Buy Now" / "Make Offer" buttons present

### Marketplace (/marketplace)
- [ ] Page loads
- [ ] Search bar works
- [ ] Filter options display
- [ ] Cards/listings render

### Price Guide (/price-guide)
- [ ] Page loads with price data from API

### Other Marketing Pages
- [ ] /about — loads
- [ ] /pricing — loads with 3 tiers
- [ ] /trade-center — loads
- [ ] /collection — loads
- [ ] /drops — loads
- [ ] /compare — loads
- [ ] /community — loads
- [ ] /grading-guide — loads
- [ ] /shipping-guide — loads
- [ ] /help — loads
- [ ] /news — loads
- [ ] /safety — loads
- [ ] /protect — loads
- [ ] /verify — loads

### Legal Pages
- [ ] /terms — loads
- [ ] /privacy — loads
- [ ] /acceptable-use — loads
- [ ] /cookies — loads
- [ ] /dmca — loads

---

## 2. AUTH SYSTEM

### Registration (/register)
- [ ] Page loads with form
- [ ] Username field validates (min 3 chars, alphanumeric + underscore)
- [ ] Email field validates format
- [ ] Password strength meter works
- [ ] Weak password rejected (< 8 chars)
- [ ] Age confirmation checkbox required
- [ ] Honeypot field hidden from view
- [ ] Submit with valid data → "Check your email" success message
- [ ] Google signup button present (may need Google OAuth configured)
- [ ] Duplicate username → error "Username is already taken"
- [ ] Duplicate email → appropriate error

### Login (/login)
- [ ] Page loads with form
- [ ] Login with admin@poke-trade.com / PokeTrade2026! → redirects to /dashboard
- [ ] Wrong password → error message
- [ ] Google login button present
- [ ] "Forgot password" link → /forgot-password

### Forgot Password (/forgot-password)
- [ ] Page loads
- [ ] Enter email → sends reset link

### Session Management
- [ ] After login, refreshing page keeps you logged in
- [ ] Protected pages (/dashboard/*) redirect to /login when not authenticated
- [ ] Login pages redirect to /dashboard when already authenticated

---

## 3. DASHBOARD (Login Required)

### Main Dashboard (/dashboard)
- [ ] Loads without errors after login
- [ ] Shows user stats (trades, collection value, etc.)
- [ ] Sidebar navigation works on desktop
- [ ] Mobile hamburger menu works
- [ ] All sidebar links navigate correctly

### Collection (/dashboard/collection)
- [ ] Page loads
- [ ] "Add Card" button works
- [ ] Card search works (pulls from Pokemon TCG API)
- [ ] Can add card to collection
- [ ] Can set condition/quantity
- [ ] Collection value calculates
- [ ] Can remove cards

### Binder (/dashboard/collection/binder)
- [ ] Page loads
- [ ] Visual binder view renders
- [ ] Can organize cards in binder pages

### Want List (/dashboard/want-list)
- [ ] Page loads
- [ ] Can add cards to want list
- [ ] Can remove from want list
- [ ] Priority settings work

### Portfolio (/dashboard/portfolio)
- [ ] Page loads
- [ ] Portfolio value chart renders
- [ ] Value tracking over time

---

## 4. TRADING SYSTEM

### Create Trade (/dashboard/trades/new)
- [ ] Page loads
- [ ] Can search for trading partner
- [ ] Can select cards to offer
- [ ] Can select cards to request
- [ ] Submit trade offer works
- [ ] Trade appears in "My Trades"

### My Trades (/dashboard/trades)
- [ ] Page loads
- [ ] Lists sent/received trade offers
- [ ] Can accept trade
- [ ] Can decline trade
- [ ] Can counter-offer
- [ ] Trade status updates correctly

### Trade Floor (/dashboard/trade-floor)
- [ ] Page loads
- [ ] Shows open trade listings
- [ ] Can browse other users' trade offers

### Trade Offers (/dashboard/offers)
- [ ] Page loads
- [ ] Shows pending offers

---

## 5. MARKETPLACE / BUY-SELL

### My Listings (/dashboard/marketplace)
- [ ] Page loads
- [ ] Can create new listing
- [ ] Set price, condition, photos
- [ ] Listing appears after creation

### Purchases (/dashboard/purchases)
- [ ] Page loads
- [ ] Shows purchase history

### Sales (/dashboard/sales)
- [ ] Page loads
- [ ] Shows sales history

### Checkout Flow
- [ ] Buy Now → checkout page loads
- [ ] Stripe payment form renders
- [ ] (Test mode) Can complete purchase with test card 4242424242424242

---

## 6. MESSAGING

### Messages (/dashboard/messages)
- [ ] Page loads
- [ ] Can start new conversation
- [ ] Send message works
- [ ] Receive message works
- [ ] Unread indicator shows

---

## 7. COMMUNITY FEATURES

### Showcase (/dashboard/showcase)
- [ ] Page loads
- [ ] Can create showcase post
- [ ] Can view others' showcases

### Reviews (/dashboard/reviews)
- [ ] Page loads
- [ ] Shows received reviews
- [ ] Can view review details

### Seller Profile (/seller/[username])
- [ ] Page loads for valid username
- [ ] Shows user's listings, reviews, trust score

---

## 8. MEMBERSHIP & PAYMENTS

### Membership (/dashboard/membership)
- [ ] Page loads
- [ ] Shows current plan (Free)
- [ ] Upgrade buttons for Pro ($9.99/mo) and Elite ($19.99/mo)
- [ ] Stripe checkout opens on upgrade click

### Protection (/dashboard/protection)
- [ ] Page loads
- [ ] Trade protection options display

### Seller Setup (/dashboard/seller-setup)
- [ ] Page loads
- [ ] Stripe Connect onboarding flow starts

---

## 9. DROPS (PRO FEATURE)

### Drop Alerts (/dashboard/drops)
- [ ] Page loads
- [ ] Shows upcoming product drops
- [ ] Subscribe to alerts (Pro+ only)
- [ ] Free users see upgrade prompt

---

## 10. DISPUTES

### Disputes (/dashboard/disputes)
- [ ] Page loads
- [ ] Can open a dispute on a trade/order
- [ ] Dispute form works
- [ ] Dispute status tracking

---

## 11. ACCOUNT SETTINGS

### Settings (/dashboard/settings)
- [ ] Page loads
- [ ] Can update display name
- [ ] Can update avatar
- [ ] Can change email
- [ ] Can change password

### Verification (/dashboard/settings/verification)
- [ ] Page loads
- [ ] ID verification flow (Stripe Identity)

### Security (/dashboard/security)
- [ ] Page loads
- [ ] Shows active sessions
- [ ] Can revoke sessions

### Notifications (/dashboard/notifications)
- [ ] Page loads
- [ ] Shows notification list
- [ ] Can mark as read

---

## 12. ADMIN PANEL (Admin Login Only)

### Admin Dashboard (/admin)
- [ ] Page loads (admin@poke-trade.com only)
- [ ] Platform stats display

### User Management (/admin/users)
- [ ] Lists all users
- [ ] Can view user details
- [ ] Can ban/unban users
- [ ] Can change user roles

### Trade Management (/admin/trades)
- [ ] Lists all trades
- [ ] Can view trade details
- [ ] Can intervene in disputes

### Listing Management (/admin/listings)
- [ ] Lists all listings
- [ ] Can remove listings

### Fraud Detection (/admin/fraud)
- [ ] Page loads
- [ ] Suspicious activity flags display

### Reports (/admin/reports)
- [ ] Lists user reports
- [ ] Can review and action reports

### Disputes (/admin/disputes)
- [ ] Lists all disputes
- [ ] Can resolve disputes

### Verification (/admin/verification)
- [ ] Lists verification requests
- [ ] Can approve/deny

### Drop Management (/admin/drops)
- [ ] Can add/edit product drops

### Content (/admin/content)
- [ ] Can manage announcements

### Insurance Referrals (/admin/insurance)
- [ ] Page loads

### Admin Security (/dashboard/admin/security)
- [ ] Audit log displays
- [ ] Security settings

### Admin System (/dashboard/admin/system)
- [ ] System status display

---

## 13. API HEALTH

### Core APIs
- [ ] GET /api/health → 200 OK
- [ ] GET /api/cards/search?q=charizard → returns cards
- [ ] GET /api/marketplace → returns listings
- [ ] GET /api/prices → returns price data

---

## 14. MOBILE RESPONSIVENESS

- [ ] Homepage — all sections stack properly on mobile
- [ ] Login/Register forms — full width, no horizontal scroll
- [ ] Dashboard — sidebar collapses to hamburger
- [ ] Card grid — 2 columns on mobile, 4 on desktop
- [ ] Trade creation — usable on mobile
- [ ] Checkout — Stripe form works on mobile

---

## 15. CROSS-BROWSER

- [ ] Chrome — full test pass
- [ ] Safari — basic navigation + auth
- [ ] Firefox — basic navigation + auth
- [ ] Mobile Safari (iPhone) — homepage + auth + dashboard
- [ ] Mobile Chrome (Android) — homepage + auth + dashboard

---

## ⚠️ KNOWN ISSUES / NOT YET FUNCTIONAL

1. **Google OAuth** — Needs Google Client ID/Secret configured in Supabase Auth settings
2. **Stripe Payments** — Test mode only, needs webhook endpoint verified
3. **Stripe Connect** — Needs to be enabled on Stripe dashboard for seller payouts
4. **Stripe Identity** — Needs to be enabled for ID verification
5. **Email Confirmations** — Supabase has `mailer_autoconfirm: false`, test accounts were manually confirmed
6. **Card Data** — Relies on Pokemon TCG API (free tier, may rate limit)
7. **Real-time Messaging** — Needs Supabase Realtime configured
8. **Push Notifications** — Not yet implemented

---

*Last updated: June 24, 2026*
