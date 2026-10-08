// @vitest-environment jsdom
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { productsSearchSchema } from "@/features/catalog/schemas/products-search";
import { parseSearchParams, stringifySearchParams } from "@/lib/search-params";

import { useCatalogFilters } from "./use-catalog-filters";

type CatalogFiltersApi = ReturnType<typeof useCatalogFilters>;

type RenderedCatalog = {
  current: () => CatalogFiltersApi;
  historyLength: () => number;
};

/** Renders the hook inside a real memory router at `/products`. */
async function renderCatalog(initialEntry: string): Promise<RenderedCatalog> {
  let latest: CatalogFiltersApi | undefined;

  function Harness() {
    latest = useCatalogFilters();
    return null;
  }

  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => null,
  });
  const productsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/products",
    validateSearch: (search: Record<string, unknown>) =>
      productsSearchSchema.catch({}).parse(search),
    component: Harness,
  });
  const routeTree = rootRoute.addChildren([indexRoute, productsRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    parseSearch: parseSearchParams,
    stringifySearch: stringifySearchParams,
  });

  render(<RouterProvider router={router} />);
  await act(async () => {});

  return {
    current: () => {
      if (latest === undefined) {
        throw new Error("the catalog hook has not rendered yet");
      }
      return latest;
    },
    historyLength: () => router.history.length,
  };
}

/** Runs a mutator and flushes the router navigation it triggers. */
async function run(action: () => void): Promise<void> {
  await act(async () => {
    action();
  });
}

afterEach(() => {
  cleanup();
});

describe("useCatalogFilters", () => {
  it("resets to the first page when a category narrows the results and restores on a second toggle", async () => {
    const catalog = await renderCatalog("/products?page=2");

    expect(catalog.current().page).toBe(2);

    await run(() => catalog.current().toggleCategory("Globos"));

    expect(catalog.current().filters.categories).toEqual(["Globos"]);
    expect(catalog.current().page).toBe(1);
    expect(catalog.current().total).toBe(6);
    expect(catalog.current().results).toHaveLength(6);

    await run(() => catalog.current().toggleCategory("Globos"));

    expect(catalog.current().filters.categories).toEqual([]);
    expect(catalog.current().page).toBe(1);
    expect(catalog.current().total).toBe(36);
    expect(catalog.current().results).toHaveLength(12);
  });

  it("reorders with setSort without touching the facets", async () => {
    const catalog = await renderCatalog("/products?cat=Globos&page=2");

    await run(() => catalog.current().setSort("pa"));

    expect(catalog.current().filters.sort).toBe("pa");
    expect(catalog.current().filters.categories).toEqual(["Globos"]);
    expect(catalog.current().filters.brands).toEqual([]);
    expect(catalog.current().page).toBe(1);

    const prices = catalog.current().results.map((product) => product.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("changes the page without touching the facets", async () => {
    const catalog = await renderCatalog("/products?sort=pa");
    const firstPageIds = catalog.current().results.map((product) => product.id);

    await run(() => catalog.current().setPage(2));

    expect(catalog.current().page).toBe(2);
    expect(catalog.current().filters.sort).toBe("pa");
    expect(catalog.current().filters.categories).toEqual([]);
    expect(catalog.current().results.map((product) => product.id)).not.toEqual(firstPageIds);
  });

  it("removes exactly one facet when its chip is removed", async () => {
    const catalog = await renderCatalog("/products?cat=Globos&brand=Fiesta%20Pro&deal=1");

    expect(catalog.current().chips).toHaveLength(3);

    await run(() => catalog.current().removeChip("category:Globos"));

    expect(catalog.current().filters.categories).toEqual([]);
    expect(catalog.current().filters.brands).toEqual(["Fiesta Pro"]);
    expect(catalog.current().filters.dealsOnly).toBe(true);
  });

  it("keeps the query and the sort when clearing every facet", async () => {
    const catalog = await renderCatalog("/products?q=globo&sort=pa&cat=Globos&deal=1");

    await run(() => catalog.current().clearAll());

    expect(catalog.current().filters.categories).toEqual([]);
    expect(catalog.current().filters.dealsOnly).toBe(false);
    expect(catalog.current().filters.query).toBe("globo");
    expect(catalog.current().filters.sort).toBe("pa");
  });

  it("replaces the history entry for a facet change and pushes one for a page change", async () => {
    const catalog = await renderCatalog("/products");
    const initialLength = catalog.historyLength();

    await run(() => catalog.current().setPage(2));
    expect(catalog.historyLength()).toBe(initialLength + 1);

    await run(() => catalog.current().toggleCategory("Globos"));
    expect(catalog.historyLength()).toBe(initialLength + 1);
    expect(catalog.current().page).toBe(1);
  });
});
