import { describe, expect, it } from "vitest";

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
