import { describe, expect, it } from "vitest";

import { PRODUCT_PACKS } from "@/features/catalog/data/product-options";
import type { Product } from "@/features/catalog/schemas/product";
import type { CartLine } from "@/features/cart/lib/cart-lines";
import { computeTotals } from "@/features/cart/lib/totals";

import { ORDER_REF_PATTERN, buildLastOrder, createOrderRef } from "./order";

/** A complete catalogue product whose id and price each test controls. */
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

const paid = makeProduct({ id: 1, price: 10 });
const otherPaid = makeProduct({ id: 2, price: 20.5 });
const catalog = [paid, otherPaid];

describe("createOrderRef", () => {
  it("is deterministic from the injected date alone", () => {
    const now = new Date(2026, 0, 15, 10, 30, 0);
    expect(createOrderRef(now)).toBe(createOrderRef(new Date(2026, 0, 15, 10, 30, 0)));
  });

  it("differs for two different instants", () => {
    const first = new Date(2026, 0, 15, 10, 30, 0);
    const second = new Date(2026, 0, 15, 10, 30, 1);
    expect(createOrderRef(first)).not.toBe(createOrderRef(second));
  });

  it("returns a non-empty reference", () => {
    expect(createOrderRef(new Date(2026, 0, 15))).toMatch(/\S/);
  });
});

describe("ORDER_REF_PATTERN", () => {
  it("matches a reference built by createOrderRef", () => {
    expect(ORDER_REF_PATTERN.test(createOrderRef(new Date(2026, 0, 15, 10, 30, 0)))).toBe(true);
  });

  it("stays non-global and case-sensitive, as its consumer expects", () => {
    expect(ORDER_REF_PATTERN.global).toBe(false);
    expect(ORDER_REF_PATTERN.test("mc-1abc")).toBe(false);
  });
});

describe("buildLastOrder", () => {
  it("joins the lines to their products and preserves the order", () => {
    const lines = [line(2, 1), line(1, 3)];
    const totals = computeTotals(lines, catalog, null);
    const order = buildLastOrder({
      lines,
      products: catalog,
      totals,
      email: "ana@example.com",
      now: new Date(2026, 0, 15, 10, 30, 0),
    });
    expect(order.items).toEqual([
      { id: 2, quantity: 1 },
      { id: 1, quantity: 3 },
    ]);
  });

  it("drops lines whose product is not in the catalogue", () => {
    const lines = [line(1, 1), line(99, 4)];
    const totals = computeTotals(lines, catalog, null);
    const order = buildLastOrder({
      lines,
      products: catalog,
      totals,
      email: "ana@example.com",
      now: new Date(2026, 0, 15),
    });
    expect(order.items).toEqual([{ id: 1, quantity: 1 }]);
  });

  it("takes the total from the computed totals, not from a recomputation", () => {
    const lines = [line(1, 3)];
    const totals = computeTotals(lines, catalog, null);
    const order = buildLastOrder({
      lines,
      products: catalog,
      totals,
      email: "ana@example.com",
      now: new Date(2026, 0, 15),
    });
    expect(order.total).toBe(totals.total);
  });

  it("uses the ref derived from now and the ISO date of now", () => {
    const now = new Date(2026, 0, 15, 10, 30, 0);
    const lines = [line(1, 1)];
    const totals = computeTotals(lines, catalog, null);
    const order = buildLastOrder({
      lines,
      products: catalog,
      totals,
      email: "ana@example.com",
      now,
    });
    expect(order.ref).toBe(createOrderRef(now));
    expect(order.date).toBe(now.toISOString());
  });

  it("carries the buyer e-mail", () => {
    const lines = [line(1, 1)];
    const totals = computeTotals(lines, catalog, null);
    const order = buildLastOrder({
      lines,
      products: catalog,
      totals,
      email: "ana@example.com",
      now: new Date(2026, 0, 15),
    });
    expect(order.email).toBe("ana@example.com");
  });

  it("is deterministic for the same inputs", () => {
    const lines = [line(1, 2)];
    const totals = computeTotals(lines, catalog, null);
    const input = {
      lines,
      products: catalog,
      totals,
      email: "ana@example.com",
      now: new Date(2026, 0, 15, 10, 30, 0),
    };
    expect(buildLastOrder(input)).toEqual(buildLastOrder(input));
  });
});
