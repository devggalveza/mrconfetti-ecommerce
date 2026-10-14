import type { Product } from "@/features/catalog/schemas/product";
import { applyCoupon, type Coupon } from "@/lib/coupons";
import {
  DEFAULT_SHIPPING_METHOD,
  FREE_SHIPPING_FROM,
  SHIPPING_METHOD_PRICES,
  type ShippingMethod,
} from "@/lib/constants";
import { roundMoney } from "@/lib/format";

import { countUnits, type CartLine } from "./cart-lines";

/** One cart line joined to its catalogue product, with pre-discount amounts. */
export type CartItem = {
  product: Product;
  quantity: number;
  /** `roundMoney(product.price)`. */
  unitPrice: number;
  /** `roundMoney(unitPrice * quantity)`, before any coupon discount. */
  lineSubtotal: number;
};

/** Every amount the cart and checkout screens render, derived in one place. */
export type CartTotals = {
  items: CartItem[];
  units: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  freeShippingApplied: boolean;
  freeShippingRemaining: number;
  /** Fraction of the free-shipping threshold covered, in `0..1`. */
  freeShippingProgress: number;
};

/**
 * Joins cart lines to catalogue products, preserving line order and silently
 * dropping lines whose id is not in the catalogue, so stale persisted state
 * never produces a phantom item.
 */
export function cartItems(lines: readonly CartLine[], products: readonly Product[]): CartItem[] {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const items: CartItem[] = [];
  for (const line of lines) {
    const product = productsById.get(line.id);
    if (product === undefined) {
      continue;
    }
    const unitPrice = roundMoney(product.price);
    items.push({
      product,
      quantity: line.quantity,
      unitPrice,
      lineSubtotal: roundMoney(unitPrice * line.quantity),
    });
  }
  return items;
}

/**
 * Composes every cart amount from the lines, the catalogue and the applied
 * coupon. Per-line amounts stay pre-discount; the coupon discount is reported
 * once at the summary level.
 */
export function computeTotals(
  lines: readonly CartLine[],
  products: readonly Product[],
  coupon: Coupon | null,
  method: ShippingMethod = DEFAULT_SHIPPING_METHOD,
): CartTotals {
  const knownIds = new Set(products.map((product) => product.id));
  const knownLines = lines.filter((line) => knownIds.has(line.id));
  const items = cartItems(knownLines, products);
  const units = countUnits(knownLines);

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineSubtotal, 0));
  const discount = roundMoney(applyCoupon(subtotal, coupon));

  const isEmpty = items.length === 0;
  const everyItemShipsFree = items.length > 0 && items.every((item) => item.product.freeShipping);
  const reachedThreshold = subtotal >= FREE_SHIPPING_FROM;
  // Qualification is a property of the cart, independent of the selected method.
  const qualifiesForFreeShipping = reachedThreshold || everyItemShipsFree;
  // Only the standard method is waived by qualification; express and pickup are
  // premium services the customer explicitly buys.
  const shipping =
    isEmpty || (qualifiesForFreeShipping && method === "standard")
      ? 0
      : roundMoney(SHIPPING_METHOD_PRICES[method]);

  const freeShippingApplied = !isEmpty && shipping === 0 && method === "standard";
  const freeShippingRemaining = qualifiesForFreeShipping
    ? 0
    : Math.max(0, roundMoney(FREE_SHIPPING_FROM - subtotal));
  const freeShippingProgress = qualifiesForFreeShipping
    ? 1
    : Math.min(1, subtotal / FREE_SHIPPING_FROM);

  const total = roundMoney(subtotal - discount + shipping);

  return {
    items,
    units,
    subtotal,
    discount,
    shipping,
    total,
    freeShippingApplied,
    freeShippingRemaining,
    freeShippingProgress,
  };
}
