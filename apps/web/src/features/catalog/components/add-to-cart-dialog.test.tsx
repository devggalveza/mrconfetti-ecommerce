// @vitest-environment jsdom
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AddToCartDialog } from "@/features/catalog/components/add-to-cart-dialog";
import {
  PRODUCT_QUANTITY_COPY,
  PRODUCT_STOCK_COPY,
} from "@/features/catalog/data/product-detail-content";
import { products } from "@/features/catalog/data/products";
import { quantityLimit } from "@/features/catalog/lib/product-detail";
import { formatMoney } from "@/lib/format";
import { useCartStore } from "@/stores/cart-store";

const product = products[0];
const limit = quantityLimit(product);

/**
 * Visible labels of the dialog. The card adds the unit before opening, so the
 * dialog's job is the confirmation and its three exits, in that priority order.
 */
const COPY = {
  title: "Añadido al carrito",
  keepShopping: "Continuar comprando",
  checkout: "Continuar con el pago",
  cart: "Ver mi carrito",
} as const;

/**
 * Mounts the dialog on a minimal router so the two navigation actions can be
 * asserted against the router's own location instead of a mocked navigate.
 */
function renderDialog(onClose: () => void = vi.fn()) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <AddToCartDialog product={product} onClose={onClose} />,
  });
  const cartRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/cart",
    component: () => null,
  });
  const checkoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/checkout",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, cartRoute, checkoutRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  render(<RouterProvider router={router} />);

  return router;
}

/** The quantity the stepper displays; `<output>` carries the `status` role. */
function quantityValue(dialog: HTMLElement): string {
  return within(dialog).getByRole("status").textContent ?? "";
}

beforeEach(() => {
  // The card already added the unit before opening the dialog.
  useCartStore.setState({ lines: [{ id: product.id, quantity: 1 }] });
});

afterEach(() => {
  cleanup();
});

describe("AddToCartDialog", () => {
  it("confirms the add and shows the product, the unit price and the total", async () => {
    renderDialog();

    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: COPY.title })).toBeTruthy();
    expect(within(dialog).getByText(product.name)).toBeTruthy();
    expect(quantityValue(dialog)).toBe("1");
    // Unit price plus the total, which agree while the quantity is one.
    expect(within(dialog).getAllByText(formatMoney(product.price))).toHaveLength(2);
  });

  it("edits the cart line quantity with the plus and minus buttons", async () => {
    const user = userEvent.setup();
    renderDialog();

    const dialog = await screen.findByRole("dialog");
    const decrease = within(dialog).getByRole("button", {
      name: PRODUCT_QUANTITY_COPY.decreaseLabel,
    });
    const increase = within(dialog).getByRole("button", {
      name: PRODUCT_QUANTITY_COPY.increaseLabel,
    });

    // The floor is one unit: the decrease control starts disabled.
    expect(decrease).toHaveProperty("disabled", true);

    await user.click(increase);
    await user.click(increase);

    expect(quantityValue(dialog)).toBe("3");
    expect(useCartStore.getState().lines).toEqual([{ id: product.id, quantity: 3 }]);
    expect(within(dialog).getByText(formatMoney(product.price * 3))).toBeTruthy();

    await user.click(decrease);

    expect(quantityValue(dialog)).toBe("2");
    expect(useCartStore.getState().lines).toEqual([{ id: product.id, quantity: 2 }]);
    expect(within(dialog).getByText(formatMoney(product.price * 2))).toBeTruthy();
  });

  it("stops the quantity at the product limit", async () => {
    const user = userEvent.setup();
    renderDialog();

    const dialog = await screen.findByRole("dialog");
    const increase = within(dialog).getByRole("button", {
      name: PRODUCT_QUANTITY_COPY.increaseLabel,
    });

    for (let step = 1; step < limit; step += 1) {
      await user.click(increase);
    }

    expect(quantityValue(dialog)).toBe(String(limit));
    expect(useCartStore.getState().lines).toEqual([{ id: product.id, quantity: limit }]);
    expect(increase).toHaveProperty("disabled", true);
  });

  it("orders the three exits as keep shopping, payment, then cart, with spacing", async () => {
    renderDialog();

    const dialog = await screen.findByRole("dialog");
    const keepShopping = within(dialog).getByRole("button", { name: COPY.keepShopping });
    const checkout = within(dialog).getByRole("link", { name: COPY.checkout });
    const cart = within(dialog).getByRole("link", { name: COPY.cart });

    // Priority order is readable in DOM order, so it also survives a screen reader.
    expect(
      keepShopping.compareDocumentPosition(checkout) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(checkout.compareDocumentPosition(cart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // The three actions share one group with the roomier gap.
    const group = keepShopping.parentElement;
    expect(group?.contains(checkout)).toBe(true);
    expect(group?.contains(cart)).toBe(true);
    expect(group?.getAttribute("class")).toContain("gap-3");
  });

  it("closes on Continuar comprando without touching the cart or the route", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const router = renderDialog(onClose);

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: COPY.keepShopping }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(useCartStore.getState().lines).toEqual([{ id: product.id, quantity: 1 }]);
    expect(router.state.location.pathname).toBe("/");
  });

  it("closes from the close control of the ported dialog", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog(onClose);

    const dialog = await screen.findByRole("dialog");
    const close = within(dialog).getByRole("button", { name: "Cerrar" });

    // The design system's 44px touch target, not the registry's 28px control.
    expect(close.getAttribute("class")).toContain("size-11");

    await user.click(close);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("continues to the payment step from Continuar con el pago", async () => {
    const user = userEvent.setup();
    const router = renderDialog();

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("link", { name: COPY.checkout }));

    expect(useCartStore.getState().lines).toEqual([{ id: product.id, quantity: 1 }]);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/checkout");
    });
  });

  it("opens the cart from Ver mi carrito", async () => {
    const user = userEvent.setup();
    const router = renderDialog();

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("link", { name: COPY.cart }));

    expect(useCartStore.getState().lines).toEqual([{ id: product.id, quantity: 1 }]);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/cart");
    });
  });

  it("says the product is sold out and drops the quantity editor when there is no stock", async () => {
    useCartStore.setState({ lines: [] });
    const soldOut = { ...product, stock: 0 };
    const rootRoute = createRootRoute({ component: () => <Outlet /> });
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: () => <AddToCartDialog product={soldOut} onClose={vi.fn()} />,
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    render(<RouterProvider router={router} />);

    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText(PRODUCT_STOCK_COPY.outOfStock)).toBeTruthy();
    expect(within(dialog).queryByRole("status")).toBeNull();
    expect(within(dialog).queryByRole("button", { name: PRODUCT_QUANTITY_COPY.increaseLabel })).toBeNull();
    // Nothing was written, so no total is claimed either.
    expect(within(dialog).queryByText("Total")).toBeNull();
  });

  it("pads its content one 24px step away from its own border", async () => {
    renderDialog();

    const dialog = await screen.findByRole("dialog");
    const dialogClasses = (dialog.getAttribute("class") ?? "").split(/\s+/);

    // `p-6` is the 24px step the alert dialogs already use; `p-4` read as cramped.
    // Matched per token, because `gap-4` also contains the substring `p-4`.
    expect(dialogClasses).toContain("p-6");
    expect(dialogClasses).not.toContain("p-4");

    // The close control is inset by the 16px step, and the header reserves its box
    // so the title never runs underneath it.
    const closeClasses = (within(dialog).getByRole("button", { name: "Cerrar" }).getAttribute("class") ?? "").split(
      /\s+/,
    );
    expect(closeClasses).toContain("top-4");
    expect(closeClasses).toContain("right-4");

    const header = within(dialog).getByRole("heading", { name: COPY.title }).parentElement;
    expect((header?.getAttribute("class") ?? "").split(/\s+/)).toContain("pr-16");
  });
});
