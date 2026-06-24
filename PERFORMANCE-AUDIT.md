# Poké-Trade Performance Audit

**Date:** 2026-06-24
**Auditor:** Automated Performance Engineer
**Scope:** Full application — Next.js 15 + Supabase + Stripe

---

## Critical Issues

### 1. Middleware Memory Leak — `edgeRateStore` Map grows unbounded
- **File:** `src/middleware.ts:8`
- **Severity:** CRITICAL
- **Issue:** `edgeRateStore` is a module-level `Map` that grows with every unique IP+path combination. The pruning `setInterval` at line 28 only runs every 60s and may not keep up under load. In serverless/edge environments, the `setInterval` may leak across invocations.
- **Impact:** Memory growth proportional to unique visitors × routes.
- **Fix:** Add early return for static assets in middleware matcher, reduce rate store scope.

### 2. Middleware runs on every non-static request (including pages)
- **File:** `src/middleware.ts:50-130`
- **Severity:** CRITICAL
- **Issue:** The matcher excludes static files but still runs full rate-limit, CSRF, and UA checks on every page navigation. The `updateSession` Supabase call runs on EVERY request including public marketing pages.
- **Impact:** 50-200ms added to every navigation (Supabase auth roundtrip).
- **Fix:** Skip rate limiting, UA checks, and CSRF for non-API routes early.

### 3. No `loading.tsx` skeletons for any route group
- **File:** `src/app/(dashboard)/`, `src/app/(marketing)/`, `src/app/(admin)/`, `src/app/(auth)/`
- **Severity:** HIGH
- **Issue:** Zero loading.tsx files exist. Users see blank screens during navigation.
- **Impact:** Poor perceived performance, high CLS.
- **Fix:** Add loading.tsx with skeleton UIs for all route groups.

### 4. Dashboard page is fully client-side with waterfall fetches
- **File:** `src/app/(dashboard)/dashboard/page.tsx:1`
- **Severity:** HIGH
- **Issue:** Entire dashboard is `"use client"` and fetches stats via `useEffect` → client-side fetch waterfall.
- **Impact:** User sees loading skeleton until client JS loads + API roundtrip completes.

### 5. All 9 home page sections use `"use client"` + Framer Motion
- **Files:** All `src/components/home/*.tsx`
- **Severity:** HIGH
- **Issue:** Every section is a client component importing framer-motion for simple scroll animations. This forces the entire homepage into the client bundle.
- **Impact:** ~45KB+ framer-motion in homepage bundle; no server rendering.

### 6. Homepage `getFeaturedCards()` makes uncached external API call on every render
- **File:** `src/lib/pokemon-tcg.ts:97-107`, `src/app/(marketing)/page.tsx:13`
- **Severity:** HIGH
- **Issue:** `getFeaturedCards` calls the Pokemon TCG API on every homepage load. The `next: { revalidate: 3600 }` is good but the homepage itself has no revalidation config.
- **Impact:** Cold starts hit external API; no ISR configured.
- **Fix:** Add `revalidate` export to homepage.

### 7. API routes return no Cache-Control headers
- **Files:** All `src/app/api/*/route.ts`
- **Severity:** HIGH
- **Issue:** No API route sets Cache-Control or stale-while-revalidate headers. Every request hits Supabase.
- **Impact:** Unnecessary database load, slower responses.

### 8. Marketplace API creates Supabase client at module level
- **File:** `src/app/api/marketplace/route.ts:4-7`
- **Severity:** HIGH
- **Issue:** `createClient` is called at module level (outside the handler). This creates a single shared client that persists across requests — potential auth context leakage in serverless.
- **Impact:** Security risk + stale connections.

### 9. Admin stats makes 21 parallel Supabase queries
- **File:** `src/app/api/admin/stats/route.ts:18-56`
- **Severity:** MEDIUM
- **Issue:** 21 separate queries to Supabase in parallel. While Promise.all helps, this is excessive.
- **Impact:** High Supabase connection usage, slow admin page load.

### 10. Dashboard layout is a heavyweight client component
- **File:** `src/app/(dashboard)/layout.tsx:1`
- **Severity:** MEDIUM
- **Issue:** Entire layout including sidebar with 25+ navigation links is `"use client"`. Imports ~20 lucide icons.
- **Impact:** Large client bundle for every dashboard page.

### 11. `useUser` hook creates new Supabase client on every component mount
- **File:** `src/lib/hooks/useUser.ts:10`
- **Severity:** MEDIUM
- **Issue:** Every component using `useUser` creates a new browser client and makes auth + profile queries.
- **Impact:** Duplicate requests, wasted bandwidth.

### 12. Messages page polls every 10 seconds without cleanup guard
- **File:** `src/app/(dashboard)/dashboard/messages/page.tsx:111`
- **Severity:** MEDIUM
- **Issue:** `setInterval` for polling — cleanup exists but no visibility check (polls even when tab is hidden).
- **Impact:** Unnecessary API calls when user is away.

### 13. Portfolio API fetches all collection items without pagination
- **File:** `src/app/api/portfolio/route.ts:25-33`
- **Severity:** MEDIUM
- **Issue:** Fetches ALL collection items to compute portfolio stats in JavaScript. No database aggregation.
- **Impact:** Slow for large collections; high memory usage.

### 14. Dashboard stats API makes 4 sequential Supabase queries
- **File:** `src/app/api/dashboard/stats/route.ts:12-51`
- **Severity:** MEDIUM
- **Issue:** Collections → items → trades → offers are fetched sequentially, not in parallel.
- **Impact:** Cumulative latency.

### 15. FeaturedListings has 100+ lines of hardcoded fallback data
- **File:** `src/components/home/FeaturedListings.tsx:18-95`
- **Severity:** LOW
- **Issue:** 8 full card objects hardcoded as fallback. Increases bundle size.
- **Impact:** ~3KB of unnecessary client JS.

### 16. Hero images all marked `priority` — 4 card images + logo
- **File:** `src/components/home/HeroSection.tsx:86,142`
- **Severity:** LOW
- **Issue:** 5 images marked priority (logo + 4 cards). Only above-fold images should be priority.
- **Impact:** Competing priority hints; slower LCP.

---

## Applied Optimizations

1. ✅ Middleware: skip static assets and unnecessary checks for non-API routes
2. ✅ Added loading.tsx skeletons for all route groups
3. ✅ Homepage: added ISR revalidation (1 hour)
4. ✅ API routes: added Cache-Control headers where appropriate
5. ✅ Fixed marketplace API module-level Supabase client
6. ✅ Dashboard stats API: parallelized queries
7. ✅ Added route segment configs to key pages
8. ✅ Optimized middleware matcher
9. ✅ Fixed hero image priority attributes
10. ✅ Marketing pages that don't need interactivity: converted static sections to server components
11. ✅ Added React.memo to pure list components
12. ✅ Messages page: added visibility-based polling
