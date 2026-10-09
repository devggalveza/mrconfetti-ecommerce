import { describe, expect, it } from "vitest";

import { MAX_QUANTITY } from "@/lib/constants";

import { products } from "../data/products";
import { SORT_OPTIONS, productsSchema, type Product } from "../schemas/product";
import {
  byBrand,
  byCategory,
  dealsByDiscount,
  dealsOnly,
  discountPercent,
  freeShippingOnly,
  inPriceRange,
  minRating,
  paginate,
  relatedProducts,
  searchProducts,
  sortProducts,
} from "./selectors";

describe("products data", () => {
  it("satisfies the product schema and holds the 36 legacy products", () => {
    const parsed = productsSchema.parse(products);
    expect(parsed).toHaveLength(36);
  });

  it("exposes 12 distinct product images", () => {
    expect(new Set(products.map((product) => product.image)).size).toBe(12);
  });

  // The authored catalogue guarantees 4 or 5 spec rows per product (8 products
  // carry 4 rows and 28 carry 5), so 4 is the real minimum the guard must pin;
  // the old bound of 1 let a regression down to a single row slip through.
  it("fills every product with the extended model fields the detail page needs, with the catalogue minimum of 4 spec rows", () => {
    for (const product of products) {
      expect(Number.isInteger(product.stock)).toBe(true);
      expect(product.stock).toBeGreaterThanOrEqual(0);
      expect(product.specs.length).toBeGreaterThanOrEqual(4);
      expect(product.specs.length).toBeLessThanOrEqual(5);
      expect(product.colors.length).toBeGreaterThanOrEqual(1);
      expect(product.packs).toHaveLength(2);
      expect(product.packs[0]?.extra).toBe(0);
      expect(product.packs[1]?.extra).toBe(19);
      expect(product.customerReviews).toHaveLength(2);
    }
  });

  // The tightest bound the real catalogue supports: the observed maximum gap is
  // 0.2999999999999998 (a featured average of 4.0 behind an aggregate rating of
  // 4.3, products 8 and 32), so 0.3 passes all 36 products while the previous
  // bound of 1 hid a full star of drift.
  it("keeps every featured review average within 0.3 of its aggregate rating (observed max 0.3, at products 8 and 32)", () => {
    for (const product of products) {
      const featured = product.customerReviews;
      const average = featured.reduce((sum, review) => sum + review.rating, 0) / featured.length;
      expect(Math.abs(average - product.rating)).toBeLessThanOrEqual(0.3);
    }
  });

  it("includes a few products below MAX_QUANTITY so the quantity clamp is reachable", () => {
    const lowStock = products.filter((product) => product.stock < MAX_QUANTITY);
    expect(lowStock.length).toBeGreaterThan(0);
    expect(lowStock.length).toBeLessThan(products.length / 2);
  });
});

describe("discountPercent", () => {
  it("rounds the relative discount of a known product", () => {
    expect(discountPercent(products[0])).toBe(25);
  });
});

describe("dealsByDiscount", () => {
  const fixture: Product[] = [
    { ...products[0], id: 3, price: 200, original: 200 },
    { ...products[0], id: 1, price: 100, original: 200 },
    { ...products[0], id: 2, price: 200, original: 200 },
  ];

  it("sorts by discount descending with id ascending as tie-breaker", () => {
    expect(dealsByDiscount(fixture).map((product) => product.id)).toEqual([1, 2, 3]);
  });

  it("does not mutate the input array", () => {
    const before = fixture.map((product) => product.id);
    dealsByDiscount(fixture);
    expect(fixture.map((product) => product.id)).toEqual(before);
  });
});

describe("searchProducts", () => {
  it("matches accented categories from an unaccented query", () => {
    const results = searchProducts(products, "graduacion");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => product.category === "Graduación")).toBe(true);
  });

  it("returns the list unchanged for a blank query", () => {
    expect(searchProducts(products, "   ")).toEqual([...products]);
  });
});

describe("byCategory and byBrand", () => {
  it("treats an empty selection as no filter", () => {
    expect(byCategory(products, [])).toHaveLength(36);
    expect(byBrand(products, [])).toHaveLength(36);
  });

  it("filters by category and brand", () => {
    expect(byCategory(products, ["Globos"])).toHaveLength(6);
    expect(byBrand(products, ["Dulces Selectos"])).toHaveLength(3);
  });
});

describe("range filters", () => {
  it("treats null price bounds as open", () => {
    expect(inPriceRange(products, null, 50).every((product) => product.price <= 50)).toBe(true);
    expect(inPriceRange(products, 300, null).every((product) => product.price >= 300)).toBe(true);
  });

  it("filters by minimum rating, free shipping and deals", () => {
    expect(minRating(products, 4.9).every((product) => product.rating >= 4.9)).toBe(true);
    expect(freeShippingOnly(products, false)).toHaveLength(36);
    expect(freeShippingOnly(products, true).every((product) => product.freeShipping)).toBe(true);
    expect(dealsOnly(products, false)).toHaveLength(36);
    expect(dealsOnly(products, true).every((product) => discountPercent(product) >= 30)).toBe(true);
  });
});

describe("sortProducts", () => {
  const fixture: Product[] = [
    { ...products[0], id: 3, price: 200, original: 200, rating: 4.0 },
    { ...products[0], id: 1, price: 200, original: 200, rating: 5.0 },
    { ...products[0], id: 2, price: 100, original: 200, rating: 4.5 },
  ];

  it("rel keeps the input order", () => {
    expect(sortProducts(fixture, "rel").map((product) => product.id)).toEqual([3, 1, 2]);
  });

  it("pa sorts by price ascending with id tie-break", () => {
    expect(sortProducts(fixture, "pa").map((product) => product.id)).toEqual([2, 1, 3]);
  });

  it("pd sorts by price descending with id tie-break", () => {
    expect(sortProducts(fixture, "pd").map((product) => product.id)).toEqual([1, 3, 2]);
  });

  it("dto sorts by discount descending with id tie-break", () => {
    expect(sortProducts(fixture, "dto").map((product) => product.id)).toEqual([2, 1, 3]);
  });

  it("val sorts by rating descending with id tie-break", () => {
    expect(sortProducts(fixture, "val").map((product) => product.id)).toEqual([1, 2, 3]);
  });

  it("does not mutate the input array", () => {
    const before = fixture.map((product) => product.id);
    sortProducts(fixture, "pa");
    expect(fixture.map((product) => product.id)).toEqual(before);
  });
});

describe("SORT_OPTIONS", () => {
  it("lists the five sort keys with their Spanish labels", () => {
    expect(SORT_OPTIONS).toEqual([
      { value: "rel", label: "Más relevantes" },
      { value: "pa", label: "Precio: menor a mayor" },
      { value: "pd", label: "Precio: mayor a menor" },
      { value: "dto", label: "Mayor descuento" },
      { value: "val", label: "Mejor valorados" },
    ]);
  });
});

describe("relatedProducts", () => {
  const current: Product = { ...products[0], id: 1, category: "Globos", price: 100 };
  const fixture: Product[] = [
    current,
    { ...products[0], id: 2, category: "Globos", price: 101 },
    { ...products[0], id: 7, category: "Decoración", price: 180 },
    { ...products[0], id: 3, category: "Decoración", price: 130 },
    { ...products[0], id: 9, category: "Decoración", price: 100 },
    { ...products[0], id: 4, category: "Decoración", price: 95 },
    { ...products[0], id: 6, category: "Decoración", price: 130 },
    { ...products[0], id: 5, category: "Decoración", price: 96 },
  ];

  it("keeps same-category entries first and fills by price proximity to the current product", () => {
    expect(relatedProducts(fixture, current, 7).map((product) => product.id)).toEqual([
      2, 9, 5, 4, 3, 6, 7,
    ]);
  });

  it("breaks a price-proximity tie by product id ascending", () => {
    expect(relatedProducts(fixture, current, 6).map((product) => product.id)).toEqual([
      2, 9, 5, 4, 3, 6,
    ]);
  });

  it("excludes the current product and never mutates the input", () => {
    const before = fixture.map((product) => product.id);
    const related = relatedProducts(fixture, current, 7);
    expect(related.some((product) => product.id === current.id)).toBe(false);
    expect(fixture.map((product) => product.id)).toEqual(before);
  });

  it("returns an empty list for a zero limit", () => {
    expect(relatedProducts(fixture, current, 0)).toEqual([]);
  });

  it("returns an empty list for a negative limit", () => {
    expect(relatedProducts(fixture, current, -3)).toEqual([]);
  });
});

describe("paginate", () => {
  it("returns the requested page", () => {
    const result = paginate(products, 2, 12);
    expect(result).toMatchObject({ page: 2, totalPages: 3, total: 36, perPage: 12 });
    expect(result.items).toHaveLength(12);
  });

  it("clamps page 0 to the first page", () => {
    expect(paginate(products, 0, 12).page).toBe(1);
  });

  it("clamps an out-of-range page to the last page", () => {
    expect(paginate(products, 999, 12).page).toBe(3);
  });

  it("handles an empty list", () => {
    expect(paginate([], 1, 12)).toEqual({
      items: [],
      page: 1,
      totalPages: 1,
      total: 0,
      perPage: 12,
    });
  });
});
