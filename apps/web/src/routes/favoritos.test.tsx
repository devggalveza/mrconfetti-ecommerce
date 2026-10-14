// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { products } from "@/features/catalog/data/products";
import { FAVORITES_COPY } from "@/features/favorites/data/favorites-copy";
import { parseSearchParams, stringifySearchParams } from "@/lib/search-params";
import { routeTree } from "@/routeTree.gen";
import { useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useOrdersStore } from "@/stores/orders-store";
import { usePromoStore } from "@/stores/promo-store";
import { useSavedStore } from "@/stores/saved-store";

// The real generated tree's root document renders the app's `<Toaster/>`, so the
// mock has to provide that export as well as the `toast` function the cards call.
vi.mock("sonner", () => ({ toast: vi.fn(), Toaster: () => null }));

// `useStoresHydrated` reads a context that only flips true after a real promise
// resolves, so asserting the first paint by racing that promise would be timing
// dependent. The override lets one test pin the unhydrated path deterministically
// while every other test falls through to the real hook (`null`).
const hydration = vi.hoisted(() => ({ forced: null as boolean | null }));

vi.mock("@/stores/store-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/stores/store-provider")>();

  return {
    ...actual,
    useStoresHydrated: (): boolean => {
      const real = actual.useStoresHydrated();
      return hydration.forced ?? real;
    },
  };
});

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/**
 * Mounts the application's real generated route tree at `initialEntry`.
 *
 * The tree is the one the app ships (`routeTree.gen.ts`), not a hand-built one,
 * so the test is incapable of the phase 6b mistake where a synthetic root could
 * reach a route the generated tree never mounted. Reaching `/favoritos` here is
 * therefore the same proof the running application offers.
 */
async function renderFavorites(initialEntry = "/favoritos") {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    context: { queryClient },
    parseSearch: parseSearchParams,
    stringifySearch: stringifySearchParams,
  });

  await router.load();
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return router;
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  useCartStore.setState({ lines: [] });
  useSavedStore.setState({ ids: [] });
  useFavoritesStore.setState({ ids: [] });
  usePromoStore.setState({ code: null });
  useOrdersStore.setState({ lastOrder: null, pendingConfirmation: false });
  hydration.forced = null;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe("/favoritos route in the real generated tree", () => {
  it("is reachable at /favoritos and mounts the favorites route match", async () => {
    const router = await renderFavorites("/favoritos");

    expect(
      await screen.findByRole("heading", { level: 1, name: FAVORITES_COPY.heading }),
    ).toBeTruthy();
    expect(router.state.location.pathname).toBe("/favoritos");
    expect(router.state.matches.some((match) => match.routeId === "/favoritos")).toBe(true);
  });

  it("renders its structural content and one loading status before the stores rehydrate", async () => {
    hydration.forced = false;
    // A persisted favourite must not leak into the first paint as a grid card or
    // as the empty state; the placeholder stands in for both.
    const seeded = products[0];
    if (seeded === undefined) {
      throw new Error("test fixture expects at least one product");
    }
    useFavoritesStore.setState({ ids: [seeded.id] });

    await renderFavorites("/favoritos");

    // Nothing here depends on localStorage, so the server renders it too.
    expect(screen.getByRole("heading", { level: 1, name: FAVORITES_COPY.heading })).toBeTruthy();
    expect(
      within(screen.getByRole("navigation", { name: "Ruta de navegación" })).getByText(
        FAVORITES_COPY.breadcrumbCurrent,
      ),
    ).toBeTruthy();

    // The persisted grid is replaced by exactly one named loading status.
    expect(screen.getAllByRole("status", { name: FAVORITES_COPY.loading })).toHaveLength(1);

    // ...and the page never claims the empty state or shows the seeded card yet.
    expect(screen.queryByText(FAVORITES_COPY.empty.heading)).toBeNull();
    expect(screen.queryByRole("list", { name: FAVORITES_COPY.gridLabel })).toBeNull();
    expect(screen.queryByRole("button", { name: FAVORITES_COPY.clear.trigger })).toBeNull();
  });

  it("shows the empty state and no grid for an empty favourites list", async () => {
    await renderFavorites("/favoritos");

    expect(await screen.findByText(FAVORITES_COPY.empty.heading)).toBeTruthy();
    expect(screen.getByRole("link", { name: FAVORITES_COPY.empty.cta }).getAttribute("href")).toBe(
      "/products",
    );
    expect(screen.queryByRole("list", { name: FAVORITES_COPY.gridLabel })).toBeNull();
    expect(screen.queryByRole("button", { name: FAVORITES_COPY.clear.trigger })).toBeNull();
  });

  it("renders one card per favourite and the clear-all trigger", async () => {
    const first = products[0];
    const second = products[1];

    if (first === undefined || second === undefined) {
      throw new Error("test fixture expects at least two products");
    }

    await renderFavorites("/favoritos");
    // Wait for hydration before writing, so the provider's rehydrate cannot
    // overwrite the seeded ids with the empty state it just restored.
    await screen.findByText(FAVORITES_COPY.empty.heading);

    useFavoritesStore.setState({ ids: [first.id, second.id] });

    const list = await screen.findByRole("list", { name: FAVORITES_COPY.gridLabel });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    // Hydration replaced the placeholder; it must not linger beside the real grid.
    expect(screen.queryByRole("status", { name: FAVORITES_COPY.loading })).toBeNull();
    expect(screen.getByRole("button", { name: FAVORITES_COPY.clear.trigger })).toBeTruthy();
  });
});
