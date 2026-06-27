# Poké-Trade Go-Live Testing Checklist
*Created: June 27, 2026*

Use ✅ / ❌ / ⚠️ to mark each item as you test.
Test on desktop AND mobile. Use admin@poke-trade.com for admin tests, free@poke-trade.com for consumer tests.

---

## PART 1: PUBLIC PAGES (No Login Required)

### Homepage (poke-trade.com)
- [ ] Page loads without errors
- [ ] Hero section displays with card images
- [ ] All 9 sections render and animate on scroll
- [ ] "Get Started" / signup CTAs work
- [ ] Featured cards show real images (not broken)
- [ ] Pricing section shows 3 tiers correctly
- [ ] Footer links all work (no 404s)
- [ ] Mobile responsive — no horizontal scroll

### Navigation & Footer Links
- [ ] /about — loads
- [ ] /help — loads
- [ ] /contact — form submits
- [ ] /feedback — form submits
- [ ] /support — loads
- [ ] /pricing — displays 3 tiers
- [ ] /membership — displays plans
- [ ] /privacy — loads
- [ ] /terms — loads
- [ ] /cookies — loads
- [ ] /acceptable-use — loads
- [ ] /dmca — loads
- [ ] /shipping-guide — loads
- [ ] /grading-guide — loads
- [ ] /safety — loads
- [ ] /report — form works
- [ ] /verify — loads

### Marketplace (Public)
- [ ] /marketplace — loads card grid
- [ ] Search by card name works
- [ ] Filter by rarity works
- [ ] Filter by set works
- [ ] Sort by price works
- [ ] Pagination loads more cards
- [ ] Card images display correctly
- [ ] Click card → /card/[id] detail page loads

### Card Detail Page
- [ ] Card image displays
- [ ] Market price shows
- [ ] Card info (set, rarity, type) correct
- [ ] "Add to Collection" button (redirects to login if not signed in)
- [ ] Seller listings section (if any exist)

### Shop (Public)
- [ ] /shop — loads product grid
- [ ] /shop/drops — loads drop products
- [ ] Click product → /shop/[slug] detail page loads
- [ ] Product images display
- [ ] Price shows correctly
- [ ] "Add to Cart" button works
- [ ] /shop/cart — cart page loads

### Trade Center & Other Public
- [ ] /trade-center — loads
- [ ] /collection — loads (public collection browser)
- [ ] /compare — loads
- [ ] /price-guide — loads
- [ ] /drops — loads drop alerts
- [ ] /news — loads
- [ ] /community — loads
- [ ] /wins — loads
- [ ] /protect — loads
- [ ] /protect-my-collection — loads

---

## PART 2: AUTHENTICATION

### Registration
- [ ] /register — page loads
- [ ] Email + password signup works
- [ ] Google OAuth signup works
- [ ] Verification email sent
- [ ] After signup → redirects to /dashboard
- [ ] Profile auto-created in profiles table
- [ ] Username field works

### Login
- [ ] /login — page loads
- [ ] Email + password login works
- [ ] Google OAuth login works
- [ ] "Forgot Password" link → /forgot-password works
- [ ] Password reset email sends
- [ ] After login → redirects to /dashboard
- [ ] Wrong password shows error (not crash)

### Logout
- [ ] Logout button works
- [ ] Redirects to homepage
- [ ] Can't access /dashboard after logout
- [ ] Can't access /admin after logout

---

## PART 3: USER DASHBOARD (Logged In as Regular User)

### Dashboard Home (/dashboard)
- [ ] Page loads with stats cards
- [ ] Collection count shows
- [ ] Trade stats show
- [ ] Recent activity shows
- [ ] Navigation sidebar works

### Collection (/dashboard/collection)
- [ ] Collection grid loads
- [ ] Add card to collection works
- [ ] Remove card from collection works
- [ ] Search within collection works
- [ ] Collection value total shows
- [ ] Binder view (/dashboard/collection/binder) loads

### Want List (/dashboard/want-list)
- [ ] Want list loads
- [ ] Add card to want list works
- [ ] Remove card works
- [ ] Search works

### Trading (/dashboard/trades)
- [ ] Trade list loads
- [ ] Create new trade (/dashboard/trades/new) — form loads
- [ ] Search for trade partner works
- [ ] Add cards to trade offer works
- [ ] Submit trade offer works
- [ ] Received offers show
- [ ] Accept/decline trade works
- [ ] Counter-offer works
- [ ] Trade status updates correctly
- [ ] Shipping page (/dashboard/trades/[id]/shipping) loads

### Trade Floor (/dashboard/trade-floor)
- [ ] Trade floor loads
- [ ] Browse active trades works

### Marketplace Dashboard (/dashboard/marketplace)
- [ ] Create listing — form works
- [ ] Set price works
- [ ] Upload card photos works
- [ ] Listing appears in marketplace
- [ ] Edit listing works
- [ ] Cancel/remove listing works

### Sales & Purchases
- [ ] /dashboard/sales — shows seller orders
- [ ] /dashboard/purchases — shows buyer orders
- [ ] /dashboard/orders — shows all orders
- [ ] /dashboard/offers — shows offers received

### Reviews (/dashboard/reviews)
- [ ] Review list loads
- [ ] Submit review works (after trade completes)
- [ ] Star rating works
- [ ] Review text saves

### Disputes (/dashboard/disputes)
- [ ] Dispute list loads (user's own)
- [ ] Create dispute form works
- [ ] Attach evidence works
- [ ] Dispute status shows correctly

### Messages (/dashboard/messages)
- [ ] Message list loads
- [ ] Send message works
- [ ] Receive message shows
- [ ] Conversation thread works

### Notifications (/dashboard/notifications)
- [ ] Notification list loads
- [ ] Mark as read works
- [ ] Notification links go to correct page

### Showcase (/dashboard/showcase)
- [ ] Create showcase post works
- [ ] Upload card photos works
- [ ] Like a post works
- [ ] Comment on post works

### Portfolio (/dashboard/portfolio)
- [ ] Portfolio value chart loads
- [ ] Card values display

### Drops (/dashboard/drops)
- [ ] Drop alerts page loads
- [ ] Watchlist works
- [ ] Alert preferences work

### Membership (/dashboard/membership)
- [ ] Current plan shows
- [ ] Upgrade button works
- [ ] Stripe checkout opens
- [ ] After payment → plan upgrades

### Protection (/dashboard/protection)
- [ ] Trade protection info loads
- [ ] Purchase protection works

### Seller Setup (/dashboard/seller-setup)
- [ ] Stripe Connect onboarding starts
- [ ] Connect status shows

### Settings (/dashboard/settings)
- [ ] Profile edit works (username, display name, bio, location)
- [ ] Avatar upload works
- [ ] Verification page (/dashboard/settings/verification) loads
- [ ] Email verification status shows
- [ ] Phone verification works
- [ ] ID verification (Stripe Identity) starts

### Security (/dashboard/security)
- [ ] Security page loads
- [ ] Change password works
- [ ] Active sessions show

### Support (/dashboard/support)
- [ ] Submit support ticket works
- [ ] Ticket list shows
- [ ] Reply to ticket works
- [ ] Ticket status updates

### Seller Profile
- [ ] /seller/[username] — public seller page loads
- [ ] Listings show
- [ ] Reviews show
- [ ] Trust score displays

---

## PART 4: ADMIN DASHBOARD (Logged In as Admin)

### Admin Access
- [ ] /admin — loads (non-admin user gets redirected)
- [ ] Sidebar navigation works
- [ ] All 13 admin pages accessible
- [ ] "Back to Main Site" link works

### Dashboard (/admin)
- [ ] 12 stat cards load with real numbers
- [ ] System health panel shows status
- [ ] Recent activity feed loads
- [ ] Attention alerts show for pending reports/disputes

### User Management (/admin/users)
- [ ] User list loads with all users
- [ ] Search by username works
- [ ] Filter by tier (free/pro/elite) works
- [ ] Filter by verification status works
- [ ] Click user → detail view loads
- [ ] Toggle admin works
- [ ] Toggle verified works
- [ ] Suspend user works
- [ ] View user's trade/listing/order counts

### Trade Management (/admin/trades)
- [ ] Trade list loads
- [ ] Filter by status works
- [ ] Search works
- [ ] Click trade → detail view with items + dispute info
- [ ] Admin can update trade status
- [ ] Trade timeline shows events

### Listing Moderation (/admin/listings)
- [ ] Listing list loads
- [ ] Filter by status works
- [ ] Search works
- [ ] Admin can feature/remove listings
- [ ] Report counts show per listing

### Disputes (/admin/disputes)
- [ ] ALL disputes load (not just admin's own)
- [ ] Filter by status (open/investigating/resolved)
- [ ] View dispute details
- [ ] Admin can add messages to dispute
- [ ] Admin can resolve dispute with decision

### Fraud (/admin/fraud)
- [ ] Fraud flags page loads (in sidebar now)
- [ ] Fraud flags list with user + listing info
- [ ] Approve/flag/suspend/ban actions work
- [ ] Admin action logged

### Verification (/admin/verification)
- [ ] Verification requests load
- [ ] Approve/reject works

### Reports (/admin/reports)
- [ ] Report list loads
- [ ] Filter by status works
- [ ] Resolve report works

### Shop Management (/admin/shop)
- [ ] Product list loads
- [ ] Add new product works
- [ ] Edit product works
- [ ] Delete/archive product works
- [ ] Order list loads
- [ ] Order status management works

### Drop Products (/admin/drops)
- [ ] Drop product list loads
- [ ] Add product works
- [ ] Edit product works
- [ ] Delete product works

### Support (/admin/support)
- [ ] Ticket list loads
- [ ] View ticket details
- [ ] Reply to ticket works
- [ ] Update ticket status works
- [ ] Feedback tab loads

### Insurance Leads (/admin/insurance)
- [ ] Lead list loads
- [ ] Update lead status works
- [ ] Add admin notes works

### Content (/admin/content)
- [ ] Content management page loads
- [ ] Announcement system works

---

## PART 5: PAYMENT FLOWS (⚠️ LIVE STRIPE — BE CAREFUL)

### Membership Purchase
- [ ] Free → Pro upgrade: Stripe checkout loads
- [ ] Payment completes (use a $1 test if possible)
- [ ] Profile updates to Pro tier
- [ ] Cancel membership works
- [ ] ⚠️ Stripe webhook fires and updates DB

### Shop Checkout
- [ ] Add items to cart
- [ ] Cart total calculates correctly
- [ ] Checkout → Stripe payment page
- [ ] Order created in DB after payment
- [ ] ⚠️ Stripe webhook fires correctly

### Stripe Connect (Sellers)
- [ ] Seller onboarding flow starts
- [ ] Connect account created
- [ ] Payout status shows in dashboard

### Drop Alerts Subscription
- [ ] Subscribe to drop alerts
- [ ] Payment processes
- [ ] Alerts activate

---

## PART 6: CROSS-FUNCTIONAL TESTS

### Mobile Responsiveness
- [ ] Homepage on mobile — no horizontal scroll, readable
- [ ] Dashboard on mobile — sidebar collapses, usable
- [ ] Admin panel on mobile — sidebar hamburger works
- [ ] Marketplace on mobile — card grid stacks
- [ ] Trade creation on mobile — form usable

### Performance
- [ ] Homepage loads in < 3 seconds
- [ ] Marketplace with 19K cards paginates smoothly
- [ ] Dashboard loads in < 2 seconds
- [ ] No console errors on any page
- [ ] Images lazy-load properly

### SEO & Meta
- [ ] /robots.txt serves correctly
- [ ] /sitemap.xml generates
- [ ] Homepage has proper title + description meta
- [ ] Card pages have dynamic meta tags
- [ ] OG image works when sharing links

### Error Handling
- [ ] 404 page shows for bad URLs
- [ ] API errors show user-friendly messages (not raw errors)
- [ ] Network disconnection handled gracefully
- [ ] Expired sessions redirect to login

---

## PART 7: PRE-LAUNCH BLOCKERS

### Must Fix Before Go-Live
- [ ] DNS: poke-trade.com → Vercel (A record: 76.76.21.21)
- [ ] Supabase Site URL: change from localhost:3000 to https://poke-trade.com
- [ ] Supabase Auth redirect URLs: add https://poke-trade.com/*
- [ ] Stripe webhook endpoint: update to https://poke-trade.com/api/webhooks/stripe
- [ ] Stripe Connect webhook: update to https://poke-trade.com/api/webhooks/stripe-connect
- [ ] Google OAuth: add https://poke-trade.com to authorized redirect URIs
- [ ] Verify .env.local is in .gitignore (never commit secrets)
- [ ] Test signup/login flow on actual poke-trade.com domain
- [ ] Admin account verified and working on production

### Nice to Have Before Launch
- [ ] Seed some shop products (at least 5-10)
- [ ] Create 2-3 sample listings
- [ ] Write a launch announcement
- [ ] Set up Google Analytics (GA4)
- [ ] Trademark filing submitted ($250 USPTO)

---

## SCORING

Count your results:
- Total items: ~180
- ✅ Pass: ___
- ❌ Fail: ___
- ⚠️ Partial: ___

**Go-Live Ready = 0 ❌ on Parts 1-4 and Part 7 blockers**

---

*Notes: Write any bugs/issues found here:*

1. 
2. 
3. 
4. 
5. 
