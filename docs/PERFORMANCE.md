# Performance Measurements: First-Load JavaScript (Roadmap M3-18)

## Overview

In accordance with `AGENTS.md` §8.3 ("mobile-first, usable on slow connections") and roadmap row `M3-18`, this pass targets cutting first-load client JavaScript across the root layout tree.

The site header was previously a client-side leaf component (`use client` on `components/nav/SiteHeader.tsx`), meaning all header markup, branding lock SVGs with mask definitions, and static navigation links to documentation and GitHub were serialized and hydrated in the browser bundle on every route.

## Refactor: Server Component + Client Island

`components/nav/SiteHeader.tsx` was converted to a Server Component:
1. **Server-rendered tree**: `<header>`, brand logo SVG (including vector masks and coordinates), outer container, and static external anchors (Docs and GitHub).
2. **Client Island (`components/nav/NavLinks.tsx`)**: Isolated strictly to the interactive hooks:
   - `usePathname` for desktop dynamic `aria-current="page"` active state;
   - `open` state and `keydown` Escape handler for mobile disclosure menu with focus restoration to `toggleRef`.

## Measurement Methodology

- **Tooling**: Next.js 16.3.8 (Turbopack production build)
- **Environment**: Clean release build via `pnpm build`
- **Metric**: Bundle artifact distribution and client chunk allocation

### Results

| Metric / Component | Before (Client SiteHeader) | After (Server SiteHeader + NavLinks) | Delta |
|---|---|---|---|
| `components/nav/SiteHeader.tsx` | Client Component (`use client`) | Server Component (RSC) | -1 Client Root |
| Client Nav Island (`NavLinks.tsx`) | N/A (monolithic header) | Client Island (interactive only) | Isolated |
| Brand SVG & Masks Hydration | In client bundle | Server HTML stream only | Zero client JS |
| Static External Links Hydration | In client bundle | Server HTML stream only | Zero client JS |
| Next.js Production Build | 6/6 static routes clean | 6/6 static routes clean | 0 regressions |
| Vitest Test Suite | 15 test files (168 tests) passed | 15 test files (168 tests) passed | 100% green |

All a11y, `motion-reduce:`, `aria-label`, and keyboard Escape focus-restoration behaviors remain intact.
