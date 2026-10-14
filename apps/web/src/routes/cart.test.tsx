// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CART_COPY } from "@/features/cart/data/cart-copy";
import { computeTotals } from "@/features/cart/lib/totals";
import { products } from "@/features/catalog/data/products";
import { COUPONS } from "@/lib/coupons";
import { formatMoney } from "@/lib/format";
import { parseSearchParams, stringifySearchParams } from "@/lib/search-params";
import { routeTree } from "@/routeTree.gen";
import { useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useOrdersStore } from "@/stores/orders-store";
import { usePromoStore } from "@/stores/promo-store";
import { useSavedStore } from "@/stores/saved-store";

// The real generated tree's root document renders the app's `<Toaster/>`, so the
// mock has to provide that export as well as the `toast` function the rail's cards
// call when they add a unit.
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
 * The tree is the one the app ships (`routeTree.gen.ts`), not a hand-built one, so
 * the test is incapable of the phase 6b mistake where a synthetic root could reach
 * a route the generated tree never mounted. Reaching `/cart` here is therefore the
 * same proof the running application offers.
 */
async function renderCart(initialEntry = "/cart") {
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

describe("/cart route in the real generated tree", () => {
  it("is reachable at /cart and mounts the cart route match", async () => {
    const router = await renderCart("/cart");

    expect(
      await screen.findByRole("heading", { level: 1, name: CART_COPY.heading }),
    ).toBeTruthy();
    expect(router.state.location.pathname).toBe("/cart");
    expect(router.state.matches.some((match) => match.routeId === "/cart")).toBe(true);
  });

  it("renders its structural content and one loading status before the stores rehydrate", async () => {
    hydration.forced = false;
    // A cart that looks persisted must not leak into the first paint as a line list
    // or as an empty-cart state; the placeholder stands in for both.
    const seeded = products[0];
    if (seeded === undefined) {
      throw new Error("test fixture expects at least one product");
    }
    useCartStore.setState({ lines: [{ id: seeded.id, quantity: 2 }] });

    await renderCart("/cart");

    // Nothing here depends on localStorage, so the server renders it too.
    expect(screen.getByRole("heading", { level: 1, name: CART_COPY.heading })).toBeTruthy();
    expect(
      within(screen.getByRole("navigation", { name: "Ruta de navegación" })).getByText(
        CART_COPY.breadcrumbCurrent,
      ),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: CART_COPY.recommendedHeading })).toBeTruthy();

    // The persisted sections are replaced by exactly one named loading status.
    expect(screen.getAllByRole("status", { name: CART_COPY.loading })).toHaveLength(1);

    // ...and the page never claims an empty cart or shows the seeded lines yet.
    expect(screen.queryByText(CART_COPY.empty.heading)).toBeNull();
    expect(screen.queryByRole("list", { name: CART_COPY.lineListLabel })).toBeNull();
    expect(screen.queryByRole("region", { name: CART_COPY.summary.heading })).toBeNull();
    expect(screen.queryByRole("heading", { name: CART_COPY.coupon.heading })).toBeNull();
    expect(screen.queryByRole("heading", { name: CART_COPY.saved.heading })).toBeNull();
  });

  it("shows the empty state and no line list for an empty cart", async () => {
    await renderCart("/cart");

    expect(await screen.findByText(CART_COPY.empty.heading)).toBeTruthy();
    expect(screen.getByRole("link", { name: CART_COPY.empty.cta }).getAttribute("href")).toBe(
      "/products",
    );
    expect(screen.queryByRole("list", { name: CART_COPY.lineListLabel })).toBeNull();
  });

  it("renders one line per product with the summary amounts", async () => {
    const first = products[0];
    const second = products[1];

    if (first === undefined || second === undefined) {
      throw new Error("test fixture expects at least two products");
    }

    await renderCart("/cart");
    // Wait for hydration before writing, so the provider's rehydrate cannot overwrite
    // the seeded lines with the empty state it just restored.
    await screen.findByText(CART_COPY.empty.heading);

    const lines = [
      { id: first.id, quantity: 2 },
      { id: second.id, quantity: 1 },
    ];
    useCartStore.setState({ lines });
    // A coupon makes the total differ from the subtotal, so each amount appears
    // exactly once and the discount line is exercised on the real route too.
    usePromoStore.setState({ code: COUPONS.EMOX10?.code ?? null });

    const totals = computeTotals(lines, products, COUPONS.EMOX10 ?? null);
    const list = await screen.findByRole("list", { name: CART_COPY.lineListLabel });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    // Hydration replaced the placeholder; it must not linger beside the real cart.
    expect(screen.queryByRole("status", { name: CART_COPY.loading })).toBeNull();

    const summary = screen.getByRole("region", { name: CART_COPY.summary.heading });
    expect(within(summary).getByText(formatMoney(totals.subtotal))).toBeTruthy();
    expect(within(summary).getByText(`-${formatMoney(totals.discount)}`)).toBeTruthy();
    expect(within(summary).getByText(formatMoney(totals.total))).toBeTruthy();
  });

  it("renders the recommended rail", async () => {
    await renderCart("/cart");

    expect(await screen.findByRole("heading", { name: CART_COPY.recommendedHeading })).toBeTruthy();
    const rail = screen.getByRole("list", { name: CART_COPY.recommendedHeading });
    expect(within(rail).getAllByRole("listitem").length).toBeGreaterThan(0);
  });
});
