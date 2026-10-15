// @vitest-environment jsdom
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SearchBar } from "@/components/layout/search-bar";
import { productsSearchSchema } from "@/features/catalog/schemas/products-search";
import { parseSearchParams, stringifySearchParams } from "@/lib/search-params";

vi.mock("sonner", () => ({ toast: vi.fn() }));

import { toast } from "sonner";

/** Reports the router's current path and `q` so the assertions stay end-to-end. */
function RouterProbe() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const search = useSearch({ strict: false });
  const query = typeof search.q === "string" ? search.q : "";

  return <p>{`ruta:${pathname}|consulta:${query}`}</p>;
}

const rootRoute = createRootRoute({
  component: () => (
    <div>
      <SearchBar />
      <RouterProbe />
      <Outlet />
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => null,
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  validateSearch: (search: Record<string, unknown>) => productsSearchSchema.catch({}).parse(search),
  component: () => null,
});

const routeTree = rootRoute.addChildren([indexRoute, productsRoute]);

/** Mounts the search bar once the memory router has completed its first load. */
async function mountSearchBar(initialEntry = "/") {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    parseSearch: parseSearchParams,
    stringifySearch: stringifySearchParams,
  });
  await router.load();
  render(<RouterProvider router={router} />);
  await screen.findByRole("search");
  return router;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SearchBar", () => {
  it("uses the Spanish 'Buscar productos' placeholder", async () => {
    await mountSearchBar();
    expect(screen.getByPlaceholderText("Buscar productos")).toBeTruthy();
  });

  it("exposes an icon-only submit control named 'Buscar'", async () => {
    await mountSearchBar();
    const submit = screen.getByRole("button", { name: "Buscar" });
    expect(submit.getAttribute("type")).toBe("submit");
    expect(submit.textContent).toBe("");
  });

  it("navigates to /products with the trimmed query", async () => {
    const user = userEvent.setup();
    await mountSearchBar();

    await user.type(screen.getByPlaceholderText("Buscar productos"), "  globo  ");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(await screen.findByText("ruta:/products|consulta:globo")).toBeTruthy();
  });

  it("keeps the empty-query toast and stays put when the input is blank", async () => {
    const user = userEvent.setup();
    await mountSearchBar();

    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(toast).toHaveBeenCalledWith("Escribe algo para buscar");
    expect(screen.getByText("ruta:/|consulta:")).toBeTruthy();
  });

  it("prefills the query from the URL", async () => {
    await mountSearchBar("/products?q=globos");
    const input = screen.getByPlaceholderText("Buscar productos") as HTMLInputElement;
    expect(input.value).toBe("globos");
  });
});
