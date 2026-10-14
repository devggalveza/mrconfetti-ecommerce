# Feature: Mr. Confetti storefront (design-system + full design implementation)

Status: in progress — phases 0-6a complete, PR 1 reviewed, PR 2 in review
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

Phase 7 lands as three work units, each with its own commit:

| Unit | Artifacts | Task | Status |
| --- | --- | --- | --- |
| 7a — cart math and state | `features/cart/lib/totals.ts`, `stores/saved-store.ts`, `stores/promo-store.ts`, `stores/orders-store.ts`, `stores/store-provider.tsx`, `stores/selectors.ts` (+ tests) | Compose subtotal, discount, shipping and total in one tested module; add the three missing persisted domains | done — `ce7fec6` |
| 7b — cart UI | `components/ui/alert-dialog.tsx`, `features/cart/components/*`, `routes/cart.tsx` (+ test) | Free-shipping meter, lines, saved-for-later, coupon, summary, empty state, rail, clear-all and confirmation dialogs | done — `15948f6`, `64b36cd` |
| 7c — favorites UI | `features/favorites/components/*`, `routes/favoritos.tsx` (+ test) | Grid, reduced-motion remove, clear-all dialog, empty state | done — `1ddf45c` |

Contract decisions taken while planning 7a (parent-owned, not left to the writer):

- `computeTotals(lines, products, coupon)` is the single source of every cart amount. It
  returns `items`, `units`, `subtotal`, `discount`, `shipping`, `total`,
  `freeShippingApplied`, `freeShippingRemaining` and `freeShippingProgress`.
- Shipping is free when the subtotal reaches `FREE_SHIPPING_FROM` **or** every line ships
  free, and costs `STANDARD_SHIPPING_PRICE` otherwise; an empty cart ships for `0`.
- `discount` is `roundMoney(applyCoupon(subtotal, coupon))`; `applyCoupon` returns the
  discount, not the discounted subtotal. Per-line amounts stay pre-discount and the
  discount is reported once in the summary, so no second distribution rule exists.
- The cart line reuses `QuantityStepper`, whose ceiling is `quantityLimit(product)`, rather
  than a private `MAX_QUANTITY` ceiling, so the cart can never exceed stock.
- `orders-store` is created here rather than in phase 8: the cart owns the confirmation
  dialog, so the seam it reads (`lastOrder` plus a `pendingConfirmation` flag) has to exist
  before checkout can write to it.

### Phase 8 — Checkout `/checkout`

Three-step indicator, address panel, shipping-method radiogroup (retotals on change),
payment-method radiogroup with card / bizum / paypal panels, input masks (card groups of 4,
`MM/AA`, digits-only CVC and postal code), per-field validation on blur and submit with
`aria-invalid` and `aria-describedby`, a focusable error summary, disabled submit with a
processing state, then the success panel and the persisted last order. Redirects to `/cart`
when the cart is empty and there is no last order.

**→ PR 5: checkout.**

Phase 8 lands as three work units, each with its own commit:

| Unit | Artifacts | Task | Status |
| --- | --- | --- | --- |
| 8a — checkout logic | `lib/constants.ts`, `features/cart/lib/totals.ts`, `features/checkout/lib/{masks,validation,order}.ts` (+ tests) | Shipping-method-aware totals, input masks, pure field rules and the order builder | done — `25e346a` |
| 8b — checkout UI | `features/checkout/data/checkout-copy.ts`, `features/checkout/components/*` (+ test) | Address panel, shipping and payment radiogroups with their panels, error summary, success panel | done — `9369dfe` |
| 8c — route and chrome | `routes/checkout.tsx`, `routes/__root.tsx` (+ tests) | Assemble the route, show the checkout header instead of the site header, and the empty-cart redirect | done — `97a7018` |
| 8d — verifier consistency | `routes/checkout.tsx`, `features/checkout/components/checkout-form.tsx` (+ test) | The route owns the `h1`, and both routes agree on what an empty cart is | done — `68c0311` |
| 8e — verifier findings | `features/checkout/components/*` (+ test) | The form is inert while the order is pending, and the summary entries meet the 44px target | done — `0d17cee` |

Contract decisions taken while planning 8a (parent-owned, not left to the writer):

- `computeTotals` gains an optional fourth parameter, the shipping method, defaulting to
  `standard`. Only the standard method can be waived by the free-shipping rule: express and
  pickup are premium services the customer explicitly buys, so they cost their listed price
  even when the cart qualifies. The default keeps every phase 7 assertion valid.
- `ShippingMethod` and `SHIPPING_METHOD_PRICES` live in `lib/constants.ts`, next to the three
  prices the plan already called `SHIPPING_RATES`. Labels are copy and stay in the checkout
  copy module.
- Validation returns **error codes, never Spanish copy**: the rules module stays pure and the
  copy module owns the wording. `firstErrorField` walks a declared field order so the error
  summary and the focus move are deterministic.
- The last order keeps the phase 7 shape (`ref`, `total`, `items`, `email`, `date`). The
  chosen shipping and payment methods are deliberately not persisted, so the seam the cart's
  confirmation dialog reads does not move.
- Order references are derived from an injected date, so the builder is deterministic under
  test rather than reading the clock.
- The form uses plain controlled state in a local hook, **not** `@tanstack/react-form`.
  Planning assumed the library because the auth forms use it, but the checkout rules are
  already a tested pure module: routing them through a form library would put the same rules
  in a second place and force the tests to work around library render props. The hook owns the
  state and calls the tested rules; the panels stay presentational. The auth forms keep their
  library untouched.

### Phase 9 — Help `/ayuda`

Table of contents with `aria-current` driven by the active topic, FAQ sections, order
tracking form with a four-step tracking list and validation, returns, contact, about,
privacy and terms sections. Topic is a typed search param so deep links work.

The page is one document with seven anchored sections (`ayuda`, `pedido`, `devoluciones`,
`contacto`, `nosotros`, `privacidad`, `terminos`) and a sticky table of contents on desktop
that collapses into a horizontal chip rail below 768px.

**→ PR 6: help.**

Phase 9 lands as two work units, each with its own commit:

| Unit | Artifacts | Task | Status |
| --- | --- | --- | --- |
| 9a — help contract and logic | `features/help/schemas/help-search.ts`, `features/help/data/help-copy.ts`, `features/help/lib/tracking.ts`, `features/checkout/lib/order.ts` (+ tests) | The seven topics and their zod schema, the frozen Spanish copy, and the pure tracking rules | done — `773cc39` |
| 9b — help sections and route | `features/help/components/*`, `features/help/hooks/*`, `routes/ayuda.tsx` (+ test) | Table of contents with `aria-current`, FAQ, tracking panel, returns, contact, about, privacy and terms, and the route that assembles them | done — `fd6d184` |

Contract decisions taken while planning 9a (parent-owned, not left to the writer):

- `tema` accepts exactly `ayuda | pedido | devoluciones | contacto | nosotros | privacidad |
  terminos`, and it is optional. A value outside the set is **stripped, not rejected**: an
  unknown `tema` renders the page with no entry marked `aria-current` and no scroll, which is
  the same state the footer's bare “Centro de ayuda” link produces. Rejecting it would turn a
  stale bookmark into an error page.
- The schema and the topic tuple live in `features/help/schemas/help-search.ts`, mirroring
  `features/catalog/schemas/products-search.ts`, and the route parses with `.catch({})` the way
  `/products` does. The query codec is already wired in `router.tsx`, so links read
  `?tema=pedido`; the footer's links and the `chrome.test.tsx` assertions on their hrefs must
  not change, and the new type must accept the six values the footer already passes.
- The order-reference format is exported **once**, from `features/checkout/lib/order.ts` as
  `ORDER_REF_PATTERN`, and the help tracking module imports it. No second regex, and the
  checkout builder keeps the single source of the format.
- Tracking is honest. The only order that can be found is the one in `mc-last-order`: a
  well-formed reference that does not match it gets an explicit “no encontramos ese pedido”
  plus the contact channels, and a malformed one is a field error. No step, date or total is
  invented for a reference the app cannot resolve.
- The four-step list is both content and state. The step table is frozen in the copy module;
  the tracking result marks each step from the order date against an **injected** `now`, with
  thresholds documented as a stand-in for the fulfilment API this frontend does not have. The
  module never reads the clock, so it stays deterministic under test.
- Only the tracking section reads persisted state, so only it sits behind
  `useStoresHydrated()` with a single `role="status"` skeleton. The table of contents, the
  `h1` and every static section render on the server. Same convention as `/cart`,
  `/favoritos` and `/checkout`.
- FAQs are native `<details>` / `<summary>`. No accordion primitive is vendored and the plan
  forbids adding dependencies; the native element brings the keyboard behaviour for free.
  `<summary>` meets the 44px rule like every other control, and the phase 8 finding about
  target sizes is the precedent.
- The active entry is marked with `aria-current`, and the scroll into view respects
  `prefers-reduced-motion` through the existing `hooks/use-prefers-reduced-motion.ts`.
- All Spanish copy is authored in one frozen `HELP_COPY` object. The design source for this
  page is gone like the three before it, so the copy is a reading of the plan's section list,
  not a transcription.

Coding contracts pinned while briefing 9a and 9b (parent-owned, not left to the writer):

- `ORDER_REF_PATTERN = /^MC-[0-9A-Z]+$/` is exported non-global and case-sensitive;
  `createOrderRef` keeps its implementation and a new test asserts a built reference matches the
  exported pattern, so the format and its consumer cannot drift apart.
- `HELP_TOPICS` is the single ordered source of the seven anchors. `helpSearchSchema` is
  `z.object({ tema: z.enum(HELP_TOPICS).optional().catch(undefined) })` typed `z.ZodType<HelpSearch>`,
  and the route parses `helpSearchSchema.catch({}).parse(search)` exactly like `/products`.
- The tracking rules return **codes, not copy**, following the phase 8 validation decision.
  `TRACKING_STEPS` is the single ordered source of progression; the copy module owns
  `stepById: Record<TrackingStepId, { label, description }>` through `satisfies`, and the panel
  zips the two. `markTrackingSteps(orderDate, now)` returns `Record<TrackingStepId, TrackingStepState>`
  from an injected `now`, with thresholds in hours (`preparing: 4`, `shipped: 24`, `delivered: 72`),
  `confirmed` always `done`, the first pending step promoted to `current`, and an unparsable date
  counted as elapsed zero. The module never reads the clock.
- `resolveTracking(input, lastOrder, now)` returns a discriminated union over
  `empty | malformed | not-found | found`. Normalising the typed reference (trim plus uppercase) is
  the help module's job; `not-found` carries the normalised reference and invents no step, date or
  total.
- The static sections share one block model, `{ kind: "paragraph", text } | { kind: "list", items }`,
  so one presentational section component renders five anchored sections instead of five bespoke ones.
- Honesty in the authored copy: the contact section publishes only `hola@mrconfetti.example`
  (RFC 2606 reserves `.example`) and no phone number, because the demo store has no real channel;
  privacy and terms say in their own text that they are demo content with no legal value, matching
  the footer's demo note.
- The active table-of-contents entry uses `aria-current="location"`, not `"page"` like
  `category-nav`: this is a section of the current page, not another page.
- Entries are plain `<a href="#<id>">` anchors. A click only sets the active state; the browser does
  the move, so keyboard, no-JS and stale-bookmark deep links all work. Reduced motion applies only to
  the initial `tema` scroll, which runs in a `useEffect` through `usePrefersReducedMotion()`
  (`behavior: "auto"` when reduced). Sections carry `scroll-mt-*` so an anchor lands below the sticky
  site header.
- The layout breakpoint is 768px: a sticky aside from `md` up, the chip rail below it. The route keeps
  the site header and adds no breadcrumb (the plan lists no breadcrumb here), and the `h1` uses the
  same `text-2xl font-bold` as `/cart`.

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
| 0 — foundations | `89e19ff` | 39 tests, `check-types` clean, `build` succeeds |
| 1a — state and routes | `fdd3aac` | 78 tests; zustand stores under the legacy keys, seven typed routes |
| 1b — shared chrome | `2302d5e` | 100 tests; SSR of `/` inspected for the shell, metadata and link hrefs |
| 2 — hero and categories | `2a518cb` | 131 tests; SSR reports 3 slides, 3 dots, 1 active dot, 7 category links |
| 3 — card and rails | `441c83f` | 143 tests; SSR reports 84 cards and 5 rail headings |
| 4 — campaigns and assembly | `c63847f` | 160 tests; SSR reports all 10 sections in ascending order |
| 5 — catalog (logic) | `87de5a3` | filter state, coercion and tests first; 3 shadcn primitives vendored |
| 5 — catalog (UI) | `ec1c128` | 208 tests; `check-types` and `build` clean; route render test covers 12-per-page, chips, empty state and query round-trip |
| 6a — product detail data | `076c753` | 259 tests; every legacy field verified byte-identical to `HEAD` across the 36 products |
| 6b-i — product detail content | `8cfb571` | 272 tests; `description`/`highlights` added and authored for all 36; the page's copy becomes a typed module |
| 6b-ii — product detail UI | `631473c` | 309 tests; the route was unreachable and now renders from the real tree; `check-types` and `build` clean |
| 7a — cart math and state | `ce7fec6` | 43 tests; `computeTotals` plus the `mc-saved`, `mc-promo` and `mc-last-order` stores; test-first RED recorded, `check-types` clean |
| 7b — cart UI | `15948f6`, `64b36cd` | 59 cart tests; base-ui alert dialog vendored; the route renders its structure on the server and only the persisted sections wait for hydration |
| 7c — favourites UI | `1ddf45c` | 22 favourites tests; one exit path shared by remove, clear and the card heart, settled by `transitionend` or a bounded fallback |
| 7d — verifier findings | `e7d1c7a`, `fb260b2` | 389 tests; save-for-later made the inverse of move-to-cart; the focus rescue no longer strands on the body |
| 7 — phase verification | — | full web suite 39 files / 389 tests green; `bunx tsc --noEmit` clean run directly, not through turbo; `bun run --filter web build` green |
| 8a — checkout logic | `25e346a` | 75 tests; method-aware shipping, masks, field rules returning codes, deterministic order builder; test-first RED recorded |
| 8b — checkout form | `9369dfe` | 469 tests; copy module, single source for field ids, controlled form hook, presentational panels; `CheckoutForm` is the only writer; amount rows extracted to `TotalsRows` |
| 8c — route and chrome | `97a7018` | 478 tests; the root drops the site header on `/checkout`, the route owns the steps header and the redirect; the route test mounts the real tree |
| 8d — verifier consistency | `68c0311` | 479 tests; the route owns the `h1`, and both routes derive emptiness from the same joined items |
| 8e — verifier findings | `0d17cee` | 482 tests; the form cannot move under a pending order, and the summary entries meet the 44px rule |
| 8 — phase verification | — | full web suite 45 files / 482 tests green; `bunx tsc --noEmit` clean run directly; `bun run --filter web build` green |
| 9a — help contract and logic | `773cc39` | 51 focused tests; the seven topics and their schema, the authored copy and the pure tracking rules; `ORDER_REF_PATTERN` exported once and pinned by a drift test; test-first RED recorded |
| 9b — help sections and route | `fd6d184` | 546 tests; one sticky/rail table of contents, FAQ as native `details`, and the gated tracking panel; the verifier's sticky-placement finding and the stale-marker gap were fixed before the unit's commit |
| 9 — phase verification | — | full web suite 52 files / 546 tests green; `bunx tsc --noEmit` clean run directly; `bun run --filter web build` green |
| 10 — cross-cutting verification | — | see the close record below; steps 1 and 2 run, steps 3, 5, 6 and 7 owed to a human with a browser |

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

Deviations found while building phases 1-4:

- **Query-string codec.** TanStack Router's default codec runs every value through
  `JSON.stringify`, so filter links came out as `/products?cat=%5B%22Globos%22%5D`. The
  router now uses `lib/search-params.ts`, so links read `/products?cat=Globos` and
  `/products?cat=Globos&cat=Personajes`. This had to be fixed before the catalog existed,
  because the footer, the category rail and every filter link depend on it.
- **Tinted surfaces.** The source's final override pass paints `.cat .c`, `.brand` and the
  category wells white, which erases them against a white page. They keep the subtle tint
  the same file specified before that pass. Flagged as one decision, easily reversed.
- **Carousel pause control.** Added over the source, because WCAG 2.2.2 requires a way to
  stop content that advances on its own.
- **Campaign gradients.** The source's magenta/blue/red belonged to the template's brand,
  and the amber first chosen for the third card gave white text a 2.1:1 contrast ratio.
  All three gradients are now dark enough for white text.
- **Rail arrows** disable at the edge they cannot scroll past; the source leaves them
  always enabled.
- **`role="group"` was removed from the rail `ul`** after a first draft stripped its list
  semantics; the rail keeps native list markup.
- **Brand row** fits three real brands instead of the source's eight-column layout.
- **Lucide icons replace the source's inline SVG sprite**, and `rounded-lg` is 12px in this
  project's radius scale while `rounded-xl` is 16px.

Deviations found while building phase 5:

- **Two declared shadcn primitives were not needed.** The plan listed `select` and
  `pagination`; the sort control is a native `<select>` (lighter, accessible, no
  portal) and the pager is a purpose-built `features/catalog/components/pagination.tsx`
  because shadcn's `pagination` is only markup helpers over the same `<nav>`. `badge`
  stays and is used by the header and `product-price`; the active chips are hand-rolled
  because `Badge` is not interactive. `separator.tsx`, added by this phase and used by
  nothing in the app, was removed.
- **Filter state is owned by the URL, not mirrored from component state.** The plan said
  filters live in component state and are mirrored into the search params. The outcome
  the criterion wanted — shareable, deep-linkable filters — is met more directly by
  reading and writing the search params as the single source; only the drawer and the
  price draft hold local state.
- **`?deal=1` normalises to `?deal=true`.** The schema accepts `1` and the flag is
  re-emitted through the generic codec as `true`, so the literal URL form named in the
  criterion is not reproduced byte for byte. Every other key round-trips as written; the
  same one-way normalisation drops any default value on the way out.
- **`routeFileIgnorePattern` was added to `vite.config.ts`** so the route-adjacent
  `products.test.tsx` stops tripping the generator's "does not export a Route" warning
  on every test run and on each of the build's three passes.
- **`minRating=-0` survives as `-0`.** Consolidating the coercion rules into the schema
  module made `?minRating=-0` reachable as `-0` instead of a canonical `0`. Comparisons
  and the chip suppression are unaffected, so it is recorded rather than patched.

Deviations found while building phase 6a:

- **The review bars are derived, not copied.** The design hard-codes `72/18/6/2/2` at a
  rating of 4.6. `reviewDistribution` derives the buckets from the aggregate rating with a
  maximum-entropy distribution solved by bisection and rounded by largest remainder, which
  gives `71/21/6/2/0` for that rating. The aggregate is the only value the model carries,
  so a literal would be a second source of truth that nothing keeps honest. Independently
  checked over 1,967 ratings: five integer, non-negative buckets summing to exactly 100.
- **`packs` is one shared frozen table, not a per-product array.** Option A approved
  `options: { colors, packs }` on the product. `colors` stays per product because it
  genuinely varies; `packs` never varies, so the two options live once in
  `data/product-options.ts`, frozen, and every product references them. The field stays
  required, so a product can still override the table later. `Product["packs"]` is now
  `readonly ProductPack[]`, so both the compiler and the runtime refuse an in-place
  mutation that would otherwise corrupt all 36 products at once.
- **The related rail is affinity-ordered, not the design's slice.** The source shows the
  next five products by id. `relatedProducts` puts the same category first, then fills by
  price proximity to the current product with the id as tiebreak. Approved as a deviation
  when the data model was chosen.
- **New modules the plan's target structure did not list:** `data/product-options.ts` (the
  shared pack table) and `lib/product-detail.ts` (the pure derivations).
- **`lib/format.ts` gained `roundMoney`.** `instalments` had re-implemented the money
  rounding rule that `formatMoney` already inlined; both now call the shared helper, whose
  output was verified byte-identical over 16,026 inputs.
- **Content authorship.** The source's single `Estándar` swatch and its featured reviewers
  Lucía M. and Andrés P. belonged to the design's generic demo product. Each product now
  carries brand-plausible colours and two Spanish reviews whose ratings stay within 0.3 of
  its own aggregate. Deliberate, per option A.
- **Known latent gap.** The pack freeze is shallow: the array and its slots are frozen and
  `as const` makes the element properties readonly to the compiler, but a deliberate cast
  could still rewrite `PRODUCT_PACKS[0].name` at runtime. Accepted rather than deep-frozen,
  to keep the fix minimal.

Deviations found while building phase 6b:

- **The route never rendered, and no test could have caught it.** `products.$productId.tsx`
  was nested under the `/products` route, which renders no `<Outlet/>`, so routing to the
  detail mounted the listing and dropped the page. The unit's test built its own root with
  an `Outlet` and the detail route as its direct child, so it passed against a tree the app
  never uses. Fixed by renaming to `products_.$productId.tsx` — the framework's nesting
  opt-out — which makes the generated tree parent the route to the root while the public
  path stays `/products/$productId`. The test now mounts the real `routeTree.gen.ts`, which
  is the part that matters: this class of defect can no longer hide.
- **The page's state is keyed to the product.** The router reuses one component instance
  across a param change, so navigating product → product through the related rail kept the
  quantity, the pack and the add status. A verifier reproduced all three faces: up to nine
  units following the reader onto a product whose stock is three, the previous product's
  `Q.19` gift-wrap surcharge still priced into the new product, and an in-flight timer still
  writing the old product id. The stateful page is now keyed by the product id and the add
  call site clamps the quantity, so the ceiling no longer rests on the stepper being the
  only writer.
- **The quantity ceiling is `min(MAX_QUANTITY, stock)`, not `stock` and not the design's
  `12`.** The stock line reports the real stock, which reaches 30, so a product can say
  "quedan 14 unidades" while the stepper stops at 9. Deliberate: `MAX_QUANTITY` is a
  per-order cap, the stock is availability, and they answer different questions.
- **The pack surcharge flows into the price block, so the discount badge recomputes with
  it** — base `-25 %`, gift wrap `-16 %`. The design keeps the badge at the base figure.
  Recorded rather than fixed: holding the badge steady needs `ProductPrice` to take a
  separate badge price, which is phase 5's component and outside this unit.
- **The coupon validates and reports but changes no money.** The design behaves the same
  way. Applying a discount to a total belongs to checkout, and a verifier confirmed every
  `Q.` amount on the page is byte-identical before and after a valid code.
- **The gallery has one thumbnail** because the model carries one image, and it renders as
  an `aria-pressed` button inside a named list rather than the design's `tablist` holding a
  single tab. The zoom toggles the scale and the hint; it does not follow the pointer to
  the click origin.
- **The tabs primitive is vendored over `@base-ui/react/tabs`**, the family the other
  vendored primitives use, rather than the `radix-nova` style `components.json` declares.
  No dependency was added.
- **`formatRatingValue` extracted from `formatRating`**, which now reuses it: the aggregate
  line needs a bare `4,6` while the combined `4,6 (312)` output stays byte-identical.
- **Review size.** PR 3 lands as two commits totalling roughly 2,495 changed lines across
  22 files, the largest slice in the feature. The split is by layer, not by review slice:
  the content half is read-and-skim, the component half is what needs reading, and the
  route test alone is 567 lines.

Deviations found while building phase 7:

- **The design sources are gone.** Recorded under Open risks; phase 7 was built from the
  per-page contract in this document plus `DESIGN_SYSTEM.md`, and every phase 7 string is
  authored rather than templated from a source file.
- **The hydration gate is a new convention, not a documented one.** No route used
  `useStoresHydrated()` before this phase; the state design only said the flag exists so no
  component reads persisted state during SSR. The policy this phase settled on, and the one
  `/favoritos` and `/checkout` copy: breadcrumbs, the `h1` and static sections render
  unconditionally on the server, and every persisted section sits behind the flag replaced
  by one skeleton `role="status"`. The first draft returned `null` for the whole route,
  which blanked the server HTML of a real URL; the verifier confirmed the corrected gate
  leaks no persisted value in either route.
- **`orders-store` landed in phase 7, not phase 8.** The cart owns the confirmation dialog,
  so the seam it reads (`lastOrder` plus `pendingConfirmation`) had to exist first. The
  dialog is inert until checkout writes an order; that is expected, not a bug.
- **The recommended rail is the top five by discount.** The source's rail contents are
  unknown with the sources gone, so it uses `dealsByDiscount(products).slice(0, 5)`.
- **The cart line reuses `QuantityStepper`, so its ceiling is stock, not `MAX_QUANTITY`.**
  The plan said a `MAX_QTY` ceiling. A line persisted above a product's current stock
  therefore renders above its ceiling: the increase control is disabled and the decrease
  control walks it back into range. This is the pre-existing stock-blind add on the product
  card made visible, not a new defect.
- **Save-for-later is a move, not a copy.** The plan did not say which; a copy made the pair
  additive, so saving then moving back doubled a unit and the cart could never be
  decluttered. `saveForLater` is now the exact inverse of `moveToCart`, and `unsave` leaves
  the cart alone. The legacy `mc-saved` shape is `ids: number[]`, so a save/move round trip
  returns exactly one unit and the line quantity is deliberately not preserved.
- **The free-shipping meter is hand-rolled** with `role="progressbar"` and its own text,
  rather than vendoring base-ui's `progress`, following the pagination precedent: the
  primitive's extra surface was not needed.
- **The alert dialog's modality is asserted by nobody.** `@base-ui/react/alert-dialog`
  forces `modal` and `disablePointerDismissal` and returns focus to the trigger; the wrapper
  does not defeat that, and the verifier confirmed it in the installed sources. No test
  covers outside-click, modality or focus return; only the `alertdialog` role is asserted.

Deviations found while building phase 8:

- **The design sources are gone here too.** The checkout copy is authored, not transcribed.
- **The step indicator lives in the route, not in the layout.** The current step is page
  state, so the root only decides which chrome family a route belongs to: it drops the site
  header on `/checkout` through one pathname constant, and the route renders
  `CheckoutHeader` inside the container. That makes the checkout header a sticky header
  bounded by the 1240px column instead of full-bleed like the site header. The design's own
  layout is unknowable without the source; this is the coherent reading of the pieces that
  already existed.
- **The last order records no shipping or payment method.** The phase 7 `LastOrder` shape is
  fixed and the cart's confirmation dialog reads it, so the seam was not widened. A real
  order would carry both.
- **`CHECKOUT_PROCESSING_MS = 600` stands in for the API that does not exist.** There is no
  backend in scope, so the success is synthetic; the constant is exported so a test can drive
  the window with fake timers.
- **The lock is more than a disabled `fieldset`.** Base UI renders its radios as focusable
  spans rather than native form controls, so a bare `fieldset disabled` left them live and
  the divergence stayed reproducible. The delivered lock is `fieldset disabled` plus `inert`
  plus a capture-phase click guard keyed on `submitting`, and the form is `aria-busy`. Only
  `checkout-form.tsx` changed; no `disabled` prop was threaded through the panels.
- **The amount rows moved.** `TotalsRows` was extracted from the cart's `OrderSummary`, so
  the cart and the checkout render the same rows from the same totals object.
Deviations found while building phase 9:

- **The design sources are gone here too.** The help copy is authored from the plan's section
  list, not transcribed, like the three pages before it.
- **The contact section publishes one channel.** `hola@mrconfetti.example` (RFC 2606 reserves
  `.example`) plus weekday hours, and it says in its own text that the demo publishes no phone
  and no address. Inventing a support phone would have been the easy way to fill the section.
- **The email renders as plain text.** The 9a block model has no link kind, so the address is a
  list item rather than a `mailto:` link. Widening the model for one string was not worth a
  nine-file change; it is recorded, not worked around.
- **`formatOrderDate` is new.** `LastOrder.date` is an ISO string and `lib/format.ts` had no date
  formatter, so the help feature adds one small module rather than formatting inline or widening
  the shared formatter set.
- **`tracking.stepState` was added in 9b, after the 9a commit.** The three state words are copy,
  and 9a had no renderer to reveal that they were missing. The additive change and its test
  assertion land inside `fd6d184`.
- **`aria-current="location"`, not `"page"`.** These entries point at sections of the current
  document, unlike `category-nav`'s page links, so the token differs deliberately.
- **The sticky box is the `<nav>` grid item, not the inner list.** The verifier found the first
  placement had zero sticky travel — an element exactly as tall as its parent cannot move — and
  the fix moved `md:sticky` onto the grid item, matching `/products`.
- **The order meta is two paragraphs, not a `dl`.** Both labels already read as sentences, so a
  `dd` under no `dt` was removed; a real description list would have duplicated the label.
- **The active topic follows a changed `tema` during render.** The verifier found that a footer
  link clicked while already on `/ayuda` scrolled the page but left the previous entry marked.
  The hook now adjusts state during render when the prop changes — no second effect.

## Open risks

- **The design sources are gone from the machine.** Phases 0-6b were built against
  `index.html`, `products.html`, `product-detail.html`, `cart.html`, `favoritos.html`,
  `checkout.html`, `ayuda.html` and `store.js`, and this document cites them by line
  (`cart.html:321`, `favoritos.html:199`). None of those files exist any more: they were
  never committed, they are absent from the whole git history (no path in any commit
  matches `*.html`), no stash holds them, and a bounded search of `Documents`, `Downloads`
  and `Desktop` finds no `cart.html`, `checkout.html`, `products.html`, `product-detail.html`
  or `store.js`. Phase 7 was therefore implemented from the per-page contract in this
  document plus `apps/web/DESIGN_SYSTEM.md`, with the user's explicit approval, and **no
  visual comparison against the source was possible**. The remaining pages are exposed the
  same way: phase 8 (checkout) and phase 9 (help) lose their source too, and phase 10 step 7
  ("visual comparison against each source HTML page at each breakpoint") cannot run at all
  until the sources are re-supplied. Recorded, not worked around.
- **Rehydrated cart lines are never re-clamped.** `cart-store.ts` clamps on every write but
  has no `persist` `merge`, so a hand-edited `mc-cart` can carry a negative quantity or an
  unknown id straight into `computeTotals` and produce a negative total. Unreachable through
  the app's own controls, which is why it is recorded rather than patched inside a UI phase.
  A `merge` that runs `clampQuantity` and `pruneUnknownIds` is the smallest fix. Phase 10.
- **Two coupon fields now behave differently.** The cart's writes to `mc-promo` and applies
  the discount; the product detail page's still validates and reports without touching
  money. Unifying them is a change to a phase 5 component and belongs to a later phase.
- **Phase 7 review size.** `27f126c..HEAD` is 31 code files, 2,976 insertions and 12
  deletions across six commits — the largest slice in the feature, bigger than PR 3. The
  commit split is by layer (logic, sections, route, favourites, two verifier fixes), not by
  review slice, so a reviewer still reads the phase as one change. If PR 4 is opened as one
  PR, cart and favourites should be considered for separate PRs instead.
- **Phase 8 review size.** `1c269e7..HEAD` is 27 code files, 2,860 insertions and 45
  deletions across five commits, second only to phase 7. The split is by layer, so PR 5 has
  the same shape as PR 4.
- **The server-painted checkout is untested.** The route test exercises the browser path, so
  the claim that `/checkout` renders its structure on the server is verified by reading the
  code, not by a test. The cart route is in the same position.
- **Coverage gaps the verifier named for phase 8.** There is no test for the `replace`
  history entry on the redirect, and none for a double `submit()`; the verifier established
  by reading the code that a second call is safe only because the hook clears the previous
  timer, which is a property no test pins.
- **A persisted line with `quantity: 0` counts as non-empty.** Only reachable by editing
  `mc-cart` by hand, and it would let checkout write a shipping-only order. Same store-level
  re-clamp gap already recorded above; one `persist` `merge` closes both.
- **The native review lifecycle is unusable in this environment.** The Pi review facade
  speaks `contract: gentle-ai.review-integration/v2` with `status/v9` envelopes, while the
  installed binary (`gentle-ai 4.0.0-20260928233426-d96a5d4f021b`, prerelease) publishes
  `contract: gentle-ai.review-integration/v1` with `start/v2` and `status/v2` only. Every
  real freeze goes through `review/start` and fails with
  `native-operation-failed` / `error_code: schema-incompatible`; `select-intended-untracked`
  reports the same failure under `diagnostics.operation: "review/start"`. Both entry routes
  were tried: a committed range (`baseRef` + `committedOnly`) and the live workspace. No
  lineage was ever created (`lineage_created: false`) and nothing was mutated, so no
  reset, recover or quarantine is owed. Phases were reviewed by delegated independent
  verifiers instead; the native review stays owed until the two halves are realigned.
  - Re-probed while closing phase 7, on the same binary
    (`4.0.0-20260928233426-d96a5d4f021b`). `inspect` now answers: it returns
    `contract: gentle-ai.review-integration/v2` with a `status/v9` envelope whose
    `action` is `start`, an empty candidate (`paths: []`, `base_tree == HEAD` tree, since
    the phase was committed) and the collect reason
    `empty_candidate_base_ref_required`. `review capabilities` shows why the halves still
    disagree: the binary publishes `contract: gentle-ai.review-integration/v1`,
    `protocol 1.5`, and lists only `review.capabilities`, `review.repair`, `review.start`,
    `review.status` and `review.validate` as operations, with `staged` and `workspace` as
    projections. Three START attempts, all rejected before any authority existed: an
    ordinary `{"mode":"ordinary"}` start (empty candidate, wants a base ref), and a
    committed range `{"baseRef": <full sha of 27f126c>, "committedOnly": true}` with and
    without an explicit `lineageId`, which fails with `native-operation-failed` /
    `error_code: schema-incompatible`. Every attempt reports `lineage_created: false`,
    `mutation_performed: false` and `reset_eligible: false`, so no reset, recover,
    quarantine or repair is owed and the tree is untouched. The committed-range route is
    also the one that natively exists (`gentle-ai review start --base-ref …
    --committed-only`), so the gap is squarely the facade's `review/start` shape against
    this binary. Note also that `RDD` is `on` (decided by default, scope unset), so the
    switch is not the blocker.
  - Re-probed while closing phase 9, on the same binary
    (`4.0.0-20260928233426-d96a5d4f021b`). `gentle-ai review capabilities` is unchanged:
    contract `v1`, protocol `1.5`, and only `review.capabilities`, `review.repair`,
    `review.start`, `review.status` and `review.validate`. `inspect` again answers with
    contract `v2` and a `status/v9` envelope whose `action` is `start`, an empty candidate
    (`paths: []`, identical `base_tree` and `current_candidate_tree`, since the phase is
    committed) and `next_transition.kind: collect` with reason
    `empty_candidate_base_ref_required`. The committed-range START it asks for is then
    rejected before any native call: with `{"baseRef": <sha of fdba297>,
    "committedOnly": true}` and a fresh `idempotencyKey`, the facade answers
    `Judgment Day graph-v1 START requires lineageId` — an opaque lineage the same `inspect`
    never issues. No lineage was created, nothing was mutated and no reset, recover,
    quarantine or repair is owed; the attempt is not retried, because a second identical
    attempt would be ambient recovery. Phase 9's implementation was therefore reviewed by a
    delegated independent verifier that ran the full suite, `tsc` and the build, and by a
    second one that re-verified the two follow-up fixes.
- **Review size.** Six chained PRs is the mitigation; if PR 1 grows past roughly 600
  changed lines it should be split into "foundation + layout" and "home". PR 2 landed as
  two commits (`87de5a3` logic, `ec1c128` UI) totalling ~2085 added lines; the split is by
  layer, not by review slice, so a reviewer still reads the phase as one change. PR 3 is
  the largest: `8cfb571` and `631473c`, ~2,495 changed lines across 22 files.
- **Pre-existing test flake.** `apps/web/src/features/home/components/home-route.test.tsx`
  uses `findByRole` without an explicit timeout (lines 133 and 150) in the same file that
  scans the whole `src` tree synchronously, while Vitest runs 24 files in parallel. The
  default 1000 ms `asyncUtilTimeout` was observed to expire once. Belongs to phase 4, not
  to this phase; the fix belongs to the phase 10 pass.
- **Image weight.** `banner3-independencia.png` is 629 KB. It will be copied as-is for
  fidelity; compression is a separate, optional follow-up.
- **Font.** Resolved in Phase 0: Poppins (latin 400-800), self-hosted. Inter Variable was
  dead code and has been removed.
- **Repository hygiene.** `local.db` and `.codegraph/` are untracked and `local.db` is not
  in `.gitignore`. A committed SQLite database would be a real accident; `local.db` should
  be ignored. Flagged, not changed, because it is outside this feature.
  (`apps/web/src/routeTree.gen.ts` is generated but *is* tracked, as it should be; an
  earlier note here claimed otherwise and was wrong.)
- **Pre-existing dedup fragility in the related rail.** A rail card adds a unit
  unconditionally, while `quantityLimit` is `0` for a product with no stock. Harmless today
  because the catalogue's minimum stock is 3, and it would only bite if a zero-stock row is
  ever authored. Phase 10.
- **Pre-existing accessibility gap in the rail.** The five rail cards and the detail page's
  primary button all read `Añadir al carrito`; the detail page's own button now carries the
  product name in its accessible name, but the five cards still do not, so a screen-reader
  user cannot tell them apart. The card component belongs to phase 5. Phase 10.
- **The suite is load-sensitive, not single-test flaky.** Running the suite twice in
  parallel produced timeouts in `home-route.test.tsx`, `routes/products.test.tsx` and
  `routes/products_.$productId.test.tsx` alike — two of them untouched by this phase. The
  new route test is heavy (12 tests, ~4-9 s per file) but not uniquely unstable; the real
  defect is that no `vitest` config exists to raise the timeout or bound the pool. Phase 10.
- **Two verification gaps left open.** The document title has no test, and no browser or
  responsive pass was run at the four breakpoints; both are phase 10 work.
- **Scope of `/login`.** The design's "Iniciar sesión" points at the existing scaffold
  route, which is not part of the design. If the user wants a designed login page, that is
  a new feature, not part of this one.
- **The home page has no `h1`.** Phase 10's own accessibility pass caught it through the raw
  server HTML: `/` renders zero `<h1>` (the hero is a carousel region, not a heading). Every
  other route has exactly one. A screen-reader or SEO user landing on the storefront gets no
  page heading. It is a phase 2/4 artifact, not a phase 10 one, and fixing it is a copy and
  layout decision (visible hero heading versus a visually hidden `h1`), so it is recorded
  rather than patched inside the close.

## Phase 10 — close record

The phase plan's own checklist, step by step, with what was actually executed and what was
not. Steps 1 and 2 ran to completion; the rest need a browser and human eyes.

### Step 1 — suite, types, build: run

- `bun run --filter web test` — **52 files / 546 tests green**, run twice in a row (38.4 s and
  19.3 s), no failure and no timeout in either run. The load-sensitivity recorded earlier did
  not reproduce in serial runs.
- `bun run check-types` — the Turbo root task: 7 packages in scope, **5 tasks / 5 successful**
  (4 cached), `web` executing `tsc --noEmit` with no output.
- `bun run --filter web build` — green; the SSR build emits `dist/server/assets/ayuda-*.js`.
- `git status --porcelain --untracked-files=all` empty and `HEAD` unchanged before and after,
  so the checks left nothing behind (`apps/web/dist` and `.turbo` are gitignored).

### Step 2 — render smoke per route: run, automated

The dev server (`bunx vite dev --port 4321`) was fetched with `curl` for all seven routes, so
every marker below was present in **un-executed** server HTML, not injected by JavaScript.

| Route | Status | Server-rendered evidence |
| --- | --- | --- |
| `/` | 200 | hero region, 7 category links, 87 product cards — and **0 `<h1>`** |
| `/products` | 307 → `?sort=rel&page=1` → 200 | `<h1>Todos los productos</h1>`, results section, 12 cards |
| `/products/1` | 200 | product `h1`, `Añadir al carrito` controls |
| `/cart` | 200 | `<h1>Tu carrito</h1>`, exactly 1 `role="status"`, no persisted section |
| `/favoritos` | 200 | `<h1>Tus favoritos</h1>`, exactly 1 `role="status"` |
| `/checkout` | 200 | checkout shell: `h1`, the steps header and 1 `role="status"` |
| `/ayuda` | 200 | `<h1>Centro de ayuda</h1>`, the TOC label, the seven anchors, 7 `details`, 1 `role="status"` |

`/ayuda?tema=pedido` returns exactly one `aria-current="location"`, on `#pedido`;
`/ayuda?tema=pizza` canonicalises to `/ayuda` and marks none, which is the contract: an unknown
topic is stripped, not rejected. The only dev-server error was a pre-existing `ECONNRESET`
during dependency pre-bundling, before any route request; no request produced an SSR error.
The server was killed and the port closed afterwards, with the tree byte-identical.

### Steps 3-7 — owed to a human with a browser

- **3. Responsive pass at 1240 / 1024 / 768 / 480** — not run: no browser harness exists in
  this environment, and jsdom has no layout engine. This also leaves the sticky table of
  contents, the chip rail below 768px and the `py-1` focus-ring room read from CSS semantics.
- **4. Accessibility pass** — partially run, from the raw HTML only: `alt` text, icon-only
  `aria-label`s, the 44px classes and the single-`h1` rule were checked (and the missing home
  `h1` caught), but focus order, keyboard paths through the carousel, sheet, dialogs and tabs,
  and the focus-visible ring are not observable without a browser.
- **5. Reduced-motion pass** — not run: it needs a browser with the preference set. The code
  paths exist (carousel autoplay, rail scrolling, the help deep-link scroll) and two of them
  are unit-tested with the preference mocked, which is not the same as seeing them.
- **6. Persistence pass across reload and two tabs** — not run: needs a browser. The store
  tests cover the persisted shapes; multi-tab sync is untested.
- **7. Visual comparison against each source HTML page** — still impossible: the design
  sources do not exist on this machine or in the git history, as recorded under open risks.
- **8. Record every commit id** — done: the progress log above and the unit tables carry every
  commit of the feature.

### Delivery

On the user's explicit instruction, `feat/storefront` was fast-forwarded into `main`. `main`
was an ancestor (`0 38` divergence) and the repository has no remote configured, so no merge
commit was created and nothing was pushed. The branch tip and the `main` tip are the same
commit, which is this document's last commit.
- **Phase 9 review size.** `fdba297..fd6d184` is 19 code files (8 of them tests), 1,726
  insertions and 7 deletions across three commits, plus the plan document. Smaller than
  phases 7 and 8, and the split is by layer (contract, sections, route) rather than by
  review slice, so PR 6 still reads as one change.
- **The help layout is unpinned by tests.** jsdom has no layout engine, so the sticky travel
  of the table of contents, the chip rail below 768px and the `py-1` added for the focus ring
  are read from CSS semantics plus the `/products` precedent. The responsive pass at phase 10
  step 3 is the only check that can actually see them.
- **Re-clicking the footer link for the current `tema` does not move the marker back.** The
  render-phase sync only fires when the prop changes, so a footer navigation to the topic
  already in `?tema=` leaves a TOC click's selection in place. Same-topic navigation on the
  same page; recorded rather than patched with a scroll listener.
- **The server-painted help page is untested.** The route test mounts the real tree through
  jsdom and exercises the browser path, so the claim that `/ayuda` renders the `h1`, the
  table of contents and the static sections on the server is verified by reading the code.
  `/cart` and `/checkout` are in the same position.
- **The tracking panel's thresholds are fiction by construction.** `TRACKING_STEP_HOURS`
  (4 h / 24 h / 72 h) stands in for a fulfilment API that does not exist; the panel is honest
  about only ever finding the one order in `mc-last-order`, but the four-step timeline is a
  demo model, not a promise about a real courier.
