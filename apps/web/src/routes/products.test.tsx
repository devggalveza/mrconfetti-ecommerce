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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { products } from "@/features/catalog/data/products";
import { productsSearchSchema } from "@/features/catalog/schemas/products-search";
import { parseSearchParams, stringifySearchParams } from "@/lib/search-params";
import { useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";

import { Route as productsRoute } from "./products";

vi.mock("sonner", () => ({ toast: vi.fn() }));

/** Renders the real `/products` route component inside a memory router. */
async function renderProductsPage(initialEntry: string): Promise<void> {
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
    component: () => null,
  });
  const listRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/products",
    validateSearch: (search: Record<string, unknown>) =>
      productsSearchSchema.catch({}).parse(search),
    component: productsRoute.options.component,
  });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/products/$productId",
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([indexRoute, listRoute, detailRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    parseSearch: parseSearchParams,
    stringifySearch: stringifySearchParams,
  });

  await router.load();
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  useCartStore.setState({ lines: [] });
  useFavoritesStore.setState({ ids: [] });
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("/products route", () => {
  it("renders the first page with its count line and one pager page per slice", async () => {
    await renderProductsPage("/products");

    expect(await screen.findAllByRole("article")).toHaveLength(12);
    expect(screen.getByText("36 productos")).toBeTruthy();

    const pager = screen.getByRole("navigation", { name: "Paginación" });
    expect(within(pager).getByRole("button", { name: "Página 1" })).toBeTruthy();
    expect(within(pager).getByRole("button", { name: "Página 3" })).toBeTruthy();
    expect(within(pager).queryByRole("button", { name: "Página 4" })).toBeNull();
  });

  it("narrows to one category and shows a single removable chip", async () => {
    await renderProductsPage("/products?cat=Globos");

    expect(await screen.findAllByRole("article")).toHaveLength(6);
    expect(screen.getByText("6 productos")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /^Quitar filtro / })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Quitar filtro Globos" })).toBeTruthy();
  });

  it("shows the empty state when no product matches the query", async () => {
    await renderProductsPage("/products?q=zzzz");

    expect(
      await screen.findByRole("heading", { name: "No hay productos con estos filtros" }),
    ).toBeTruthy();
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Limpiar filtros" })).toBeTruthy();
  });

  it("renders a different slice on the second page", async () => {
    await renderProductsPage("/products?page=2");

    expect(await screen.findAllByRole("article")).toHaveLength(12);
    expect(screen.queryByText(products[0].name)).toBeNull();
    expect(screen.getByText(products[12].name)).toBeTruthy();
  });
});
