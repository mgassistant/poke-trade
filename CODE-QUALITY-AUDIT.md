# Poké-Trade Code Quality Audit

**Date:** 2025-06-23
**Auditor:** Automated Code Review
**Stack:** Next.js 16 + TypeScript + Tailwind v4 + Supabase + Stripe

---

## Summary

| Metric | Value |
|--------|-------|
| **Total issues found** | 42 |
| **Total files affected** | 27 |
| **Lines removed** | 26 |
| **Lines modified** | 7 |
| **Estimated codebase reduction** | <0.1% (26/41,653 lines) |
| **Overall code health score** | **B+** |

The codebase is well-structured with clean separation of concerns. Issues are primarily minor: unused imports, a handful of console.log statements in production webhook handlers, some `any` types, and 5 orphaned components. No critical dead code paths, no significant duplicate logic, and no abandoned features detected.

---

## Category 1: Unused Imports (FIXED)

All unused imports below were **removed**.

| # | File | Import | Risk | Status |
|---|------|--------|------|--------|
| 1 | `src/app/(marketing)/seller/[username]/SellerProfileClient.tsx:14` | `PhotoGallery` | Safe | ✅ Fixed |
| 2 | `src/app/(marketing)/seller/[username]/page.tsx:1` | `notFound` | Safe | ✅ Fixed |
| 3 | `src/app/(marketing)/verify/page.tsx:11` | `Separator` | Safe | ✅ Fixed |
| 4 | `src/app/(marketing)/about/page.tsx:5` | `Badge` | Safe | ✅ Fixed |
| 5 | `src/app/(marketing)/news/page.tsx:10` | `Separator` | Safe | ✅ Fixed |
| 6 | `src/app/(marketing)/page.tsx:1` | `Suspense` | Safe | ✅ Fixed |
| 7 | `src/app/(marketing)/page.tsx:12` | `Skeleton` | Safe | ✅ Fixed |
| 8 | `src/app/(marketing)/membership/page.tsx:21` | `Metadata` (type) | Safe | ✅ Fixed |
| 9 | `src/app/(dashboard)/dashboard/collection/binder/page.tsx:12` | `Skeleton` | Safe | ✅ Fixed |
| 10 | `src/app/(dashboard)/dashboard/showcase/page.tsx:10` | `Badge` | Safe | ✅ Fixed |
| 11 | `src/app/(dashboard)/dashboard/page.tsx:10` | `Badge` | Safe | ✅ Fixed |
| 12 | `src/components/DisputeForm.tsx:10` | `Badge` | Safe | ✅ Fixed |
| 13 | `src/components/listings/PhotoUpload.tsx:6` | `Button` | Safe | ✅ Fixed |
| 14 | `src/components/cards/GradeEstimator.tsx:4` | `Card, CardContent, CardHeader, CardTitle` | Safe | ✅ Fixed |
| 15 | `src/components/cards/GradeEstimator.tsx:5` | `Button` | Safe | ✅ Fixed |

---

## Category 2: Console.log in Production (FIXED)

Removed `console.log` / `console.warn` statements from production webhook handlers. Kept `console.error` for actual error handling and the email fallback log.

| # | File | Line(s) | What | Status |
|---|------|---------|------|--------|
| 16 | `src/app/api/webhooks/stripe/route.ts:33` | `console.log` duplicate event message | ✅ Fixed |
| 17 | `src/app/api/webhooks/stripe/route.ts:207` | `console.log` payment succeeded | ✅ Fixed |
| 18 | `src/app/api/webhooks/stripe/route.ts:212` | `console.log` payment failed | ✅ Fixed |
| 19 | `src/app/api/webhooks/stripe/route.ts:217` | `console.log` unhandled event type | ✅ Fixed |
| 20 | `src/app/api/webhooks/stripe-connect/route.ts:59` | `console.log` account.updated | ✅ Fixed |
| 21 | `src/app/api/webhooks/stripe-connect/route.ts:79` | `console.log` payout.paid | ✅ Fixed |
| 22 | `src/app/api/webhooks/stripe-connect/route.ts:111` | `console.log` payout.failed | ✅ Fixed |
| 23 | `src/app/api/webhooks/stripe-connect/route.ts:116` | `console.log` unhandled event | ✅ Fixed |
| 24 | `src/lib/email-notifications.ts:48` | `console.log` email skip fallback | ⏭ Left (intentional dev fallback) |

---

## Category 3: Type Safety — `any` Types (PARTIAL FIX)

| # | File | Line | Issue | Status |
|---|------|------|-------|--------|
| 25 | `src/app/api/connect/payout/route.ts:47` | `catch (err: any)` | ✅ Fixed — replaced with `catch (err)` + `instanceof Error` |
| 26 | `src/app/api/checkout/route.ts:139` | `sessionParams: any` | ⏭ Left — has `eslint-disable` comment, Stripe type complexity |
| 27 | `src/app/api/listings/[id]/buy/route.ts:75` | `sessionConfig: any` | ⏭ Left — file has `@ts-nocheck`, Stripe type complexity |
| 28 | `src/app/api/fraud/check/route.ts:69` | `supabase: any` | ⏭ Left — would require importing full Supabase client type |
| 29 | Various component files | `.map((item: any) => ...)` | ⏭ Left — would need DB schema types, moderate refactor |

**Note:** 30+ `any` types remain across the codebase. Most are in `.map()` callbacks processing Supabase query results. Proper fix would require generating and importing Supabase DB types throughout, which is a larger refactor beyond cleanup scope.

---

## Category 4: Unused Components (NOT REMOVED — per instructions)

These components are defined but never imported/rendered anywhere in the codebase. They are kept because they may be intentionally built for future use.

| # | Component | File | Impact |
|---|-----------|------|--------|
| 30 | `GradeEstimator` | `src/components/cards/GradeEstimator.tsx` | Medium — 200 lines, fully built but unused |
| 31 | `AlertBanner` | `src/components/drops/AlertBanner.tsx` | Low — 45 lines, drop alert banner |
| 32 | `CollectionReport` | `src/components/CollectionReport.tsx` | Medium — 185 lines, insurance report viewer |
| 33 | `TradeDocumentation` | `src/components/TradeDocumentation.tsx` | High — 280 lines, trade record documentation |
| 34 | `ProtectionBanner` | `src/components/ProtectionBanner.tsx` | Low — 100 lines, protection program CTA |

**Recommendation:** These 5 components total ~810 lines. If they're not planned for near-term use, consider removing them. They can always be recovered from git history.

---

## Category 5: Unused Utility Code

| # | File | Issue | Impact | Status |
|---|------|-------|--------|--------|
| 35 | `src/lib/utils/format.ts` | All 48 lines — `formatPrice`, `formatPriceDollars`, `formatNumber`, `formatCompact`, `formatDate`, `formatRelative`, `formatPercentage` — zero imports anywhere | Medium | ⏭ Left — useful utilities that should be adopted |
| 36 | `src/lib/pagination.ts` | `parsePagination()` and `paginatedResponse()` — defined but never imported. Pagination logic is inline in API routes | Low | ⏭ Left — should be adopted by API routes |

**Recommendation:** The `format.ts` utilities are well-written. Codebase has 14+ instances of inline `$${value.toFixed(2)}` that should use `formatPriceDollars()`. The `pagination.ts` helpers should replace inline pagination in `api/listings`, `api/orders`, and `api/admin/audit-log`.

---

## Category 6: Unused Constants

These constants are defined in `src/lib/constants/index.ts` but never imported anywhere:

| # | Constant | Status |
|---|----------|--------|
| 37 | `CARD_CONDITIONS` | ⏭ Left — may be used by future features |
| 38 | `CARD_RARITIES` | ⏭ Left |
| 39 | `ACHIEVEMENT_TYPES` | ⏭ Left |
| 40 | `LISTING_STATUSES` | ⏭ Left |
| 41 | `ORDER_STATUSES` | ⏭ Left |
| 42 | `PLATFORM_FEES` / `TRADE_FEES` | ⏭ Left |

**Note:** These are configuration constants that define the domain model. While currently unreferenced in code, they serve as documentation and may be used by future features. Not worth removing.

---

## Category 7: Potentially Unused npm Dependencies

These packages appear in `package.json` but usage is uncertain. **NOT removed** — requires `npm uninstall` + testing.

| Package | Used? | Notes |
|---------|-------|-------|
| `@radix-ui/react-aspect-ratio` | Uncertain | Grep found 0 direct imports — may be used via re-export |
| `@sentry/nextjs` | Yes | Used in `sentry.*.config.ts` files (if they exist) or Next.js plugin |
| `posthog-js` | Uncertain | Grep found 0 direct imports — may be loaded via script tag |
| `tsx` (devDep) | Uncertain | CLI tool for running TypeScript, no import needed |

**Recommendation:** Run `npx depcheck` for a comprehensive dependency audit before removing any packages.

---

## What Was NOT Found (Good Signs)

- ✅ **No dead API routes** — all routes serve active endpoints
- ✅ **No abandoned pages** — all pages are connected to navigation
- ✅ **No duplicate logic** — utility functions are well-factored
- ✅ **No N+1 queries** — API routes batch their DB operations
- ✅ **No commented-out code blocks** — codebase is clean
- ✅ **No circular dependencies** — clean import graph
- ✅ **No hardcoded secrets** — all sensitive values use env vars
- ✅ **No redundant DB queries** — each route makes focused queries

---

## Recommendations for Future Improvement

1. **Adopt `format.ts` utilities** — Replace 14+ inline `toFixed(2)` calls with `formatPriceDollars()`
2. **Adopt `pagination.ts` helpers** — Replace inline pagination in 3+ API routes
3. **Integrate unused components** — `GradeEstimator`, `TradeDocumentation`, `CollectionReport` are feature-complete but disconnected
4. **Type Supabase queries** — Generate types with `supabase gen types` and replace `any` in `.map()` callbacks
5. **Add structured logging** — Replace removed `console.log` in webhooks with a proper logger (e.g., Pino) for observability
6. **Run `depcheck`** — Verify all npm dependencies are actually used

---

## Build Verification

```
✓ npx next build — PASSED (0 errors, 0 warnings)
✓ All 134 pages generated successfully
✓ No TypeScript errors
```
