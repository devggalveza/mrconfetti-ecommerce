import { describe, expect, it } from "vitest";

import { MAX_QUANTITY } from "@/lib/constants";

import * as productDetailContent from "../data/product-detail-content";
import { PRODUCT_PACKS } from "../data/product-options";
import { products } from "../data/products";
import { productSchema, type Product, type ProductPack } from "../schemas/product";
import {
  deliveryEstimate,
  instalments,
  priceWithPack,
  quantityLimit,
  reviewDistribution,
} from "./product-detail";
import { relatedProducts } from "./selectors";

/** A minimal product that satisfies every field this unit adds to the model. */
function extendedProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 999,
    name: "Producto de prueba",
    category: "Globos",
    brand: "Mr. Confetti",
    price: 100,
    original: 150,
    rating: 4.5,
    reviews: 40,
    freeShipping: true,
    image: "/products/p01.webp",
    width: 100,
    height: 100,
    stock: 12,
    specs: [{ label: "Material", value: "Látex natural" }],
    colors: [{ name: "Morado", hex: "#6e3a8d" }],
    packs: [
      { name: "Producto solo", extra: 0 },
      { name: "Con envoltorio de regalo", extra: 19 },
    ],
    description: "Globos de látex para una fiesta completa.",
    highlights: [
      "Rinde para un arco completo.",
      "El látex aguanta toda la jornada.",
      "Incluye cinta y bomba.",
      "Combina con la mesa dulce.",
    ],
    customerReviews: [
      { author: "Ana Lucía R.", rating: 5, date: "2024-09-12", body: "Excelente calidad." },
    ],
    ...overrides,
  };
}

/**
 * A runtime-only mutable view of {@link PRODUCT_PACKS}. The exported table is
 * typed read-only, so this cast is confined to the tests: it is what lets the
 * forbidden in-place mutation be attempted and observed to throw at runtime.
 */
function mutablePacksView(): ProductPack[] {
  return PRODUCT_PACKS as unknown as ProductPack[];
}

/** `count` copies of a valid featured review, for the aggregate-count invariant. */
function featuredReviews(count: number) {
  return Array.from({ length: count }, () => ({
    author: "Ana Lucía R.",
    rating: 5,
    date: "2024-09-12",
    body: "Excelente calidad.",
  }));
}

describe("extended productSchema", () => {
  it("accepts a product with stock, specs, colors, packs and featured reviews", () => {
    const parsed = productSchema.parse(extendedProduct());
    expect(parsed.stock).toBe(12);
    expect(parsed.specs).toHaveLength(1);
    expect(parsed.colors).toHaveLength(1);
    expect(parsed.packs).toHaveLength(2);
    expect(parsed.customerReviews).toHaveLength(1);
  });

  it("accepts an uppercase colour hex", () => {
    expect(
      productSchema.safeParse(extendedProduct({ colors: [{ name: "Morado", hex: "#6E3A8D" }] }))
        .success,
    ).toBe(true);
  });

  it("rejects a colour hex that is not six hex digits", () => {
    for (const hex of ["#GGGGGG", "#6e3a8dff", "6e3a8d", "#6e3a8"]) {
      expect(productSchema.safeParse(extendedProduct({ colors: [{ name: "Morado", hex }] })).success).toBe(false);
    }
  });

  it("rejects an empty spec label or value", () => {
    expect(productSchema.safeParse(extendedProduct({ specs: [{ label: "", value: "Látex" }] })).success).toBe(false);
    expect(productSchema.safeParse(extendedProduct({ specs: [{ label: "Material", value: "" }] })).success).toBe(false);
  });

  it("rejects an empty specs list", () => {
    expect(productSchema.safeParse(extendedProduct({ specs: [] })).success).toBe(false);
  });

  it("rejects negative or fractional stock", () => {
    expect(productSchema.safeParse(extendedProduct({ stock: -1 })).success).toBe(false);
    expect(productSchema.safeParse(extendedProduct({ stock: 2.5 })).success).toBe(false);
  });

  it("rejects empty colors, packs and customerReviews lists", () => {
    expect(productSchema.safeParse(extendedProduct({ colors: [] })).success).toBe(false);
    expect(productSchema.safeParse(extendedProduct({ packs: [] })).success).toBe(false);
    expect(productSchema.safeParse(extendedProduct({ customerReviews: [] })).success).toBe(false);
  });

  it("rejects featured reviews that outnumber the aggregate review count", () => {
    expect(
      productSchema.safeParse(
        extendedProduct({ reviews: 1, customerReviews: featuredReviews(2) }),
      ).success,
    ).toBe(false);
  });

  it("accepts featured reviews equal to the aggregate review count", () => {
    expect(
      productSchema.safeParse(
        extendedProduct({ reviews: 2, customerReviews: featuredReviews(2) }),
      ).success,
    ).toBe(true);
  });

  it("rejects a negative pack surcharge", () => {
    expect(
      productSchema.safeParse(
        extendedProduct({ packs: [{ name: "Producto solo", extra: -1 }] }),
      ).success,
    ).toBe(false);
  });

  it("rejects a review rating outside 1..5 or that is not an integer", () => {
    for (const rating of [0, 6, 4.5]) {
      expect(
        productSchema.safeParse(
          extendedProduct({
            customerReviews: [{ author: "Ana", rating, date: "2024-09-12", body: "Ok" }],
          }),
        ).success,
      ).toBe(false);
    }
  });

  it("rejects a review date that is not ISO YYYY-MM-DD", () => {
    expect(
      productSchema.safeParse(
        extendedProduct({
          customerReviews: [{ author: "Ana", rating: 5, date: "12/09/2024", body: "Ok" }],
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects an empty description", () => {
    expect(productSchema.safeParse(extendedProduct({ description: "" })).success).toBe(false);
  });

  it("rejects an empty highlights list or an empty highlight", () => {
    expect(productSchema.safeParse(extendedProduct({ highlights: [] })).success).toBe(false);
    expect(productSchema.safeParse(extendedProduct({ highlights: [""] })).success).toBe(false);
  });

  it("accepts a valid description and highlights list", () => {
    const parsed = productSchema.parse(extendedProduct());
    expect(parsed.description).toBe("Globos de látex para una fiesta completa.");
    expect(parsed.highlights).toHaveLength(4);
  });

  it("rejects an empty review author or body", () => {
    expect(
      productSchema.safeParse(
        extendedProduct({
          customerReviews: [{ author: "", rating: 5, date: "2024-09-12", body: "Ok" }],
        }),
      ).success,
    ).toBe(false);
    expect(
      productSchema.safeParse(
        extendedProduct({
          customerReviews: [{ author: "Ana", rating: 5, date: "2024-09-12", body: "" }],
        }),
      ).success,
    ).toBe(false);
  });
});

describe("reviewDistribution", () => {
  const ratings = [5, 4.9, 4.6, 4, 3.3, 2.5, 1, 0];

  it("returns five integer percentages that sum to exactly 100", () => {
    for (const rating of ratings) {
      const buckets = reviewDistribution(rating, 128);
      expect(buckets).toHaveLength(5);
      expect(buckets.every((value) => Number.isInteger(value) && value >= 0)).toBe(true);
      expect(buckets.reduce((sum, value) => sum + value, 0)).toBe(100);
    }
  });

  it("puts the whole mass on five stars for a perfect rating", () => {
    expect(reviewDistribution(5, 128)).toEqual([100, 0, 0, 0, 0]);
  });

  it("puts the whole mass on one star for a zero rating", () => {
    expect(reviewDistribution(0, 128)).toEqual([0, 0, 0, 0, 100]);
  });

  it("is uniform for the neutral rating of 3.0", () => {
    expect(reviewDistribution(3, 128)).toEqual([20, 20, 20, 20, 20]);
  });

  it("returns all zeros when there are no reviews to distribute", () => {
    expect(reviewDistribution(4.6, 0)).toEqual([0, 0, 0, 0, 0]);
  });

  it("is deterministic and skews the top bucket with the aggregate rating", () => {
    const high = reviewDistribution(4.6, 128);
    expect(reviewDistribution(4.6, 128)).toEqual(high);
    const low = reviewDistribution(3.3, 128);
    expect(high[0]).toBeGreaterThan(low[0] ?? 0);
    expect(high[0]).toBeGreaterThan(50);
  });

  it("caps a rating above five at the whole five-star bucket", () => {
    expect(reviewDistribution(5.5, 128)).toEqual([100, 0, 0, 0, 0]);
    expect(reviewDistribution(6, 128)).toEqual([100, 0, 0, 0, 0]);
  });

  it("floors a rating below one at the whole one-star bucket", () => {
    expect(reviewDistribution(0.5, 128)).toEqual([0, 0, 0, 0, 100]);
    expect(reviewDistribution(-1, 128)).toEqual([0, 0, 0, 0, 100]);
  });

  it("pins a NaN rating to the one-star bucket documented as the non-finite fallback", () => {
    expect(reviewDistribution(Number.NaN, 128)).toEqual([0, 0, 0, 0, 100]);
  });

  it("returns all zeros for a zero or negative aggregate count", () => {
    expect(reviewDistribution(4.6, 0)).toEqual([0, 0, 0, 0, 0]);
    expect(reviewDistribution(4.6, -5)).toEqual([0, 0, 0, 0, 0]);
  });
});

describe("instalments", () => {
  it("splits a price into rounded cents per instalment", () => {
    expect(instalments(389, 3)).toBe(129.67);
    expect(instalments(120, 3)).toBe(40);
    expect(instalments(100, 3)).toBe(33.33);
  });

  it("clamps a zero or negative count to a single instalment", () => {
    expect(instalments(120, 0)).toBe(120);
    expect(instalments(120, -3)).toBe(120);
  });

  it("truncates a fractional count toward zero before dividing", () => {
    expect(instalments(100, 2.9)).toBe(50);
    expect(instalments(100, 3.9)).toBe(33.33);
  });
});

describe("shared product packs", () => {
  it("gives every product the same two purchase options as the shared table", () => {
    expect(PRODUCT_PACKS).toHaveLength(2);
    expect(PRODUCT_PACKS[0]).toEqual({ name: "Producto solo", extra: 0 });
    expect(PRODUCT_PACKS[1]).toEqual({ name: "Con envoltorio de regalo", extra: 19 });
    for (const product of products) {
      expect(product.packs).toHaveLength(2);
      expect(product.packs[0]).toEqual({ name: "Producto solo", extra: 0 });
      expect(product.packs[1]).toEqual({ name: "Con envoltorio de regalo", extra: 19 });
    }
  });

  it("wires every product to the one shared table instead of an inlined copy", () => {
    for (const product of products) {
      expect(product.packs).toBe(PRODUCT_PACKS);
    }
  });

  it("freezes the shared table so one product cannot corrupt the other 35 in place", () => {
    expect(Object.isFrozen(PRODUCT_PACKS)).toBe(true);
    expect(Object.isFrozen(products[0]?.packs)).toBe(true);

    const runtimeView = mutablePacksView();
    expect(() => runtimeView.push({ name: "Extra", extra: 5 })).toThrow(TypeError);
    expect(() => {
      runtimeView[1] = { name: "Otro", extra: 25 };
    }).toThrow(TypeError);

    expect(PRODUCT_PACKS).toHaveLength(2);
    for (const product of products) {
      expect(product.packs).toHaveLength(2);
      expect(product.packs[1]).toEqual({ name: "Con envoltorio de regalo", extra: 19 });
    }
  });
});

describe("priceWithPack", () => {
  const product = products[0];
  const basePack = product.packs[0] ?? { name: "Producto solo", extra: 0 };
  const giftPack = product.packs[1] ?? { name: "Con envoltorio de regalo", extra: 19 };

  it("adds the pack surcharge to the base price", () => {
    expect(priceWithPack(product, giftPack)).toBe(product.price + 19);
  });

  it("leaves the base pack at the base price", () => {
    expect(priceWithPack(product, basePack)).toBe(product.price);
  });
});

describe("deliveryEstimate", () => {
  const wednesday = new Date("2024-10-02T12:00:00Z");
  const saturday = new Date("2024-10-05T12:00:00Z");
  const sunday = new Date("2024-10-06T12:00:00Z");

  it("promises the next day for free shipping on a weekday", () => {
    expect(deliveryEstimate(wednesday, true)).toBe("Recíbelo el jueves 3 de octubre");
  });

  it("waits one more day for paid shipping on a weekday", () => {
    expect(deliveryEstimate(wednesday, false)).toBe("Recíbelo el viernes 4 de octubre");
  });

  it("never promises a Sunday", () => {
    expect(deliveryEstimate(saturday, true)).toBe("Recíbelo el lunes 7 de octubre");
    expect(deliveryEstimate(saturday, false)).toBe("Recíbelo el lunes 7 de octubre");
    expect(deliveryEstimate(sunday, true)).toBe("Recíbelo el lunes 7 de octubre");
    expect(deliveryEstimate(sunday, false)).toBe("Recíbelo el martes 8 de octubre");
  });

  it("crosses a month boundary with the exact Spanish date", () => {
    expect(deliveryEstimate(new Date("2024-10-31T12:00:00Z"), true)).toBe(
      "Recíbelo el viernes 1 de noviembre",
    );
  });

  it("renders the leap-year February 29th", () => {
    expect(deliveryEstimate(new Date("2024-02-28T12:00:00Z"), true)).toBe(
      "Recíbelo el jueves 29 de febrero",
    );
  });

  it("crosses a year boundary with the exact Spanish date", () => {
    expect(deliveryEstimate(new Date("2024-12-31T12:00:00Z"), true)).toBe(
      "Recíbelo el miércoles 1 de enero",
    );
  });
});

describe("catalogue detail content", () => {
  it("covers all 36 products", () => {
    expect(products).toHaveLength(36);
  });

  it("gives every product a non-empty, unique description", () => {
    const descriptions = products.map((product) => product.description);
    for (const description of descriptions) {
      expect(description.trim().length).toBeGreaterThan(0);
    }
    expect(new Set(descriptions).size).toBe(products.length);
  });

  it("gives every product exactly four non-empty highlights ending in a period", () => {
    for (const product of products) {
      expect(product.highlights).toHaveLength(4);
      for (const highlight of product.highlights) {
        expect(highlight.trim().length).toBeGreaterThan(0);
        expect(highlight.endsWith(".")).toBe(true);
      }
    }
  });

  it("keeps every highlight array distinct", () => {
    const signatures = products.map((product) => product.highlights.join("|"));
    expect(new Set(signatures).size).toBe(products.length);
  });
});

describe("quantityLimit", () => {
  const product = products[0];

  it("returns zero when the product has no stock", () => {
    expect(quantityLimit({ ...product, stock: 0 })).toBe(0);
  });

  it("returns zero for a negative stock", () => {
    expect(quantityLimit({ ...product, stock: -4 })).toBe(0);
  });

  it("uses the units on hand when the stock is below the ceiling", () => {
    expect(quantityLimit({ ...product, stock: 3 })).toBe(3);
  });

  it("uses the ceiling when the stock equals it", () => {
    expect(quantityLimit({ ...product, stock: MAX_QUANTITY })).toBe(MAX_QUANTITY);
  });

  it("caps a stock above the ceiling", () => {
    expect(quantityLimit({ ...product, stock: MAX_QUANTITY + 40 })).toBe(MAX_QUANTITY);
  });
});

describe("relatedProducts", () => {
  it("lists same-category products first and excludes the current one", () => {
    const current = products[0];
    const related = relatedProducts(products, current, 5);
    expect(related).toHaveLength(5);
    expect(related.every((product) => product.id !== current.id)).toBe(true);
    expect(related[0]?.category).toBe(current.category);
    expect(related[1]?.category).toBe(current.category);
    expect(related.slice(2).every((product) => product.category !== current.category)).toBe(true);
  });

  it("fills the limit from the rest of the catalogue when the category is too small", () => {
    const fixture: Product[] = [
      { ...products[0], id: 1, category: "Decoración" },
      { ...products[0], id: 2, category: "Decoración" },
      { ...products[0], id: 3, category: "Globos" },
      { ...products[0], id: 4, category: "Globos" },
      { ...products[0], id: 5, category: "Globos" },
      { ...products[0], id: 6, category: "Globos" },
    ];
    expect(relatedProducts(fixture, fixture[0], 4).map((product) => product.id)).toEqual([
      2, 3, 4, 5,
    ]);
  });

  it("defaults to a limit of five without mutating the input", () => {
    const before = products.map((product) => product.id);
    expect(relatedProducts(products, products[0])).toHaveLength(5);
    expect(products.map((product) => product.id)).toEqual(before);
  });
});

/** Probe used to exercise the content module's string builders; only emptiness matters. */
const CONTENT_PROBE = "Producto";

/** Flattens the module's exports into the strings they produce for a sample value. */
function collectContentStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (typeof value === "function") {
    return collectContentStrings((value as (probe: string) => unknown)(CONTENT_PROBE));
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectContentStrings);
  }
  if (value !== null && typeof value === "object") {
    return Object.values(value).flatMap(collectContentStrings);
  }
  return [];
}

describe("product detail copy", () => {
  it("exports only non-empty strings and string builders", () => {
    const values = collectContentStrings(productDetailContent);
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});
