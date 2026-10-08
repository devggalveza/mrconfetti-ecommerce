import { describe, expect, it } from "vitest";

import { CATEGORIES } from "@/features/catalog/schemas/product";

import { CATEGORY_NAV } from "./navigation";

describe("CATEGORY_NAV", () => {
  it("lists the nine legacy nav entries in the design order", () => {
    expect(CATEGORY_NAV.map((item) => item.label)).toEqual([
      "Todas las categorías",
      "Graduación",
      "Globos",
      "Personajes",
      "Cumpleaños",
      "Revelación de género",
      "Dulces y piñata",
      "Decoración",
      "Ofertas",
    ]);
  });

  it("points every entry at the products route", () => {
    for (const item of CATEGORY_NAV) {
      expect(item.to).toBe("/products");
    }
  });

  it("only filters by real members of CATEGORIES", () => {
    for (const item of CATEGORY_NAV) {
      const category = item.search?.cat?.[0];
      if (category !== undefined) {
        expect(CATEGORIES).toContain(category);
      }
    }
  });

  it("flags the offers entry with deal instead of a category", () => {
    const offers = CATEGORY_NAV.find((item) => item.label === "Ofertas");
    expect(offers?.search?.deal).toBe(true);
    expect(offers?.search?.cat).toBeUndefined();
  });
});
