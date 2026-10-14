// @vitest-environment jsdom
import type { ReactNode } from "react";

import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CartEmpty } from "@/features/cart/components/cart-empty";
import { CartLine } from "@/features/cart/components/cart-line";
import { CouponField } from "@/features/cart/components/coupon-field";
import { FreeShippingMeter } from "@/features/cart/components/free-shipping-meter";
import { OrderConfirmationDialog } from "@/features/cart/components/order-confirmation-dialog";
import { OrderSummary } from "@/features/cart/components/order-summary";
import { SavedForLater } from "@/features/cart/components/saved-for-later";
import { CART_COPY } from "@/features/cart/data/cart-copy";
import { computeTotals, type CartItem } from "@/features/cart/lib/totals";
import { PRODUCT_QUANTITY_COPY } from "@/features/catalog/data/product-detail-content";
import { products } from "@/features/catalog/data/products";
import { quantityLimit } from "@/features/catalog/lib/product-detail";
import type { Product } from "@/features/catalog/schemas/product";
import { COUPONS } from "@/lib/coupons";
import { formatMoney, roundMoney } from "@/lib/format";
import { useCartStore } from "@/stores/cart-store";
import { type LastOrder, useOrdersStore } from "@/stores/orders-store";
import { usePromoStore } from "@/stores/promo-store";
import { useSavedStore } from "@/stores/saved-store";

vi.mock("sonner", () => ({ toast: vi.fn() }));

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/**
 * Renders `ui` as the root route of a memory router, so the components that use
 * `Link` resolve their targets. The extra routes exist only so those links have
 * somewhere to point. The router mounts asynchronously, so a caller waits for its
 * first `findBy*` before asserting.
 */
function renderInRouter(ui: ReactNode) {
  const rootRoute = createRootRoute({ component: () => <>{ui}</> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => null,
  });
  const productsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/products",
    component: () => null,
  });
  const productDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/products/$productId",
    component: () => null,
  });
  const checkoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/checkout",
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([
    indexRoute,
    productsRoute,
    productDetailRoute,
    checkoutRoute,
  ]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  return render(<RouterProvider router={router} />);
}

/** A product whose price is under the free-shipping threshold and does not ship free. */
const shortProduct = products.find((product) => !product.freeShipping && product.price < 50);

/** A product that does not ship free but clears the threshold on its own. */
const reachedProduct = products.find((product) => !product.freeShipping && product.price >= 50);

/** A product that ships free, so a cart of it alone qualifies anywhere. */
const freeShippingProduct = products.find((product) => product.freeShipping);

if (shortProduct === undefined || reachedProduct === undefined || freeShippingProduct === undefined) {
  throw new Error("test fixture expects short, reached and free-shipping products");
}

/** Builds the item a `CartLine` receives from a product and a quantity. */
function buildItem(product: Product, quantity: number): CartItem {
  const unitPrice = roundMoney(product.price);
  return { product, quantity, unitPrice, lineSubtotal: roundMoney(unitPrice * quantity) };
}

/** The catalogue with one short product flipped to free shipping, for the all-free case. */
const allFreeProducts = products.map((product) =>
  product.id === shortProduct.id ? { ...product, freeShipping: true } : product,
);

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  useCartStore.setState({ lines: [] });
  useSavedStore.setState({ ids: [] });
  usePromoStore.setState({ code: null });
  useOrdersStore.setState({ lastOrder: null, pendingConfirmation: false });
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe("FreeShippingMeter", () => {
  it("announces the remaining amount and reports a progress below the threshold", () => {
    const totals = computeTotals([{ id: shortProduct.id, quantity: 1 }], products, null);
    render(<FreeShippingMeter totals={totals} />);

    const progressbar = screen.getByRole("progressbar", {
      name: CART_COPY.freeShipping.progressLabel,
    });
    expect(progressbar.getAttribute("aria-valuemin")).toBe("0");
    expect(progressbar.getAttribute("aria-valuemax")).toBe("100");
    expect(progressbar.getAttribute("aria-valuenow")).toBe(
      String(Math.round(totals.freeShippingProgress * 100)),
    );
    expect(
      screen.getByText(CART_COPY.freeShipping.remaining(formatMoney(totals.freeShippingRemaining))),
    ).toBeTruthy();
  });

  it("announces success and reaches 100 when the subtotal clears the threshold", () => {
    const totals = computeTotals([{ id: reachedProduct.id, quantity: 1 }], products, null);
    render(<FreeShippingMeter totals={totals} />);

    expect(totals.freeShippingApplied).toBe(true);
    const progressbar = screen.getByRole("progressbar", {
      name: CART_COPY.freeShipping.progressLabel,
    });
    expect(progressbar.getAttribute("aria-valuenow")).toBe("100");
    expect(screen.getByText(CART_COPY.freeShipping.reached)).toBeTruthy();
  });

  it("announces success when every line ships free below the threshold", () => {
    const totals = computeTotals([{ id: shortProduct.id, quantity: 1 }], allFreeProducts, null);

    expect(totals.subtotal).toBeLessThan(50);
    expect(totals.freeShippingApplied).toBe(true);

    render(<FreeShippingMeter totals={totals} />);
    expect(
      screen
        .getByRole("progressbar", { name: CART_COPY.freeShipping.progressLabel })
        .getAttribute("aria-valuenow"),
    ).toBe("100");
    expect(screen.getByText(CART_COPY.freeShipping.reached)).toBeTruthy();
  });

  it("renders nothing for an empty cart", () => {
    const totals = computeTotals([], products, null);
    const { container } = render(<FreeShippingMeter totals={totals} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("CartLine", () => {
  it("disables the decrease control at the floor of one", async () => {
    renderInRouter(
      <ul>
        <CartLine item={buildItem(shortProduct, 1)} />
      </ul>,
    );

    const decrease = await screen.findByRole("button", {
      name: PRODUCT_QUANTITY_COPY.decreaseLabel,
    });
    expect((decrease as HTMLButtonElement).disabled).toBe(true);
  });

  it("disables the increase control at the product's ceiling", async () => {
    const limit = quantityLimit(shortProduct);
    renderInRouter(
      <ul>
        <CartLine item={buildItem(shortProduct, limit)} />
      </ul>,
    );

    const increase = await screen.findByRole("button", {
      name: PRODUCT_QUANTITY_COPY.increaseLabel,
    });
    expect((increase as HTMLButtonElement).disabled).toBe(true);
  });

  it("writes a quantity change back through the cart store", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ lines: [{ id: shortProduct.id, quantity: 1 }] });
    renderInRouter(
      <ul>
        <CartLine item={buildItem(shortProduct, 1)} />
      </ul>,
    );

    await user.click(
      await screen.findByRole("button", { name: PRODUCT_QUANTITY_COPY.increaseLabel }),
    );

    expect(useCartStore.getState().lines).toEqual([{ id: shortProduct.id, quantity: 2 }]);
  });

  it("removes the line through the cart store", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ lines: [{ id: shortProduct.id, quantity: 2 }] });
    renderInRouter(
      <ul>
        <CartLine item={buildItem(shortProduct, 2)} />
      </ul>,
    );

    await user.click(
      await screen.findByRole("button", {
        name: CART_COPY.line.removeLabel(shortProduct.name),
      }),
    );

    expect(useCartStore.getState().lines).toEqual([]);
  });

  it("saves the line for later through the saved store", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ lines: [{ id: shortProduct.id, quantity: 2 }] });
    renderInRouter(
      <ul>
        <CartLine item={buildItem(shortProduct, 2)} />
      </ul>,
    );

    await user.click(
      await screen.findByRole("button", { name: CART_COPY.line.saveLabel(shortProduct.name) }),
    );

    expect(useSavedStore.getState().ids).toEqual([shortProduct.id]);
    // Saving for later is the inverse of moving to the cart: the line leaves it.
    expect(useCartStore.getState().lines).toEqual([]);
  });

  it("shows the product name, its link, the unit price and the line subtotal", async () => {
    const item = buildItem(shortProduct, 3);
    renderInRouter(
      <ul>
        <CartLine item={item} />
      </ul>,
    );

    const link = await screen.findByRole("link", { name: shortProduct.name });
    expect(link.getAttribute("href")).toBe(`/products/${shortProduct.id}`);
    expect(screen.getByText(formatMoney(item.unitPrice))).toBeTruthy();
    expect(screen.getByText(formatMoney(item.lineSubtotal))).toBeTruthy();
  });
});

describe("SavedForLater", () => {
  it("renders nothing when there is nothing saved", () => {
    const { container } = render(<SavedForLater />);
    expect(container.innerHTML).toBe("");
  });

  it("moves a saved product into the cart and out of the saved list", async () => {
    const user = userEvent.setup();
    useSavedStore.setState({ ids: [shortProduct.id] });
    renderInRouter(<SavedForLater />);

    await user.click(
      await screen.findByRole("button", {
        name: CART_COPY.saved.moveToCartLabel(shortProduct.name),
      }),
    );

    expect(useCartStore.getState().lines).toEqual([{ id: shortProduct.id, quantity: 1 }]);
    expect(useSavedStore.getState().ids).toEqual([]);
  });

  it("removes a saved product without touching the cart", async () => {
    const user = userEvent.setup();
    useSavedStore.setState({ ids: [shortProduct.id] });
    renderInRouter(<SavedForLater />);

    await user.click(
      await screen.findByRole("button", {
        name: CART_COPY.saved.removeLabel(shortProduct.name),
      }),
    );

    expect(useSavedStore.getState().ids).toEqual([]);
    expect(useCartStore.getState().lines).toEqual([]);
  });
});

describe("cart CouponField", () => {
  const coupon = COUPONS.EMOX10;

  if (coupon === undefined) {
    throw new Error("test fixture expects the coupon table to carry EMOX10");
  }

  it("applies a valid code, naming its label in the live region and the store", async () => {
    const user = userEvent.setup();
    render(<CouponField />);

    await user.type(screen.getByLabelText(CART_COPY.coupon.label), coupon.code);
    await user.click(screen.getByRole("button", { name: CART_COPY.coupon.submitLabel }));

    expect(screen.getByRole("status").textContent).toBe(CART_COPY.coupon.applied(coupon.label));
    expect(usePromoStore.getState().code).toBe(coupon.code);
  });

  it("rejects an unknown code without touching the applied coupon", async () => {
    const user = userEvent.setup();
    usePromoStore.setState({ code: coupon.code });
    render(<CouponField />);

    await user.type(screen.getByLabelText(CART_COPY.coupon.label), "NO-EXISTE");
    await user.click(screen.getByRole("button", { name: CART_COPY.coupon.submitLabel }));

    expect(screen.getByRole("status").textContent).toBe(CART_COPY.coupon.rejected);
    expect(usePromoStore.getState().code).toBe(coupon.code);
    expect(screen.getByLabelText(CART_COPY.coupon.label).getAttribute("aria-invalid")).toBe("true");
  });

  it("clears the applied coupon and announces it", async () => {
    const user = userEvent.setup();
    usePromoStore.setState({ code: coupon.code });
    render(<CouponField />);

    await user.click(screen.getByRole("button", { name: CART_COPY.coupon.clearLabel }));

    expect(usePromoStore.getState().code).toBeNull();
    expect(screen.getByRole("status").textContent).toBe(CART_COPY.coupon.cleared);
  });
});

describe("OrderSummary", () => {
  it("omits the discount line when nothing is discounted", async () => {
    const totals = computeTotals([{ id: shortProduct.id, quantity: 1 }], products, null);
    renderInRouter(<OrderSummary totals={totals} />);

    await screen.findByRole("link", { name: CART_COPY.summary.checkout });
    expect(totals.discount).toBe(0);
    expect(screen.queryByText(CART_COPY.summary.discount)).toBeNull();
    expect(screen.getByText(formatMoney(totals.subtotal))).toBeTruthy();
    expect(screen.getByText(formatMoney(totals.total))).toBeTruthy();
  });

  it("includes the discount line and the free-shipping wording", async () => {
    const totals = computeTotals(
      [{ id: reachedProduct.id, quantity: 1 }],
      products,
      COUPONS.EMOX10 ?? null,
    );
    renderInRouter(<OrderSummary totals={totals} />);

    await screen.findByRole("link", { name: CART_COPY.summary.checkout });
    expect(totals.discount).toBeGreaterThan(0);
    expect(screen.getByText(CART_COPY.summary.discount)).toBeTruthy();
    expect(screen.getByText(`-${formatMoney(totals.discount)}`)).toBeTruthy();
    expect(screen.getByText(CART_COPY.summary.freeShipping)).toBeTruthy();
  });
});

describe("CartEmpty", () => {
  it("renders the catalogue call to action and no money", async () => {
    renderInRouter(<CartEmpty />);

    const cta = await screen.findByRole("link", { name: CART_COPY.empty.cta });
    expect(cta.getAttribute("href")).toBe("/products");
    expect(screen.getByText(CART_COPY.empty.message)).toBeTruthy();
  });
});

describe("OrderConfirmationDialog", () => {
  const order: LastOrder = {
    ref: "MC-1001",
    total: 89.95,
    items: [{ id: 1, quantity: 2 }],
    email: "ana@example.com",
    date: "2024-10-01T12:00:00.000Z",
  };

  it("renders only when an order exists and the flag is set", () => {
    useOrdersStore.setState({ lastOrder: order, pendingConfirmation: false });
    render(<OrderConfirmationDialog />);
    expect(screen.queryByRole("alertdialog")).toBeNull();

    act(() => {
      useOrdersStore.setState({ lastOrder: null, pendingConfirmation: true });
    });
    expect(screen.queryByRole("alertdialog")).toBeNull();

    act(() => {
      useOrdersStore.setState({ lastOrder: order, pendingConfirmation: true });
    });
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText(CART_COPY.confirmation.title)).toBeTruthy();
    expect(screen.getByText(CART_COPY.confirmation.description(order.ref))).toBeTruthy();
    expect(screen.getByText(formatMoney(order.total))).toBeTruthy();
  });

  it("dismisses the confirmation on close", async () => {
    const user = userEvent.setup();
    useOrdersStore.setState({ lastOrder: order, pendingConfirmation: true });
    render(<OrderConfirmationDialog />);

    await user.click(screen.getByRole("button", { name: CART_COPY.confirmation.close }));

    expect(useOrdersStore.getState().pendingConfirmation).toBe(false);
  });
});

describe("OrderSummary clear-cart dialog", () => {
  it("clears every line when the destructive confirm is pressed", async () => {
    const user = userEvent.setup();
    useCartStore.setState({
      lines: [
        { id: shortProduct.id, quantity: 1 },
        { id: reachedProduct.id, quantity: 2 },
      ],
    });
    const totals = computeTotals(useCartStore.getState().lines, products, null);
    renderInRouter(<OrderSummary totals={totals} />);

    await user.click(
      await screen.findByRole("button", { name: CART_COPY.summary.clearCart }),
    );
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: CART_COPY.clearDialog.confirm }));

    expect(useCartStore.getState().lines).toEqual([]);
  });
});
