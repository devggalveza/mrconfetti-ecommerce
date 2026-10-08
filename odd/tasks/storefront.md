# Feature: Mr. Confetti storefront (design-system + full design implementation)

Status: in progress — Phase 0 complete
Owner: el Gentleman (parent session)
Branch: `feat/storefront` (from `main`)
Source design: `%APPDATA%/Open Design/.../bf52a322-.../` — `index.html`, `products.html`,
`product-detail.html`, `cart.html`, `checkout.html`, `favoritos.html`, `ayuda.html`

## Problem

The repository is a Better Fullstack scaffold: `apps/web` still renders the generator
starter (a two-link `Header` and a placeholder `/` route). The approved visual design for
the Mr. Confetti ecommerce exists only as seven standalone static HTML files that share a
hand-rolled `store.js` + `products-data.js` layer, with no connection to the application.

Objective: implement all seven pages inside `apps/web` as composable React + Tailwind +
shadcn/ui components on TanStack Start, behind a single documented design system, with
client-side state and no backend.

## Confirmed decisions

- **D1 — Scope.** All pages of the design: `/`, `/products`, `/products/$productId`,
  `/cart`, `/checkout`, `/favoritos`, `/ayuda`. Delivered as chained PRs.
- **D2 — Copy and brand.** Every text is adapted to the Mr. Confetti party brand. The
  design's generic marketplace copy (fresh vegetables, Galaxy S24, Ramadan) is replaced.
  All content that varies lives in data modules, never inline in components.
- **D3 — Client state.** Zustand with the `persist` middleware. One store per domain, all
  persisted under the same `localStorage` keys the design already used.
- **D4 — Design system.** `apps/web/src/index.css` is the executable source of truth
  (Tailwind v4 `@theme` + shadcn CSS variables), documented by
  `apps/web/DESIGN_SYSTEM.md`.
- **D5 — Frontend only.** Products are a typed static module. No API, no server routes,
  no database, no auth flow changes.

## Evidence (exploration)

Design system as coded in the source files:

- Brand purple `#6e3a8d` (`--blue`), dark variant `#4f2a66`, red `#d8262f`, green
  `#12805c`, amber `#f5a300`, yellow `#ffd23f`, ink `#14171f`, muted `#5b6270`, border
  `#e3e6ec`; radius 12px / 8px; font `Poppins`; 44px minimum touch targets;
  `prefers-reduced-motion` respected. A final override block removes every shadow and
  every container border ("todo blanco, sin sombras") — only 1px hairlines on inputs,
  chips and product image frames survive.
- Breakpoints: 1240 max content width; 1024 (4 rail columns, hero stacks), 768 (3
  columns, header wraps, search drops to its own row), 480 (2 columns).

Shared data model (`products.json`, `products-data.js`): 36 products = 12 base items × 3
variants, fields `id, name, category, brand, price, original, rating, reviews,
freeShipping, image, w, h`. Categories: Graduación, Globos, Personajes, Cumpleaños,
Revelación de género, Dulces y piñata, Decoración. Brands: Mr. Confetti, Fiesta Pro,
Dulces Selectos.

Shared business rules (`store.js`): max quantity `9`; free shipping from `Q.50`;
standard shipping `Q.4.95`; checkout adds exprés `Q.7.95` and punto de recogida `Q.2.95`;
all-`freeShipping` carts ship free regardless of subtotal; coupons `EMOX10` (percent, 10)
and `BIENVENIDO` (amount, 5, clamped to the subtotal). `localStorage` keys: `mc-cart`,
`mc-saved`, `mc-favoritos`, `mc-promo`, `mc-last-order`.

Per-page contract (route, sections, interactions, shadcn surface) was inventoried per
page and is summarised in the phase plan below.

Duplication found in the source that this implementation must remove:

- The free-shipping threshold and shipping price are re-declared in `store.js:63`,
  `cart.html:321` and `checkout.html:280`, and hard-coded as copy in `ayuda.html:99` and
  `favoritos.html:210`.
- Line totals and discount math are re-implemented independently in `cart.html:400-426`
  and `checkout.html:277-279`; the shared `MC.totals()` helper is dead code.
- `window.MC_onSearch` is referenced at `store.js:93` but never defined.
- `favoritos.html:199` writes `localStorage` directly instead of going through `MC`.
- `product-detail.html` hard-codes rating, review counts, specs and perk dates instead of
  deriving them from the product model.

Current app state:

- `apps/web/components.json`: style `radix-nova`, `cssVariables: true`, aliases
  `@/components`, `@/components/ui`, `@/lib`, `@/hooks` (the `hooks` directory does not
  exist yet).
- `apps/web/package.json` has `tailwindcss@4`, `shadcn`, `radix-ui`, `lucide-react`,
  `class-variance-authority`, `tailwind-merge`, `@tanstack/react-router`, `zod`, `vitest`
  and `@testing-library/react`. It has neither `zustand` nor `embla-carousel`.
- `apps/web/src/index.css` already holds the shadcn/tailwind token block (`:root`,
  `.dark`, `@theme inline`) with `--radius: 0.625rem`.
- `apps/web/src/routes/__root.tsx` renders the starter `../components/header`,
  `lang="en"`, title `My App`, and wraps the outlet in a `grid h-svh grid-rows-[auto_1fr]`
  shell that must be replaced.
- Scaffold routes `/dashboard`, `/login` and their auth components belong to the
  generator. They are out of scope and must keep working; the new header's "Iniciar
  sesión" points at the existing `/login`.

## Non-goals

- No backend, API, database, queue or payment integration.
- No real authentication flow; `/login` and `/dashboard` are left untouched.
- No dark theme implementation (the `.dark` token block stays as-is) and no i18n.
- No new animation library and no CDN font loading.
- No changes to `packages/*` or `apps/server`.

## Architecture

### Routes

| Route | File | Source design |
| --- | --- | --- |
| `/` | `routes/index.tsx` | `index.html` |
| `/products` | `routes/products.tsx` | `products.html` |
| `/products/$productId` | `routes/products.$productId.tsx` | `product-detail.html` |
| `/cart` | `routes/cart.tsx` | `cart.html` |
| `/checkout` | `routes/checkout.tsx` | `checkout.html` |
| `/favoritos` | `routes/favoritos.tsx` | `favoritos.html` |
| `/ayuda` | `routes/ayuda.tsx` | `ayuda.html` |

`/checkout` with an empty cart and no last order redirects to `/cart` (source
`checkout.html:277`). `/ayuda` uses in-page hash anchors
(`#ayuda, #pedido, #devoluciones, #contacto, #nosotros, #privacidad, #terminos`) which are
modelled as typed search state, not raw `location.hash` reads.

### Target structure

```
apps/web/
├── DESIGN_SYSTEM.md                       # human-readable token + surface reference
├── public/
│   ├── favicon.ico
│   ├── mrconfetti-logo.webp
│   ├── banners/banner-1.png|banner-2.webp|banner-3.png
│   └── products/p01..p12.webp
└── src/
    ├── index.css                          # design system: brand tokens + shadcn contract
    ├── components/
    │   ├── ui/                            # shadcn primitives, added only when used
    │   └── layout/
    │       ├── site-header.tsx            # full variant
    │       ├── checkout-header.tsx        # steps variant (checkout.html:178)
    │       ├── site-footer.tsx
    │       ├── search-bar.tsx
    │       ├── header-actions.tsx
    │       ├── category-nav.tsx
    │       └── breadcrumbs.tsx
    ├── features/
    │   ├── catalog/
    │   │   ├── schemas/product.ts         # zod schema + inferred types
    │   │   ├── data/products.ts           # 36 products
    │   │   ├── lib/selectors.ts           # byCategory, byBrand, deals, sort, paginate
    │   │   └── components/
    │   │       ├── product-card.tsx
    │   │       ├── product-rail.tsx
    │   │       ├── product-grid.tsx
    │   │       ├── product-price.tsx
    │   │       ├── product-rating.tsx
    │   │       ├── favorite-button.tsx
    │   │       └── quantity-stepper.tsx
    │   ├── filters/components/            # catalog filter sidebar, chips, sort, pager
    │   ├── cart/
    │   │   ├── store/cart-store.ts        # zustand + persist
    │   │   ├── lib/totals.ts              # single source of shipping/coupon math
    │   │   └── components/                # cart line, summary, free-ship meter,
    │   │                                  #   saved-for-later, coupon-field
    │   ├── favorites/store/favorites-store.ts
    │   ├── checkout/                      # steps, address form, shipping/payment radios,
    │   │                                  #   validation rules, success panel
    │   ├── orders/store/orders-store.ts   # mc-last-order
    │   └── home/{data,components}/        # hero, categories, campaigns, brands, rails
    ├── hooks/                             # use-carousel, use-media-query,
    │                                      #   use-prefers-reduced-motion, use-product-search
    └── lib/
        ├── money.ts                       # Q. currency formatting (es-GT)
        ├── constants.ts                   # FREE_SHIPPING_FROM, SHIPPING_RATES, MAX_QTY
        ├── coupons.ts                     # EMOX10 / BIENVENIDO as typed table
        ├── format.ts                      # rating, discount %, review count
        ├── routes.ts                      # typed route/href builders + query contract
        └── utils.ts                       # existing cn()
```

Composition rule: a route assembles sections; a section owns layout and composes feature
components; a feature component owns behaviour. No page over ~150 lines. No component per
`div`.

### State design

Zustand with `persist`, one store per domain, all mounted through a single
`stores/store-provider.tsx` used in `__root.tsx` so header badges and every route read the
same instance.

| Store | Persist key | Shape |
| --- | --- | --- |
| `cart-store` | `mc-cart` | `lines: { id, qty }[]`, add/setQty/remove/clear, clamped to `MAX_QTY` |
| `saved-store` | `mc-saved` | `ids: number[]`, saveForLater/unsave/moveToCart |
| `favorites-store` | `mc-favoritos` | `ids: number[]`, toggle/remove/clear |
| `promo-store` | `mc-promo` | `code: string \| null`, resolved against the coupon table |
| `orders-store` | `mc-last-order` | `{ ref, total, items, email, date } \| null` |

Hydration: persist rehydrates on the client only; the header badges render their SSR value
(`0`) on first paint and correct after hydration, and the store exposes a `hydrated` flag so
no component reads persisted state during SSR.

All money and shipping math is derived from `features/cart/lib/totals.ts` and
`lib/constants.ts`. No page re-derives it.

### API contract (typed search params)

The source pages hand-parse query strings. In the app every one becomes a typed
`validateSearch` on the route, validated with zod:

- `/products`: `cat`, `brand`, `q`, `deal`, `sort` (`rel|pa|pd|dto|val`), `page`
- `/products/$productId`: `id` is the path param; the source's `?id=` fallback disappears
- `/ayuda`: `tema` (one of the seven anchors)

## Phase plan

Each phase is a work unit with its own commit and its own checks. Phases are grouped into
chained PRs; a PR is opened only after its phases are green.

### Phase 0 — Foundations: design system, assets, domain model

1. Vendor every image into `apps/web/public/`: logo, 3 banners under `banners/`, 12
   product images under `products/`, `favicon.ico`.
2. Extend `apps/web/src/index.css`: brand palette as semantic tokens layered on the shadcn
   contract, radius scale (12/8px), font decision, and the hairline/no-shadow surface
   convention.
3. Write `apps/web/DESIGN_SYSTEM.md`: palette with hex and token name, type scale, radius
   scale, spacing, surface rules, breakpoints, touch-target and focus rules.
4. `lib/constants.ts` (`FREE_SHIPPING_FROM=50`, `SHIPPING_RATES`, `MAX_QTY=9`),
   `lib/coupons.ts`, `lib/money.ts`, `lib/format.ts`.
5. `features/catalog/schemas/product.ts` (zod) + `features/catalog/data/products.ts`
   (36 products, typed and validated).
6. `features/catalog/lib/selectors.ts`: `byCategory`, `byBrand`, `dealsByDiscount`,
   `sortProducts`, `paginate`, `searchProducts`.

Test-first applies: `money`, `coupons`, `selectors` get failing tests first.

### Phase 1 — Shared layout

1. Add the shadcn primitives the layout needs (`badge`, `separator`).
2. `category-nav.tsx` (9 entries from the source nav table), `search-bar.tsx`,
   `header-actions.tsx` (login → `/login`, favorites and cart badges),
   `site-header.tsx`, `checkout-header.tsx` (3-step variant), `breadcrumbs.tsx`,
   `site-footer.tsx`.
3. `stores/store-provider.tsx` mounted in `__root.tsx`; wire the badges.
4. Rewrite `__root.tsx`: `lang="es"`, real title/description, header + `<main>` + footer
   shell, remove the starter `header.tsx`/`user-menu.tsx` imports.

### Phase 2 — Home: hero and categories

`use-carousel.ts` (index, next/prev, autoplay, pause on `prefers-reduced-motion`),
`hero-carousel.tsx`, `hero-promo-card.tsx`, `section-heading.tsx`, `category-grid.tsx`,
`home/data/home-content.ts`.

### Phase 3 — Home: product rails and client state

1. Pure cart/favorites logic and totals with tests first.
2. `cart-store` and `favorites-store` with `persist`.
3. `product-card.tsx` (composed of `favorite-button`, `product-rating`,
   `product-price`), `product-rail.tsx` with edge-aware arrow controls.
4. Four rails wired through the selectors; toast feedback via the installed `sonner`.

### Phase 4 — Home: campaigns, brands, assembly

`campaign-banners.tsx`, `brands-showcase.tsx`, `trust-cards.tsx`, `season-banner.tsx`,
then assemble `routes/index.tsx`.

**→ PR 1: foundation + shared layout + home.**

### Phase 5 — Catalog `/products`

Sections: breadcrumbs, page heading with count and sort select, filter sidebar (categories,
brands, price range, rating radios, free-shipping and deal checkboxes), active filter chips,
product grid, pagination (`PER=12`), empty state with "Limpiar filtros". Mobile: filter
panel as a `sheet` with scrim and `Esc`. shadcn: `checkbox`, `radio-group`, `select`,
`input`, `badge`, `sheet`, `pagination`, `separator`, `button`.

Filters live in component state and are mirrored into typed search params so the URL is
shareable; `?cat=`, `?brand=`, `?deal=1` and `?q=` round-trip.

**→ PR 2: catalog.**

### Phase 6 — Product detail `/products/$productId`

Sections: breadcrumbs, gallery with thumbnails and zoom, brand/title/rating/price/instalments,
colour and pack swatch radiogroups (pack adds `Q.19` and recomputes price), quantity
stepper clamped to stock, add-to-cart with a short pending state, favorite, stock and perks,
coupon field, details tabs (description, specs table, reviews with rating bars), related
rail, sticky mobile add-to-cart bar driven by an `IntersectionObserver`.

The source's hard-coded rating, review count, specs and perk dates are derived from the
product model or moved into the data module — never inline constants in the component.

**→ PR 3: product detail.**

### Phase 7 — Cart `/cart` and favorites `/favoritos`

Cart: free-shipping progress meter, line items with stepper (disabled at 1 and at
`MAX_QTY`) and delete, save-for-later panel with move/unsave, coupon field with rehydration,
order summary, empty state, recommended rail, clear-all behind an `alert-dialog`, and the
order-confirmation dialog. All totals come from `totals.ts`.

Favorites: grid of product cards, remove with motion that respects reduced motion, clear-all
behind an `alert-dialog` (the source cleared without confirming), empty state.

**→ PR 4: cart + favorites.**

### Phase 8 — Checkout `/checkout`

Three-step indicator, address panel, shipping-method radiogroup (retotals on change),
payment-method radiogroup with card / bizum / paypal panels, input masks (card groups of 4,
`MM/AA`, digits-only CVC and postal code), per-field validation on blur and submit with
`aria-invalid` and `aria-describedby`, a focusable error summary, disabled submit with a
processing state, then the success panel and the persisted last order. Redirects to `/cart`
when the cart is empty and there is no last order.

**→ PR 5: checkout.**

### Phase 9 — Help `/ayuda`

Table of contents with `aria-current` driven by the active topic, FAQ sections, order
tracking form with a four-step tracking list and validation, returns, contact, about,
privacy and terms sections. Topic is a typed search param so deep links work.

**→ PR 6: help.**

### Phase 10 — Cross-cutting verification and close

1. `bun run --filter web test`, `bun run check-types`, `bun run --filter web build`.
2. Render smoke test per route.
3. Responsive pass at 1240 / 1024 / 768 / 480 on all seven routes.
4. Accessibility pass: focus-visible rings, `aria-label` on icon-only controls, 44px targets,
   `alt` text, single `h1` per route, heading order, keyboard path for the carousel, the
   sheet, the dialogs and the tabs.
5. Reduced-motion pass: carousel autoplay, rail scrolling, favorite removal animation.
6. Persistence pass: cart, saved, favorites, promo and last order survive reload and sync
   across two tabs.
7. Visual comparison against each source HTML page at each breakpoint.
8. Record every commit id in this document.

## Checks

| Check | Command | Applies from |
| --- | --- | --- |
| Unit tests | `bun run --filter web test` | Phase 0 |
| Types | `bun run check-types` | Phase 0 |
| Build | `bun run --filter web build` | Phase 1 |
| Dev smoke | `bun run dev:web` + browser | Phase 1 |
| Responsive QA | manual, 4 breakpoints | Phase 1 |
| a11y + reduced motion | manual | Phase 2 |
| Persistence + multi-tab | manual | Phase 3 |
| Backend/API tests | — | not applicable, no backend in scope |

Test-first applies wherever there is pure logic with a clear expected outcome: formatters,
coupons, constants, selectors, filter/sort/paginate, cart and totals math, validation
rules. Presentational components are covered by render smoke tests plus visual QA; no
snapshot-only tests.

## Delivery strategy

- One feature branch from `main` for Phases 0-4 (PR 1). Subsequent PRs stack on the
  previous one, so each review slice stays under a comfortable review size instead of
  landing one 6-route change.
- One work-unit commit per phase, Conventional Commits, tests and docs inside the same
  commit as the behaviour they cover.
- Push, PR creation and merge stay the user's decision.

## Progress log

| Phase | Commit | Evidence |
| --- | --- | --- |
| scaffold cleanup | `dce0777` | starter ASCII banner, `/health` probe and forced dark class removed |
| 0 — foundations | `89e19ff` | 39 tests pass, `check-types` clean, `build` succeeds |

Phase 0 delivered assets under `apps/web/public/` (logo, 3 banners, 12 product images,
`favicon.ico`), brand tokens in `apps/web/src/index.css`, `apps/web/DESIGN_SYSTEM.md`,
`lib/constants.ts`, `lib/coupons.ts`, `lib/format.ts`, the catalog schema, the 36 ported
products and the tested selectors.

Deviations from the plan as written:

- The design-system reference landed as `apps/web/DESIGN_SYSTEM.md` and the token block as
  planned; no second token file was created.
- `@fontsource-variable/inter` was removed rather than left in place: it was declared as a
  dependency but never imported by any file, so the app had been rendering the fallback
  sans all along. Poppins now loads for real.
- `apps/web` had no `check-types` script, so `bun run check-types` silently skipped the web
  app. A script was added.
- The unused legacy helpers `MC.totals()` and `window.MC_onSearch`, plus the duplicated
  shipping constants, are superseded by `lib/constants.ts` and `lib/coupons.ts`.

## Open risks

- **Review size.** Six chained PRs is the mitigation; if PR 1 grows past roughly 600
  changed lines it should be split into "foundation + layout" and "home".
- **Image weight.** `banner3-independencia.png` is 629 KB. It will be copied as-is for
  fidelity; compression is a separate, optional follow-up.
- **Font.** Resolved in Phase 0: Poppins (latin 400-800), self-hosted. Inter Variable was
  dead code and has been removed.
- **Repository hygiene.** `local.db`, `.codegraph/` and `apps/web/src/routeTree.gen.ts` are
  untracked and `local.db` is not in `.gitignore`. A committed SQLite database would be a
  real accident; `local.db` should be ignored. Flagged, not changed, because it is outside
  this feature.
- **Scope of `/login`.** The design's "Iniciar sesión" points at the existing scaffold
  route, which is not part of the design. If the user wants a designed login page, that is
  a new feature, not part of this one.
