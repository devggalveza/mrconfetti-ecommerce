import { existsSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { products } from "@/features/catalog/data/products";
import { BRANDS, CATEGORIES } from "@/features/catalog/schemas/product";
import { productsSearchSchema } from "@/features/catalog/schemas/products-search";
import {
  HERO_SLIDES,
  HOME_BRANDS,
  HOME_CAMPAIGNS,
  HOME_CATEGORIES,
  HOME_SECTION_HEADINGS,
  HOME_TRUST_CARDS,
  SEASON_BANNER,
} from "@/features/home/data/home-content";
import { formatMoney } from "@/lib/format";

/** Resolves an app-absolute asset path (e.g. `/banners/x.png`) to its file in `apps/web/public`. */
function publicFile(assetPath: string): URL {
  return new URL(`../../../../public${assetPath}`, import.meta.url);
}

/** The cheapest product price in the catalogue, the floor the trust cards must quote. */
const PRICE_FLOOR = Math.min(...products.map((product) => product.price));

/** Turns a `/products?...` href into the search object the products route validates. */
function searchOf(href: string): Record<string, unknown> {
  const url = new URL(href, "https://mrconfetti.example");
  const search: Record<string, unknown> = {};

  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    search[key] = values.length > 1 ? values : values[0];
  }

  return search;
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
    expect(HOME_SECTION_HEADINGS.heroCarousel.trim().length).toBeGreaterThan(0);
    expect(HOME_SECTION_HEADINGS.popularCategories.trim().length).toBeGreaterThan(0);
    expect(HOME_SECTION_HEADINGS.campaigns.trim().length).toBeGreaterThan(0);
    expect(HOME_SECTION_HEADINGS.brands.trim().length).toBeGreaterThan(0);
  });
});

describe("HOME_CAMPAIGNS", () => {
  it("ships three campaigns, each with its own id, copy, gradient and icon", () => {
    expect(HOME_CAMPAIGNS).toHaveLength(3);
    expect(new Set(HOME_CAMPAIGNS.map((campaign) => campaign.id)).size).toBe(3);
    expect(new Set(HOME_CAMPAIGNS.map((campaign) => campaign.gradient)).size).toBe(3);

    for (const campaign of HOME_CAMPAIGNS) {
      expect(campaign.eyebrow.trim().length).toBeGreaterThan(0);
      expect(campaign.title.trim().length).toBeGreaterThan(0);
      expect(campaign.ctaLabel.trim().length).toBeGreaterThan(0);
      expect(campaign.title.includes("<"), `${campaign.title} must be plain text`).toBe(false);
      expect(campaign.icon, `${campaign.id} must have an icon`).toBeTruthy();
    }
  });
});

describe("HOME_TRUST_CARDS", () => {
  it("ships three cards, each with a title, a detail and a tone", () => {
    expect(HOME_TRUST_CARDS).toHaveLength(3);

    for (const card of HOME_TRUST_CARDS) {
      expect(card.title.trim().length).toBeGreaterThan(0);
      expect(card.detail.trim().length).toBeGreaterThan(0);
      expect(card.tone.trim().length).toBeGreaterThan(0);
    }
  });

  it("quotes the real catalogue price floor instead of an invented one", () => {
    expect(PRICE_FLOOR).toBeGreaterThan(0);
    expect(HOME_TRUST_CARDS.map((card) => card.detail).join(" ")).toContain(
      formatMoney(PRICE_FLOOR),
    );
  });
});

describe("HOME_BRANDS", () => {
  it("lists exactly the three catalog brands, in `BRANDS` order", () => {
    expect(HOME_BRANDS.map((brand) => brand.name)).toEqual([...BRANDS]);
  });

  it("links every brand to its own `brand` filter", () => {
    for (const brand of HOME_BRANDS) {
      const url = new URL(brand.href, "https://mrconfetti.example");
      expect(url.pathname).toBe("/products");
      expect(url.searchParams.get("brand")).toBe(brand.name);
    }
  });
});

describe("SEASON_BANNER", () => {
  it("carries the graduation season copy and a products CTA", () => {
    expect(SEASON_BANNER.title.trim().length).toBeGreaterThan(0);
    expect(SEASON_BANNER.description.trim().length).toBeGreaterThan(0);
    expect(SEASON_BANNER.ctaLabel.trim().length).toBeGreaterThan(0);
    expect(SEASON_BANNER.href.startsWith("/products")).toBe(true);
  });
});

describe("phase 4 filters", () => {
  it("resolves every new href to a products filter the schema accepts", () => {
    const hrefs = [
      ...HOME_CAMPAIGNS.map((campaign) => campaign.href),
      ...HOME_BRANDS.map((brand) => brand.href),
      SEASON_BANNER.href,
    ];

    for (const href of hrefs) {
      const url = new URL(href, "https://mrconfetti.example");
      expect(url.pathname, `${href} must target the products route`).toBe("/products");

      const parsed = productsSearchSchema.safeParse(searchOf(href));
      expect(parsed.success, `${href} must pass the products search schema`).toBe(true);
    }
  });

  it("keeps every campaign and brand filter narrow instead of empty", () => {
    for (const campaign of [...HOME_CAMPAIGNS, ...HOME_BRANDS]) {
      const search = searchOf(campaign.href);
      expect(Object.keys(search).length, `${campaign.href} needs a filter`).toBeGreaterThan(0);
    }
  });
});
