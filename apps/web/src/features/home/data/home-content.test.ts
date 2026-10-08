import { existsSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { CATEGORIES } from "@/features/catalog/schemas/product";
import {
  HERO_PROMO,
  HERO_SLIDES,
  HOME_CATEGORIES,
  HOME_SECTION_HEADINGS,
} from "@/features/home/data/home-content";

/** Resolves an app-absolute asset path (e.g. `/banners/x.png`) to its file in `apps/web/public`. */
function publicFile(assetPath: string): URL {
  return new URL(`../../../../public${assetPath}`, import.meta.url);
}

describe("HERO_SLIDES", () => {
  it("keeps the three real banners in order, with their intrinsic sizes", () => {
    expect(HERO_SLIDES.map((slide) => slide.image)).toEqual([
      "/banners/banner-1.png",
      "/banners/banner-2.webp",
      "/banners/banner-3.png",
    ]);
    expect(HERO_SLIDES.map((slide) => [slide.width, slide.height])).toEqual([
      [1920, 720],
      [1500, 300],
      [1920, 384],
    ]);
  });

  it("points every slide at a banner file that exists on disk", () => {
    for (const slide of HERO_SLIDES) {
      const file = publicFile(slide.image);
      expect(existsSync(file), `${slide.image} must exist under apps/web/public`).toBe(true);
      expect(statSync(file).size, `${slide.image} must not be empty`).toBeGreaterThan(0);
    }
  });

  it("gives every slide a Spanish alt text and a products href", () => {
    for (const slide of HERO_SLIDES) {
      expect(slide.alt.trim().length).toBeGreaterThan(0);
      expect(slide.href.startsWith("/products")).toBe(true);
    }
  });
});

describe("HERO_PROMO", () => {
  it("describes a 50 % sale and links to the deals filter", () => {
    expect(HERO_PROMO.percent).toBe(50);
    expect(HERO_PROMO.eyebrow.trim().length).toBeGreaterThan(0);
    expect(HERO_PROMO.description.trim().length).toBeGreaterThan(0);
    expect(HERO_PROMO.ctaLabel.trim().length).toBeGreaterThan(0);

    const url = new URL(HERO_PROMO.href, "https://mrconfetti.example");
    expect(url.pathname).toBe("/products");
    expect(url.searchParams.get("deal")).toBe("true");
  });
});

describe("HOME_CATEGORIES", () => {
  it("lists exactly the seven catalog categories, in `CATEGORIES` order", () => {
    expect(HOME_CATEGORIES.map((entry) => entry.category)).toEqual([...CATEGORIES]);
  });

  it("gives every category an icon", () => {
    for (const entry of HOME_CATEGORIES) {
      expect(entry.icon, `${entry.category} must have an icon`).toBeTruthy();
    }
  });

  it("links every category to a real category filter", () => {
    for (const entry of HOME_CATEGORIES) {
      const url = new URL(entry.href, "https://mrconfetti.example");
      expect(url.pathname).toBe("/products");

      const selected = url.searchParams.get("cat") ?? "";
      const matches = CATEGORIES.filter((category) => category === selected);
      expect(matches, `${entry.href} must filter an existing category`).toHaveLength(1);
      expect(matches[0]).toBe(entry.category);
    }
  });
});

describe("HOME_SECTION_HEADINGS", () => {
  it("provides the headings this phase renders", () => {
    expect(HOME_SECTION_HEADINGS.heroPromotions.trim().length).toBeGreaterThan(0);
    expect(HOME_SECTION_HEADINGS.heroCarousel.trim().length).toBeGreaterThan(0);
    expect(HOME_SECTION_HEADINGS.popularCategories.trim().length).toBeGreaterThan(0);
  });
});
