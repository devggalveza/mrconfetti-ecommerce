import { describe, expect, it } from "vitest";

import { PRODUCT_PACKS } from "@/features/catalog/data/product-options";
import type { Product } from "@/features/catalog/schemas/product";
import { COUPONS } from "@/lib/coupons";
import {
  DEFAULT_SHIPPING_METHOD,
  EXPRESS_SHIPPING_PRICE,
  FREE_SHIPPING_FROM,
  PICKUP_SHIPPING_PRICE,
  SHIPPING_METHOD_PRICES,
  STANDARD_SHIPPING_PRICE,
} from "@/lib/constants";

import type { CartLine } from "./cart-lines";
import { cartItems, computeTotals } from "./totals";

/** A complete catalogue product whose money/shipping fields each test overrides. */
function makeProduct(overrides: Partial<Product> & { id: number }): Product {
  return {
    name: "Producto de prueba",
    description: "Descripción del producto de prueba.",
    highlights: ["Uno.", "Dos.", "Tres.", "Cuatro."],
    category: "Globos",
    brand: "Mr. Confetti",
    price: 10,
    original: 20,
    rating: 4.5,
    reviews: 10,
    freeShipping: false,
    image: "/products/p01.webp",
    width: 100,
    height: 100,
    stock: 12,
    specs: [{ label: "Material", value: "Látex" }],
    colors: [{ name: "Rojo", hex: "#ff0000" }],
    packs: PRODUCT_PACKS,
    customerReviews: [{ author: "Ana", rating: 5, date: "2024-01-01", body: "Bien." }],
    ...overrides,
  };
}

const line = (id: number, quantity: number): CartLine => ({ id, quantity });

const paid = makeProduct({ id: 1, price: 10, freeShipping: false });
const otherPaid = makeProduct({ id: 2, price: 20.5, freeShipping: false });
const free = makeProduct({ id: 3, price: 5, freeShipping: true });
const catalog = [paid, otherPaid, free];

describe("cartItems", () => {
  it("preserves the line order when joining products", () => {
    const items = cartItems([line(2, 1), line(1, 2)], catalog);
    expect(items.map((item) => item.product.id)).toEqual([2, 1]);
    expect(items[0]).toMatchObject({ quantity: 1, unitPrice: 20.5, lineSubtotal: 20.5 });
    expect(items[1]).toMatchObject({ quantity: 2, unitPrice: 10, lineSubtotal: 20 });
  });

  it("silently drops lines whose product is not in the catalog", () => {
    const items = cartItems([line(1, 1), line(99, 3)], catalog);
    expect(items).toHaveLength(1);
    expect(items[0]?.product.id).toBe(1);
  });

  it("rounds the unit price and the line subtotal through roundMoney", () => {
    const rounded = makeProduct({ id: 9, price: 5.555 });
    const [item] = cartItems([line(9, 1)], [rounded]);
    expect(item?.unitPrice).toBe(5.56);
    expect(item?.lineSubtotal).toBe(5.56);
  });
});

describe("computeTotals", () => {
  it("returns a zeroed, non-applied result for an empty cart", () => {
    expect(computeTotals([], catalog, null)).toEqual({
      items: [],
      units: 0,
      subtotal: 0,
      discount: 0,
      shipping: 0,
      total: 0,
      freeShippingApplied: false,
      freeShippingRemaining: FREE_SHIPPING_FROM,
      freeShippingProgress: 0,
    });
  });

  it("sums the units of the known lines", () => {
    const totals = computeTotals([line(1, 2), line(2, 3)], catalog, null);
    expect(totals.units).toBe(5);
  });

  it("ignores unknown lines when summing units", () => {
    const totals = computeTotals([line(1, 2), line(99, 4)], catalog, null);
    expect(totals.units).toBe(2);
  });

  it("rounds the subtotal of a floating-point sum", () => {
    const a = makeProduct({ id: 1, price: 0.1 });
    const b = makeProduct({ id: 2, price: 0.2 });
    const totals = computeTotals([line(1, 1), line(2, 1)], [a, b], null);
    expect(totals.subtotal).toBe(0.3);
  });

  it("applies a percent coupon to the subtotal", () => {
    const totals = computeTotals([line(1, 10)], [paid], COUPONS.EMOX10);
    expect(totals.subtotal).toBe(100);
    expect(totals.discount).toBe(10);
    expect(totals.total).toBe(90);
  });

  it("clamps an amount coupon to a smaller subtotal", () => {
    const small = makeProduct({ id: 4, price: 3 });
    const totals = computeTotals([line(4, 1)], [small], COUPONS.BIENVENIDO);
    expect(totals.subtotal).toBe(3);
    expect(totals.discount).toBe(3);
    expect(totals.shipping).toBe(STANDARD_SHIPPING_PRICE);
    expect(totals.total).toBe(STANDARD_SHIPPING_PRICE);
  });

  it("ships free once the subtotal reaches the threshold", () => {
    const totals = computeTotals([line(1, 5)], [paid], null);
    expect(totals.subtotal).toBe(50);
    expect(totals.shipping).toBe(0);
    expect(totals.freeShippingApplied).toBe(true);
    expect(totals.freeShippingRemaining).toBe(0);
    expect(totals.freeShippingProgress).toBe(1);
    expect(totals.total).toBe(50);
  });

  it("ships free when every item ships free, even below the threshold", () => {
    const totals = computeTotals([line(3, 1)], [free], null);
    expect(totals.subtotal).toBe(5);
    expect(totals.shipping).toBe(0);
    expect(totals.freeShippingApplied).toBe(true);
    expect(totals.freeShippingRemaining).toBe(0);
    expect(totals.freeShippingProgress).toBe(1);
  });

  it("charges standard shipping when a paid item is mixed in", () => {
    const totals = computeTotals([line(3, 1), line(1, 1)], [free, paid], null);
    expect(totals.shipping).toBe(STANDARD_SHIPPING_PRICE);
    expect(totals.freeShippingApplied).toBe(false);
  });

  it("charges standard shipping below the threshold", () => {
    const totals = computeTotals([line(1, 3)], [paid], null);
    expect(totals.subtotal).toBe(30);
    expect(totals.shipping).toBe(STANDARD_SHIPPING_PRICE);
    expect(totals.freeShippingApplied).toBe(false);
    expect(totals.freeShippingRemaining).toBe(20);
    expect(totals.freeShippingProgress).toBe(0.6);
  });

  it("composes the total from subtotal, discount and shipping", () => {
    const totals = computeTotals([line(1, 3)], [paid], COUPONS.EMOX10);
    expect(totals.subtotal).toBe(30);
    expect(totals.discount).toBe(3);
    expect(totals.shipping).toBe(STANDARD_SHIPPING_PRICE);
    expect(totals.total).toBe(31.95);
  });

  it("keeps per-line amounts pre-discount", () => {
    const totals = computeTotals([line(1, 3)], [paid], COUPONS.EMOX10);
    expect(totals.items[0]?.lineSubtotal).toBe(30);
    expect(totals.items[0]).not.toHaveProperty("discount");
    expect(totals.items[0]).not.toHaveProperty("total");
  });

  it("prices each shipping method from the shared table", () => {
    expect(SHIPPING_METHOD_PRICES.standard).toBe(STANDARD_SHIPPING_PRICE);
    expect(SHIPPING_METHOD_PRICES.express).toBe(EXPRESS_SHIPPING_PRICE);
    expect(SHIPPING_METHOD_PRICES.pickup).toBe(PICKUP_SHIPPING_PRICE);
    expect(DEFAULT_SHIPPING_METHOD).toBe("standard");
  });

  it("ships an empty cart for zero with any method", () => {
    const totals = computeTotals([], catalog, null, "express");
    expect(totals.shipping).toBe(0);
    expect(totals.freeShippingApplied).toBe(false);
  });

  it("treats an explicit standard method as the default", () => {
    expect(computeTotals([line(1, 5)], [paid], null, "standard")).toEqual(
      computeTotals([line(1, 5)], [paid], null),
    );
  });

  it("charges the express price below the threshold and keeps the qualification numbers", () => {
    const totals = computeTotals([line(1, 3)], [paid], null, "express");
    expect(totals.subtotal).toBe(30);
    expect(totals.shipping).toBe(EXPRESS_SHIPPING_PRICE);
    expect(totals.freeShippingApplied).toBe(false);
    expect(totals.freeShippingRemaining).toBe(20);
    expect(totals.freeShippingProgress).toBe(0.6);
    expect(totals.total).toBe(37.95);
  });

  it("still charges express above the threshold and reports no free shipping", () => {
    const totals = computeTotals([line(1, 5)], [paid], null, "express");
    expect(totals.subtotal).toBe(50);
    expect(totals.shipping).toBe(EXPRESS_SHIPPING_PRICE);
    expect(totals.freeShippingApplied).toBe(false);
    expect(totals.freeShippingRemaining).toBe(0);
    expect(totals.freeShippingProgress).toBe(1);
    expect(totals.total).toBe(57.95);
  });

  it("charges the pickup price below the threshold", () => {
    const totals = computeTotals([line(1, 3)], [paid], null, "pickup");
    expect(totals.subtotal).toBe(30);
    expect(totals.shipping).toBe(PICKUP_SHIPPING_PRICE);
    expect(totals.freeShippingApplied).toBe(false);
    expect(totals.freeShippingRemaining).toBe(20);
    expect(totals.freeShippingProgress).toBe(0.6);
    expect(totals.total).toBe(32.95);
  });

  it("still charges pickup above the threshold", () => {
    const totals = computeTotals([line(1, 5)], [paid], null, "pickup");
    expect(totals.subtotal).toBe(50);
    expect(totals.shipping).toBe(PICKUP_SHIPPING_PRICE);
    expect(totals.freeShippingApplied).toBe(false);
    expect(totals.total).toBe(52.95);
  });

  it("still charges express for an all-free cart", () => {
    const totals = computeTotals([line(3, 1)], [free], null, "express");
    expect(totals.shipping).toBe(EXPRESS_SHIPPING_PRICE);
    expect(totals.freeShippingApplied).toBe(false);
  });
});
