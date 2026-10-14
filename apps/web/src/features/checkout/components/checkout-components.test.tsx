// @vitest-environment jsdom
import type { ReactNode } from "react";

import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TotalsRows } from "@/features/cart/components/totals-rows";
import { CART_COPY } from "@/features/cart/data/cart-copy";
import { computeTotals } from "@/features/cart/lib/totals";
import { AddressPanel } from "@/features/checkout/components/address-panel";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import { ShippingMethodPanel } from "@/features/checkout/components/shipping-method-panel";
import { CHECKOUT_COPY } from "@/features/checkout/data/checkout-copy";
import { checkoutErrorId } from "@/features/checkout/lib/field-ids";
import { createOrderRef } from "@/features/checkout/lib/order";
import {
  CHECKOUT_FIELD_ORDER,
  type CheckoutFieldName,
  type CheckoutValues,
} from "@/features/checkout/lib/validation";
import { products } from "@/features/catalog/data/products";
import { SHIPPING_METHOD_PRICES } from "@/lib/constants";
import { COUPONS } from "@/lib/coupons";
import { formatMoney } from "@/lib/format";
import { useCartStore } from "@/stores/cart-store";
import { useOrdersStore } from "@/stores/orders-store";
import { usePromoStore } from "@/stores/promo-store";

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/** A fixed instant injected into `CheckoutForm`, so the order ref is deterministic. */
const NOW = new Date(2026, 0, 15, 10, 0, 0);

/** A product under the free-shipping threshold that does not ship free. */
const shortProduct = products.find((product) => !product.freeShipping && product.price < 50);
/** A product that does not ship free but clears the threshold on its own. */
const reachedProduct = products.find((product) => !product.freeShipping && product.price >= 50);

if (shortProduct === undefined || reachedProduct === undefined) {
  throw new Error("test fixture expects short and reached products");
}

/** Every checkout field, blank, so a panel test can override just one. */
function emptyValues(): CheckoutValues {
  return Object.fromEntries(CHECKOUT_FIELD_ORDER.map((name) => [name, ""])) as CheckoutValues;
}

/** Finds a radio by a substring of its accessible name, which carries its label. */
function radio(label: string): HTMLElement {
  return screen.getByRole("radio", { name: new RegExp(label) });
}

/**
 * Renders `ui` as the root route of a memory router, so a component that uses
 * `Link` resolves its target. The router mounts asynchronously, so the caller
 * waits for its first `findBy*` or `getBy*` before asserting.
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
  const checkoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/checkout",
    component: () => null,
  });
  const cartRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/cart",
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([indexRoute, productsRoute, checkoutRoute, cartRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  useCartStore.setState({ lines: [] });
  usePromoStore.setState({ code: null });
  useOrdersStore.setState({ lastOrder: null, pendingConfirmation: false });
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  cleanup();
});

describe("AddressPanel error wiring", () => {
  it("marks the errored input invalid and points it at its message", () => {
    render(
      <AddressPanel
        values={emptyValues()}
        errors={{ email: "email" }}
        onChange={vi.fn()}
        onBlur={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(CHECKOUT_COPY.fields.email.label);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(checkoutErrorId("email"));
    expect(screen.getByText(CHECKOUT_COPY.errors.email)).toBeTruthy();
  });

  it("leaves a valid field without invalid or described-by wiring", () => {
    render(
      <AddressPanel
        values={emptyValues()}
        errors={{}}
        onChange={vi.fn()}
        onBlur={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(CHECKOUT_COPY.fields.email.label);
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(input.getAttribute("aria-describedby")).toBeNull();
  });
});

describe("ShippingMethodPanel", () => {
  it("renders every method's price", () => {
    render(
      <ShippingMethodPanel
        value="express"
        onChange={vi.fn()}
        freeStandardShipping={false}
      />,
    );

    expect(screen.getByText(formatMoney(SHIPPING_METHOD_PRICES.standard))).toBeTruthy();
    expect(screen.getByText(formatMoney(SHIPPING_METHOD_PRICES.express))).toBeTruthy();
    expect(screen.getByText(formatMoney(SHIPPING_METHOD_PRICES.pickup))).toBeTruthy();
  });

  it("reads the standard method as free when the cart qualifies", () => {
    render(
      <ShippingMethodPanel value="standard" onChange={vi.fn()} freeStandardShipping />,
    );

    expect(screen.getByText(CHECKOUT_COPY.shippingFree)).toBeTruthy();
  });
});

describe("TotalsRows", () => {
  it("omits the discount row when nothing is discounted", () => {
    const totals = computeTotals([{ id: shortProduct.id, quantity: 1 }], products, null);
    render(<TotalsRows totals={totals} />);

    expect(totals.discount).toBe(0);
    expect(screen.queryByText(CART_COPY.summary.discount)).toBeNull();
    expect(screen.getByText(formatMoney(totals.subtotal))).toBeTruthy();
    expect(screen.getByText(formatMoney(totals.total))).toBeTruthy();
  });

  it("shows the discount row when a coupon discounts the cart", () => {
    const totals = computeTotals(
      [{ id: reachedProduct.id, quantity: 1 }],
      products,
      COUPONS.EMOX10 ?? null,
    );
    render(<TotalsRows totals={totals} />);

    expect(totals.discount).toBeGreaterThan(0);
    expect(screen.getByText(CART_COPY.summary.discount)).toBeTruthy();
    expect(screen.getByText(`-${formatMoney(totals.discount)}`)).toBeTruthy();
  });
});

describe("CheckoutForm", () => {
  it("masks the card number, expiry and CVC through real typing", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CheckoutForm now={() => NOW} />);

    const cardNumber = screen.getByLabelText(CHECKOUT_COPY.fields.cardNumber.label);
    await user.type(cardNumber, "4111111111111111");
    expect((cardNumber as HTMLInputElement).value).toBe("4111 1111 1111 1111");

    const expiry = screen.getByLabelText(CHECKOUT_COPY.fields.cardExpiry.label);
    await user.type(expiry, "1228");
    expect((expiry as HTMLInputElement).value).toBe("12/28");

    const cvc = screen.getByLabelText(CHECKOUT_COPY.fields.cardCvc.label);
    await user.type(cvc, "12345");
    expect((cvc as HTMLInputElement).value).toBe("1234");
  });

  it("retotals when the shipping method changes", async () => {
    const user = userEvent.setup({ delay: null });
    const lines = [{ id: shortProduct.id, quantity: 1 }];
    useCartStore.setState({ lines });
    render(<CheckoutForm now={() => NOW} />);

    const standard = computeTotals(lines, products, null, "standard");
    const express = computeTotals(lines, products, null, "express");
    expect(standard.total).not.toBe(express.total);
    expect(screen.getByText(formatMoney(standard.total))).toBeTruthy();

    await user.click(radio(CHECKOUT_COPY.shipping.express.label));

    expect(screen.getByText(formatMoney(express.total))).toBeTruthy();
    expect(screen.queryByText(formatMoney(standard.total))).toBeNull();
  });

  it("focuses the error summary when a submit fails", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CheckoutForm now={() => NOW} />);

    await user.click(screen.getByRole("button", { name: CHECKOUT_COPY.submit }));

    const summary = await screen.findByRole("alert");
    expect(summary.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(summary);
  });

  it("does not steal focus back to the summary while the customer edits", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CheckoutForm now={() => NOW} />);

    await user.click(screen.getByRole("button", { name: CHECKOUT_COPY.submit }));
    await screen.findByRole("alert");

    const email = screen.getByLabelText(CHECKOUT_COPY.fields.email.label);
    await user.click(email);
    await user.type(email, "a");

    expect(document.activeElement).toBe(email);
  });

  it("writes the last order, sets the pending flag and clears the cart on success", async () => {
    const lines = [{ id: shortProduct.id, quantity: 1 }];
    useCartStore.setState({ lines });
    renderInRouter(<CheckoutForm now={() => NOW} />);

    // The router mounts asynchronously, so wait for its first field before filling.
    await screen.findByLabelText(CHECKOUT_COPY.fields.email.label);
    const fill: [CheckoutFieldName, string][] = [
      ["email", "ana@example.com"],
      ["firstName", "Ana"],
      ["lastName", "López"],
      ["phone", "12345678"],
      ["address", "Calle Uno 1-23"],
      ["city", "Guatemala"],
      ["postalCode", "01001"],
      ["cardNumber", "4111111111111111"],
      ["cardName", "Ana López"],
      ["cardExpiry", "12/30"],
      ["cardCvc", "123"],
    ];
    for (const [name, value] of fill) {
      fireEvent.change(screen.getByLabelText(CHECKOUT_COPY.fields[name].label), {
        target: { value },
      });
    }

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: CHECKOUT_COPY.submit }));
    act(() => {
      vi.advanceTimersByTime(600);
    });
    vi.useRealTimers();

    expect(useOrdersStore.getState().lastOrder?.ref).toBe(createOrderRef(NOW));
    expect(useOrdersStore.getState().lastOrder?.email).toBe("ana@example.com");
    expect(useOrdersStore.getState().pendingConfirmation).toBe(true);
    expect(useCartStore.getState().lines).toEqual([]);
    expect(localStorage.getItem("mc-last-order")).toContain(createOrderRef(NOW));
  });
});
