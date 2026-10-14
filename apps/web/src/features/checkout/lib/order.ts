import type { CartLine } from "@/features/cart/lib/cart-lines";
import type { CartTotals } from "@/features/cart/lib/totals";
import type { Product } from "@/features/catalog/schemas/product";
import type { LastOrder } from "@/stores/orders-store";

/**
 * The single source of the order-reference format; `createOrderRef` must keep matching it.
 * Non-global and case-sensitive: consumers normalize their input before testing.
 */
export const ORDER_REF_PATTERN = /^MC-[0-9A-Z]+$/;

/**
 * Builds an order reference from an injected instant. It is deterministic for
 * tests and unique enough per order at millisecond granularity.
 */
export function createOrderRef(now: Date): string {
  return `MC-${now.getTime().toString(36).toUpperCase()}`;
}

/**
 * Assembles the persisted last order from the cart, the catalogue and the
 * already-computed totals. Cart lines with an unknown product are dropped,
 * mirroring the totals module, and the line order is preserved.
 */
export function buildLastOrder(input: {
  lines: readonly CartLine[];
  products: readonly Product[];
  totals: CartTotals;
  email: string;
  now: Date;
}): LastOrder {
  const knownIds = new Set(input.products.map((product) => product.id));
  const items = input.lines
    .filter((line) => knownIds.has(line.id))
    .map((line) => ({ id: line.id, quantity: line.quantity }));

  return {
    ref: createOrderRef(input.now),
    total: input.totals.total,
    items,
    email: input.email,
    date: input.now.toISOString(),
  };
}
