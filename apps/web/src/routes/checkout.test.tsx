// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CART_COPY } from "@/features/cart/data/cart-copy";
import { computeTotals } from "@/features/cart/lib/totals";
import { products } from "@/features/catalog/data/products";
import { CHECKOUT_COPY } from "@/features/checkout/data/checkout-copy";
import { createOrderRef } from "@/features/checkout/lib/order";
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

/** A product under the free-shipping threshold that does not ship free. */
const shortProduct = products.find((product) => !product.freeShipping && product.price < 50);

if (shortProduct === undefined) {
  throw new Error("test fixture expects a short product");
}

/** The instant the seeded order reference is built from, so it is deterministic. */
const NOW = new Date(2026, 0, 15, 10, 0, 0);

/**
 * A product id no catalogue entry uses, as stale persisted state can hold after
 * the catalogue drops a product.
 */
const UNKNOWN_PRODUCT_ID = Math.max(...products.map((product) => product.id)) + 1;

/** A completed order, as checkout writes it, with the reference and total it shows. */
const LAST_ORDER = {
  ref: createOrderRef(NOW),
  total: 39.9,
  items: [{ id: shortProduct.id, quantity: 1 }],
  email: "ana@example.com",
  date: NOW.toISOString(),
};

/**
 * Mounts the application's real generated route tree at `initialEntry`.
 *
 * The tree is the one the app ships (`routeTree.gen.ts`), not a hand-built one, so
 * the test is incapable of a synthetic root that could reach a route the generated
 * tree never mounted. Reaching `/checkout` here is therefore the same proof the
 * running application offers.
 */
async function renderCheckout(initialEntry = "/checkout") {
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

describe("/checkout route in the real generated tree", () => {
  it("is reachable at /checkout and mounts the checkout route match", async () => {
    useCartStore.setState({ lines: [{ id: shortProduct.id, quantity: 1 }] });
    const router = await renderCheckout("/checkout");

    expect(
      await screen.findByRole("heading", { level: 1, name: CHECKOUT_COPY.heading }),
    ).toBeTruthy();
    expect(router.state.location.pathname).toBe("/checkout");
    expect(router.state.matches.some((match) => match.routeId === "/checkout")).toBe(true);
  });

  it("renders its structure and one loading status before the stores rehydrate", async () => {
    hydration.forced = false;
    // A cart that looks persisted must not leak into the first paint as the form;
    // the placeholder stands in for it.
    useCartStore.setState({ lines: [{ id: shortProduct.id, quantity: 1 }] });

    await renderCheckout("/checkout");

    // Nothing here depends on localStorage, so the server renders it too.
    expect(screen.getByRole("heading", { level: 1, name: CHECKOUT_COPY.heading })).toBeTruthy();
    expect(
      within(screen.getByRole("navigation", { name: "Ruta de navegación" })).getByText(
        CHECKOUT_COPY.breadcrumbCurrent,
      ),
    ).toBeTruthy();
    expect(screen.getByRole("list", { name: "Pasos de la compra" })).toBeTruthy();

    // The persisted sections are replaced by exactly one named loading status.
    expect(screen.getAllByRole("status", { name: CHECKOUT_COPY.loading })).toHaveLength(1);

    // ...and the page never flashes the form or the success panel.
    expect(screen.queryByLabelText(CHECKOUT_COPY.fields.email.label)).toBeNull();
    expect(screen.queryByText(CHECKOUT_COPY.success.heading)).toBeNull();
  });

  it("redirects an empty checkout with no last order to /cart", async () => {
    const router = await renderCheckout("/checkout");

    // Rehydration and the declarative redirect are both async, so wait on the
    // router's own state rather than racing a fixed paint.
    await vi.waitFor(
      () => {
        expect(router.state.location.pathname).toBe("/cart");
      },
      { timeout: 5000 },
    );
    expect(
      await screen.findByRole(
        "heading",
        { level: 1, name: CART_COPY.heading },
        { timeout: 5000 },
      ),
    ).toBeTruthy();
    expect(router.state.matches.some((match) => match.routeId === "/cart")).toBe(true);
  });

  it("redirects a stale cart whose only line is an unknown product id to /cart", async () => {
    // The persisted cart holds a product the catalogue no longer knows, so the
    // joined items are empty. The checkout must agree with /cart and redirect
    // rather than rendering a form over an empty item list.
    useCartStore.setState({ lines: [{ id: UNKNOWN_PRODUCT_ID, quantity: 1 }] });

    const router = await renderCheckout("/checkout");

    await vi.waitFor(
      () => {
        expect(router.state.location.pathname).toBe("/cart");
      },
      { timeout: 5000 },
    );
    expect(
      await screen.findByRole(
        "heading",
        { level: 1, name: CART_COPY.heading },
        { timeout: 5000 },
      ),
    ).toBeTruthy();
    expect(router.state.matches.some((match) => match.routeId === "/cart")).toBe(true);
    expect(screen.queryByLabelText(CHECKOUT_COPY.fields.email.label)).toBeNull();
  });

  it("renders the form with its fields, methods and amount rows for a seeded cart", async () => {
    useCartStore.setState({ lines: [{ id: shortProduct.id, quantity: 1 }] });

    await renderCheckout("/checkout");

    expect(await screen.findByLabelText(CHECKOUT_COPY.fields.email.label)).toBeTruthy();
    for (const name of ["firstName", "lastName", "phone", "address", "city", "postalCode"] as const) {
      expect(screen.getByLabelText(CHECKOUT_COPY.fields[name].label)).toBeTruthy();
    }

    // The route owns the page heading in this state too: exactly one `h1`, and it
    // sits outside the form rather than being rendered by `CheckoutForm`.
    const heading = screen.getByRole("heading", { level: 1, name: CHECKOUT_COPY.heading });
    expect(heading.closest("form")).toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    // Three shipping methods and three payment methods.
    expect(screen.getByRole("radio", { name: /Envío estándar/ })).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Envío exprés/ })).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Recogida en tienda/ })).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Tarjeta/ })).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Bizum/ })).toBeTruthy();
    expect(screen.getByRole("radio", { name: /PayPal/ })).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(6);

    const totals = computeTotals(
      [{ id: shortProduct.id, quantity: 1 }],
      products,
      null,
      "standard",
    );
    const summary = screen.getByRole("region", { name: CHECKOUT_COPY.summaryHeading });
    expect(within(summary).getByText(CART_COPY.summary.subtotal)).toBeTruthy();
    expect(within(summary).getByText(formatMoney(totals.subtotal))).toBeTruthy();
    expect(within(summary).getByText(CART_COPY.summary.total)).toBeTruthy();
    expect(within(summary).getByText(formatMoney(totals.total))).toBeTruthy();
  });

  it("retotals the displayed total when the shipping method changes", async () => {
    const user = userEvent.setup({ delay: null });
    const lines = [{ id: shortProduct.id, quantity: 1 }];
    useCartStore.setState({ lines });

    await renderCheckout("/checkout");
    await screen.findByLabelText(CHECKOUT_COPY.fields.email.label);

    const standard = computeTotals(lines, products, null, "standard");
    const express = computeTotals(lines, products, null, "express");
    expect(standard.total).not.toBe(express.total);

    const summary = screen.getByRole("region", { name: CHECKOUT_COPY.summaryHeading });
    expect(within(summary).getByText(formatMoney(standard.total))).toBeTruthy();

    await user.click(screen.getByRole("radio", { name: /Envío exprés/ }));

    expect(within(summary).getByText(formatMoney(express.total))).toBeTruthy();
    expect(within(summary).queryByText(formatMoney(standard.total))).toBeNull();
  });

  it("shows the success panel and step 3 for an empty cart with a seeded last order", async () => {
    useOrdersStore.setState({ lastOrder: LAST_ORDER, pendingConfirmation: false });

    await renderCheckout("/checkout");

    expect(await screen.findByText(CHECKOUT_COPY.success.heading)).toBeTruthy();
    expect(screen.getByText(CHECKOUT_COPY.success.reference(LAST_ORDER.ref))).toBeTruthy();
    expect(screen.getByText(formatMoney(LAST_ORDER.total))).toBeTruthy();
    expect(screen.queryByLabelText(CHECKOUT_COPY.fields.email.label)).toBeNull();

    // The page heading still comes from the route, and it is the only `h1`.
    expect(screen.getByRole("heading", { level: 1, name: CHECKOUT_COPY.heading })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    const steps = screen.getByRole("list", { name: "Pasos de la compra" });
    expect(steps.querySelector('[aria-current="step"]')?.textContent).toContain("Confirmación");
  });

  it("shows the form, not the old success panel, when a new cart follows a last order", async () => {
    useCartStore.setState({ lines: [{ id: shortProduct.id, quantity: 1 }] });
    useOrdersStore.setState({ lastOrder: LAST_ORDER, pendingConfirmation: false });

    await renderCheckout("/checkout");

    expect(await screen.findByLabelText(CHECKOUT_COPY.fields.email.label)).toBeTruthy();
    expect(screen.queryByText(CHECKOUT_COPY.success.heading)).toBeNull();
  });
});

describe("/checkout chrome", () => {
  it("does not render the site header on /checkout but keeps the footer", async () => {
    useCartStore.setState({ lines: [{ id: shortProduct.id, quantity: 1 }] });
    await renderCheckout("/checkout");
    await screen.findByLabelText(CHECKOUT_COPY.fields.email.label);

    // The site header's search form and category nav are absent; the checkout
    // header renders its own steps instead, and the footer stays.
    expect(screen.queryByRole("search")).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Categorías" })).toBeNull();
    expect(screen.getByRole("contentinfo")).toBeTruthy();
  });

  it("still renders the site header on another route", async () => {
    await renderCheckout("/cart");

    expect(await screen.findByRole("banner")).toBeTruthy();
    // The category rail belongs to the home page, so the cart header keeps only
    // the search bar and the account chips.
    expect(screen.queryByRole("navigation", { name: "Categorías" })).toBeNull();
  });
});
