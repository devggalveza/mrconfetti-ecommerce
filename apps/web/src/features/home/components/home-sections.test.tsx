// @vitest-environment jsdom
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { productsSearchSchema } from "@/features/catalog/schemas/products-search";
import { BrandsShowcase } from "@/features/home/components/brands-showcase";
import { CampaignBanners } from "@/features/home/components/campaign-banners";
import { CategoryGrid } from "@/features/home/components/category-grid";
import { HeroCarousel } from "@/features/home/components/hero-carousel";
import { SeasonBanner } from "@/features/home/components/season-banner";
import {
  HERO_SLIDES,
  HOME_BRANDS,
  HOME_CAMPAIGNS,
  HOME_CATEGORIES,
  HOME_SECTION_HEADINGS,
  HOME_TRUST_CARDS,
  SEASON_BANNER,
} from "@/features/home/data/home-content";
import { parseSearchParams, stringifySearchParams } from "@/lib/search-params";

const rootRoute = createRootRoute({
  component: () => (
    <main>
      <Outlet />
    </main>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <>
      <HeroCarousel />
      <CategoryGrid />
      <CampaignBanners />
      <BrandsShowcase />
      <SeasonBanner />
    </>
  ),
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  validateSearch: (search: Record<string, unknown>) => productsSearchSchema.catch({}).parse(search),
  component: () => null,
});

const routeTree = rootRoute.addChildren([indexRoute, productsRoute]);

function renderHomeSections(): void {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
    // The app router swaps the default JSON search codec for the readable one
    // (see `src/router.tsx`); the test router has to do the same.
    parseSearch: parseSearchParams,
    stringifySearch: stringifySearchParams,
  });
  render(<RouterProvider router={router} />);
}

afterEach(() => {
  cleanup();
});

describe("home hero", () => {
  it("renders one slide image per hero slide, using the real alt text", async () => {
    renderHomeSections();
    const carousel = await screen.findByLabelText(HOME_SECTION_HEADINGS.heroCarousel);
    expect(carousel.getAttribute("aria-roledescription")).toBe("carrusel");

    const images = within(carousel).getAllByRole("img", { hidden: true });
    expect(images).toHaveLength(HERO_SLIDES.length);
    expect(images.map((image) => image.getAttribute("alt"))).toEqual(
      HERO_SLIDES.map((slide) => slide.alt),
    );
  });

  it("renders one dot per slide with only the active one marked as current", async () => {
    renderHomeSections();
    const dots = await screen.findAllByRole("button", { name: /^Ir a la diapositiva \d+$/ });
    expect(dots).toHaveLength(HERO_SLIDES.length);

    const current = dots.filter((dot) => dot.getAttribute("aria-current") === "true");
    expect(current).toHaveLength(1);
    expect(current[0]?.getAttribute("aria-label")).toBe("Ir a la diapositiva 1");
  });

  it("offers a pause control beside the dots", async () => {
    renderHomeSections();
    expect(await screen.findByRole("button", { name: "Pausar el carrusel" })).toBeTruthy();
  });
});

describe("popular categories", () => {
  it("renders the seven categories, each linking to its own filter", async () => {
    renderHomeSections();
    const section = await screen.findByRole("region", {
      name: HOME_SECTION_HEADINGS.popularCategories,
    });

    const list = within(section).getByRole("list");
    const links = within(list).getAllByRole("link");
    expect(links).toHaveLength(HOME_CATEGORIES.length);

    links.forEach((link, index) => {
      const href = link.getAttribute("href") ?? "";
      const url = new URL(href, "https://mrconfetti.example");
      expect(url.pathname).toBe("/products");
      expect(url.searchParams.get("cat")).toBe(HOME_CATEGORIES[index]?.category);
      expect(link.textContent).toContain(HOME_CATEGORIES[index]?.category ?? "");
    });
  });

  it("renders the heading and the Ver todo link", async () => {
    renderHomeSections();
    const section = await screen.findByRole("region", {
      name: HOME_SECTION_HEADINGS.popularCategories,
    });

    expect(
      within(section).getByRole("heading", { level: 2, name: HOME_SECTION_HEADINGS.popularCategories }),
    ).toBeTruthy();
    expect(within(section).getByRole("link", { name: /Ver todo/ })).toBeTruthy();
  });
});

describe("campaign banners", () => {
  it("renders one card per campaign, each with a single CTA link", async () => {
    renderHomeSections();
    const section = await screen.findByRole("region", {
      name: HOME_SECTION_HEADINGS.campaigns,
    });

    const headings = within(section).getAllByRole("heading", { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual(
      HOME_CAMPAIGNS.map((campaign) => campaign.title),
    );

    const links = within(section).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(
      HOME_CAMPAIGNS.map((campaign) => campaign.ctaLabel),
    );
  });

  it("sends every campaign CTA to a products filter", async () => {
    renderHomeSections();
    const section = await screen.findByRole("region", {
      name: HOME_SECTION_HEADINGS.campaigns,
    });

    for (const link of within(section).getAllByRole("link")) {
      const url = new URL(link.getAttribute("href") ?? "", "https://mrconfetti.example");
      expect(url.pathname).toBe("/products");
      expect(productsSearchSchema.safeParse(Object.fromEntries(url.searchParams)).success).toBe(
        true,
      );
    }
  });
});

describe("brands showcase", () => {
  it("renders one tile per real brand, each linking to its own filter", async () => {
    renderHomeSections();
    const section = await screen.findByRole("region", { name: HOME_SECTION_HEADINGS.brands });

    const links = within(section).getAllByRole("link");
    expect(links).toHaveLength(HOME_BRANDS.length);

    links.forEach((link, index) => {
      const url = new URL(link.getAttribute("href") ?? "", "https://mrconfetti.example");
      expect(url.pathname).toBe("/products");
      expect(url.searchParams.get("brand")).toBe(HOME_BRANDS[index]?.name);
    });
  });

  it("renders the three trust cards as plain content, not links", async () => {
    renderHomeSections();
    const section = await screen.findByRole("region", { name: HOME_SECTION_HEADINGS.brands });

    for (const card of HOME_TRUST_CARDS) {
      expect(within(section).getByText(card.title)).toBeTruthy();
      expect(within(section).getByText(card.detail)).toBeTruthy();
    }
  });
});

describe("season banner", () => {
  it("renders the season heading, its description and its CTA", async () => {
    renderHomeSections();
    const section = await screen.findByRole("region", { name: SEASON_BANNER.title });

    expect(
      within(section).getByRole("heading", { level: 2, name: SEASON_BANNER.title }),
    ).toBeTruthy();
    expect(within(section).getByText(SEASON_BANNER.description)).toBeTruthy();

    const cta = within(section).getByRole("link", { name: SEASON_BANNER.ctaLabel });
    const url = new URL(cta.getAttribute("href") ?? "", "https://mrconfetti.example");
    expect(url.pathname).toBe("/products");
  });
});
