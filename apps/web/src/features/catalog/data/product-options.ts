import type { ProductPack } from "../schemas/product";

/**
 * The purchase options every catalogue product starts from, defined once so the
 * pack table has a single source of truth: the base item at no surcharge first,
 * then the gift-wrap option. Products reference this table through their `packs`
 * field, which keeps the field explicit while leaving each product free to
 * override the options later.
 *
 * The table is frozen and typed as a read-only tuple because all 36 products
 * alias this one instance: the compiler rejects `packs.push(...)` and the
 * runtime throws on it, so an in-place mutation cannot corrupt the whole
 * catalogue at once.
 */
export const PRODUCT_PACKS = Object.freeze([
  { name: "Producto solo", extra: 0 },
  { name: "Con envoltorio de regalo", extra: 19 },
] as const satisfies readonly ProductPack[]);

/** A single purchase option drawn from {@link PRODUCT_PACKS}. */
export type ProductPackOption = (typeof PRODUCT_PACKS)[number];
