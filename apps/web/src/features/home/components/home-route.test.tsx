// @vitest-environment jsdom
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { productsSearchSchema } from "@/features/catalog/schemas/products-search";
import { HOME_SECTION_HEADINGS, SEASON_BANNER } from "@/features/home/data/home-content";
import { HOME_RAILS } from "@/features/home/data/home-rails";
import { parseSearchParams, stringifySearchParams } from "@/lib/search-params";
import { Route as homeRoute } from "@/routes/index";

/**
 * `apps/web/src`. Vitest runs with the `web` package as its working directory,
 * and the jsdom environment serves modules over HTTP, so `import.meta.url` is
 * not a `file:` URL here.
 */
const WEB_SRC = join(process.cwd(), "src");

/**
 * The phase marker, assembled at runtime so this file can scan its own
 * directory without matching the assertion it makes.
 */
const PHASE_MARKER = ["TO", "DO(phase"].join("");

/** jsdom has no layout engine, so the rails' `ResizeObserver` is stubbed. */
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/** The title of one rail, looked up by id so a reorder cannot hide a missing rail. */
function railTitle(id: string): string {
  const rail = HOME_RAILS.find((entry) => entry.id === id);
  if (rail === undefined) {
    throw new Error(`HOME_RAILS must still ship the "${id}" rail`);
  }
  return rail.title;
}

/**
 * The ten sections of `/`, in the order the design shows them. Every section
 * carries an accessible name: an `aria-label`, a labelled `SectionHeading` or a
 * rail heading, so DOM order is read from the region list.
 */
const SECTION_ORDER = [
  HOME_SECTION_HEADINGS.heroPromotions,
  HOME_SECTION_HEADINGS.popularCategories,
  railTitle("deals"),
  HOME_SECTION_HEADINGS.campaigns,
  HOME_SECTION_HEADINGS.brands,
  railTitle("graduacion"),
  railTitle("globos-foil"),
  SEASON_BANNER.title,
  railTitle("cumpleanos"),
  railTitle("decoracion"),
];

/** Every `.ts`/`.tsx` file under a directory, recursively. */
function sourceFilesUnder(root: string): string[] {
  return readdirSync(root, { recursive: true, encoding: "utf8" })
    .filter((entry) => entry.endsWith(".ts") || entry.endsWith(".tsx"))
    .map((entry) => join(root, entry));
}

/** The scanned files that still contain the marker, as paths relative to `apps/web/src`. */
function filesContaining(files: readonly string[], marker: string): string[] {
  return files
    .filter((file) => readFileSync(file, "utf8").includes(marker))
    .map((file) => file.slice(WEB_SRC.length + 1).replaceAll("\\", "/"));
}

/** Renders the real `/` route component inside a memory router. */
function renderHomePage(): void {
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
    component: homeRoute.options.component,
  });
  const productsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/products",
    validateSearch: (search: Record<string, unknown>) => productsSearchSchema.catch({}).parse(search),
    component: () => null,
  });
  const productRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/products/$productId",
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([indexRoute, productsRoute, productRoute]);
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

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe("/ route", () => {
  it("renders the ten sections in the order the design shows them", async () => {
    renderHomePage();
    await screen.findByRole("region", { name: SECTION_ORDER[0] });

    for (let index = 0; index < SECTION_ORDER.length - 1; index += 1) {
      const currentName = SECTION_ORDER[index];
      const nextName = SECTION_ORDER[index + 1];
      const current = screen.getByRole("region", { name: currentName });
      const next = screen.getByRole("region", { name: nextName });

      expect(
        current.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING,
        `"${currentName}" must render before "${nextName}"`,
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }
  });

  it("renders one region per section of the design", async () => {
    renderHomePage();
    await screen.findByRole("region", { name: SECTION_ORDER[0] });

    const sections = SECTION_ORDER.map((name) => screen.getByRole("region", { name }));
    expect(new Set(sections).size).toBe(SECTION_ORDER.length);
  });

  it("leaves no phase marker in the home feature or the index route", () => {
    const files = [
      ...sourceFilesUnder(join(WEB_SRC, "features", "home")),
      join(WEB_SRC, "routes", "index.tsx"),
    ];

    // Both halves of the surface resolved: the scan is not silently empty.
    expect(files).toContain(join(WEB_SRC, "features", "home", "data", "home-content.ts"));
    expect(files).toContain(join(WEB_SRC, "routes", "index.tsx"));
    expect(filesContaining(files, PHASE_MARKER)).toEqual([]);
  });

  it("leaves no phase 3 or phase 4 marker anywhere in apps/web/src", () => {
    const files = sourceFilesUnder(WEB_SRC);

    expect(files.length).toBeGreaterThan(0);
    expect(filesContaining(files, `${PHASE_MARKER} 3`)).toEqual([]);
    expect(filesContaining(files, `${PHASE_MARKER} 4`)).toEqual([]);
  });
});
