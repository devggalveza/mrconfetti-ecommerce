# Mr. Confetti — Design System

Phase 0 reference for the storefront. Tokens, type, spacing, layout, surfaces and interaction
rules all live here; anything visual that cannot be traced back to a token in this document is a bug.

## Where tokens live

`apps/web/src/index.css` is the single source of truth.

- Brand and shadcn values are CSS custom properties declared in `:root`, with dark-mode
  counterparts in `.dark`.
- Tailwind v4 reads them through `@theme inline`, which turns `--color-brand` into utilities such
  as `bg-brand` and `text-brand`, and `--radius` into the `rounded-*` scale.
- shadcn/ui components consume the same shadcn variables (`--background`, `--primary`, `--border`,
  `--ring`, ...), so first-party and third-party UI stay on one palette.

**Rule:** components never hard-code a hex value. Reference a Tailwind utility (`bg-surface`,
`text-muted-foreground`, `border-border`) or, when a raw value is unavoidable, `var(--token)`.

## Palette

| Token | Hex | When to use |
| --- | --- | --- |
| `--brand` | `#6e3a8d` | Primary brand purple: CTAs, links, active states, prices on emphasis. |
| `--brand-dark` | `#4f2a66` | Hover/pressed brand, headings on light brand tints. |
| `--brand-soft` | `#f3ecf7` | Brand-tinted backgrounds, badges and filter chips. |
| `--surface` | `#f6f7fa` | Neutral raised/subtle sections and category circles. |
| `--background` | `#ffffff` | Page background. |
| `--foreground` | `#14171f` | Primary text and icons on light surfaces. |
| `--muted-foreground` | `#5b6270` | Secondary text: reviews, SKUs, helper copy. |
| `--border` | `#e3e6ec` | 1px hairlines: inputs, chips, product image frames. |
| `--discount` | `#d8262f` | Discount badges and strike-through original prices. |
| `--success` | `#12805c` | In-stock, free shipping, coupon applied. |
| `--warning` | `#f5a300` | Low stock, delivery caveats. |
| `--highlight` | `#ffd23f` | Promotional accents (e.g. free-shipping banners). |
| `--card` | `#ffffff` | Product and content cards. |
| `--popover` | `#ffffff` | Menus, dropdowns, tooltips. |
| `--primary` | `#6e3a8d` | shadcn primary; matches `--brand`. |
| `--secondary` | `#f6f7fa` | shadcn secondary surfaces; matches `--surface`. |
| `--muted` | `#f6f7fa` | shadcn muted fills. |
| `--accent` | `#f3ecf7` | shadcn accent; matches `--brand-soft`. |
| `--destructive` | `#d8262f` | Errors and destructive actions. |
| `--ring` | `#6e3a8d` | Focus rings (see Interaction). |

`--success-foreground` (`#ffffff`) and `--highlight-foreground` (`#14171f`) are the text colors that
pair with their background tokens.

## Typography

Poppins, self-hosted from the latin subsets of `@fontsource/poppins` (weights 400, 500, 600, 700,
800). The stack is `"Poppins", ui-sans-serif, system-ui, sans-serif`.

| Weight | Use |
| --- | --- |
| 400 | Body copy, descriptions, helper text. |
| 500 | Product titles and navigation items. |
| 600 | Buttons and links. |
| 700 | Section headings. |
| 800 | Hero headlines and price emphasis. |

Never reach for a weight outside this set, and never add a second font family.

## Radius

| Token | Value | Use |
| --- | --- | --- |
| `--radius` (`rounded-lg`) | `0.75rem` / 12px | Default for cards, inputs, buttons. |
| `--radius-sm` (`rounded-sm`) | `calc(var(--radius) - 4px)` / 8px | Small controls, chips. |
| pill | `999px` | Pills, badges, category circles. |

The remaining `rounded-md`/`xl`/`2xl` steps follow the same `--radius` bridge.

## Spacing

The spacing scale in use is **4 / 8 / 16 / 24 / 32 px** (`gap-1`, `gap-2`, `gap-4`, `gap-6`,
`gap-8`). Prefer these steps over arbitrary values.

## Layout

- Max content width **1240px**, centered.
- **16px** gutters on the sides at every breakpoint.
- Product grid: **5 columns** with **16px** gaps at desktop.
- **Announcement bar**: a full-width `--brand` strip with white text, **36px** minimum height,
  sitting above the sticky header. It rotates one message every **5s** and holds the first message
  under `prefers-reduced-motion: reduce`. It is deliberately not sticky: it scrolls away while the
  header stays pinned.

## Surfaces

- **No shadows** anywhere.
- **No container borders.** Sections are separated by background change, not by a line.
- Sections and cards sit on white (`--background` / `--card`).
- The only edges are **1px `--border` hairlines** on inputs, chips and product image frames.
- Category circles use `--surface`.
- **Modals** pad their content by the **24px** step (`p-6`) so no text sits against the border, and
  inset the close control by **16px** (`top-4 right-4`) with the header reserving its 44px box
  (`pr-16`). The dialog's `DialogFooter` bleeds to the edges with `-mx-6 -mb-6` to match.

## Stacking

One documented scale, monotonically increasing. Never reuse a step for two different layers: two nodes
at the same `z-` step resolve by DOM order, which is how an in-card control ends up painting over the
sticky header while scrolling.

| Step | Layer | Examples |
| --- | --- | --- |
| `z-1` | Badges inside an image | Discount badge in the product gallery. |
| `z-10` | Overlays owned by one content block | Card hover overlay, rail arrows, carousel dots. |
| `z-20` | Floating controls inside content | The card's favourite button. |
| `z-30` | Sticky chrome | Site header, checkout header. |
| `z-40` | Fixed viewport CTA | The mobile add-to-cart bar on product detail. |
| `z-50` | Modal overlays | Dialog, alert dialog, sheet, dropdown menu. |

## Interaction

- Every interactive control is at least **44px** in its smallest dimension (touch target).
- Focus is always visible: a ring using `--ring`, never `outline: none` alone.
- `prefers-reduced-motion: reduce` disables autoplay (carousels, marquee) and transitions.

## Breakpoints

| Width | Change |
| --- | --- |
| ≥ 1024px | Full desktop: 5-column product grid, filters in a persistent sidebar. |
| < 1024px | Grid drops to 4 columns; sidebar filters collapse into a toggled panel. |
| < 768px | Grid drops to 3 columns; header condenses to logo + icon actions. |
| < 480px | Grid drops to 2 columns; filters and toolbars stack vertically. |

Gutters stay at 16px at every breakpoint.

## Do not

- Hard-code a hex value, `rgb()`, or `oklch()` in a component.
- Add shadows.
- Add container or section borders.
- Use font weights outside 400/500/600/700/800.
- Add a new font family or a second typeface.
- Encode meaning in color alone — pair color with text or an icon.
