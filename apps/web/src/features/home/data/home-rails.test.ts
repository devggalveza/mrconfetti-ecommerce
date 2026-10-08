import { describe, expect, it } from "vitest";

import { HOME_RAILS } from "@/features/home/data/home-rails";
import { discountPercent } from "@/features/catalog/lib/selectors";

const EXPECTED_TITLES = [
  "¡Las mejores ofertas de hoy para ti!",
  "Arcos de globos para graduación",
  "Globos foil y personajes",
  "Cumpleaños, revelaciones y dulces",
  "Decoración para tu fiesta",
];

const EXPECTED_CATEGORY_SETS: ReadonlyArray<readonly string[] | null> = [
  null,
  ["Graduación"],
  ["Personajes", "Globos"],
  ["Cumpleaños", "Revelación de género", "Dulces y piñata"],
  ["Decoración", "Dulces y piñata", "Globos"],
];

describe("HOME_RAILS", () => {
  it("keeps the five rails in source order", () => {
    expect(HOME_RAILS).toHaveLength(5);
    expect(HOME_RAILS.map((rail) => rail.title)).toEqual(EXPECTED_TITLES);
  });

  it("gives every rail its own heading id and at least one product", () => {
    const headingIds = HOME_RAILS.map((rail) => rail.headingId);
    expect(new Set(headingIds).size).toBe(HOME_RAILS.length);

    for (const rail of HOME_RAILS) {
      expect(rail.products.length).toBeGreaterThan(0);
    }
  });

  it("sorts the deals rail by descending discount", () => {
    const deals = HOME_RAILS[0]?.products ?? [];
    const discounts = deals.map((product) => discountPercent(product));
    const sorted = [...discounts].sort((a, b) => b - a);
    expect(discounts).toEqual(sorted);
  });

  it("keeps each category rail to the categories it claims", () => {
    HOME_RAILS.forEach((rail, index) => {
      const claimed = EXPECTED_CATEGORY_SETS[index];
      if (claimed === null || claimed === undefined) {
        return;
      }
      for (const product of rail.products) {
        expect(claimed).toContain(product.category);
      }
    });
  });

  it("links every rail to its matching products filter", () => {
    for (const rail of HOME_RAILS) {
      expect(rail.actionHref.startsWith("/products")).toBe(true);
    }
  });
});
