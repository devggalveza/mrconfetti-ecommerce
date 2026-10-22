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
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { products } from "@/features/catalog/data/products";
import { ProductCard } from "@/features/catalog/components/product-card";
import { discountPercent } from "@/features/catalog/lib/selectors";
import { formatDiscount, formatMoney } from "@/lib/format";
import { useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";
import { selectCartUnits } from "@/stores/selectors";

vi.mock("sonner", () => ({ toast: vi.fn() }));

const product = products[0];
const paidShippingProduct = products.find((item) => !item.freeShipping);

if (paidShippingProduct === undefined) {
  throw new Error("test fixture expects a product without free shipping");
}

/** Accessible names the card's image-frame actions must expose. */
const ADD_NAME = `Agregar ${product.name} al carrito`;
const VIEW_NAME = `Ver ${product.name}`;

/** Mounts the card on a minimal router and returns it so navigation is assertable. */
function renderCard() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <ProductCard product={product} />,
  });
  const productRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/products/$productId",
    component: () => null,
  });
  // The card's add dialog links to the cart and to checkout, so both routes have
  // to exist on the test router for those links to resolve.
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
  const routeTree = rootRoute.addChildren([indexRoute, productRoute, cartRoute, checkoutRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  render(<RouterProvider router={router} />);

  return router;
}

beforeEach(() => {
  useCartStore.setState({ lines: [] });
  useFavoritesStore.setState({ ids: [] });
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("ProductCard", () => {
  it("renders the name, price, struck original, discount and free-shipping line", async () => {
    renderCard();

    expect(await screen.findByRole("heading", { name: product.name })).toBeTruthy();
    expect(screen.getByText(formatMoney(product.price))).toBeTruthy();
    expect(
      screen.getByText(formatMoney(product.original)).tagName.toLowerCase(),
    ).toBe("s");
    expect(screen.getByText(formatDiscount(discountPercent(product)))).toBeTruthy();
    expect(screen.getByText("Envío gratis")).toBeTruthy();
  });

  it("hides the free-shipping line when the flag is false", async () => {
    const rootRoute = createRootRoute({ component: () => <Outlet /> });
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: () => <ProductCard product={paidShippingProduct} />,
    });
    const productRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/products/$productId",
      component: () => null,
    });
    const routeTree = rootRoute.addChildren([indexRoute, productRoute]);
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: paidShippingProduct.name })).toBeTruthy();
    expect(screen.queryByText("Envío gratis")).toBeNull();
  });

  it("adds one unit, toasts and opens the confirmation dialog from the card", async () => {
    const user = userEvent.setup();
    const router = renderCard();

    const add = await screen.findByRole("button", { name: ADD_NAME });
    expect(add.getAttribute("aria-haspopup")).toBe("dialog");
    // Nothing is mounted until the control is used: a grid of cards must not pay
    // for a dialog it never shows.
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(add);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Añadido al carrito" })).toBeTruthy();
    expect(within(dialog).getByText(product.name)).toBeTruthy();

    // One click is the whole purchase step: the unit is in the cart before the
    // dialog appears and no confirmation button is left to press.
    expect(useCartStore.getState().lines).toEqual([{ id: product.id, quantity: 1 }]);
    expect(selectCartUnits(useCartStore.getState())).toBe(1);
    expect(toast).toHaveBeenCalledWith("Añadido al carrito");
    expect(within(dialog).queryByRole("button", { name: "Agregar al carrito" })).toBeNull();
    expect(router.state.location.pathname).toBe("/");
  });

  it("links Ver to the matching product detail route", async () => {
    const user = userEvent.setup();
    const router = renderCard();

    await user.click(await screen.findByRole("link", { name: VIEW_NAME }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/products/${product.id}`);
    });
  });

  it("keeps the actions inside the image frame with hover, focus and coarse-pointer reveals", async () => {
    renderCard();

    const add = await screen.findByRole("button", { name: ADD_NAME });
    const view = screen.getByRole("link", { name: VIEW_NAME });
    const frame = add.parentElement;

    // Exactly one cart control, and it lives inside the image frame: no standalone
    // purchase action is rendered beneath the card.
    expect(screen.getAllByRole("button", { name: /agregar .+ al carrito/i })).toHaveLength(1);
    expect(frame).not.toBeNull();
    expect(frame?.contains(view)).toBe(true);
    expect(frame?.getAttribute("class")).toContain("absolute");
    // Full-frame centre overlay: the controls sit over the whole image with a grey
    // translucent backdrop, not pinned to the bottom edge (regression: bottom-2).
    expect(frame?.getAttribute("class")).toContain("inset-0");
    expect(frame?.getAttribute("class")).toContain("items-center");
    expect(frame?.getAttribute("class")).toContain("justify-center");
    expect(frame?.getAttribute("class")).toContain("bg-gray-500/40");

    // Both actions are the same compact icon control: a 40px square, and more
    // rounded than the old rounded-md pill without becoming a full circle. Both
    // are clickable controls, so both must show the hand cursor.
    for (const control of [add, view]) {
      const controlClass = control.getAttribute("class") ?? "";
      expect(controlClass).toContain("size-10");
      expect(controlClass).toContain("rounded-xl");
      expect(controlClass).toContain("bg-white");
      expect(controlClass).toContain("border-gray-200");
      expect(controlClass).toContain("cursor-pointer");
      expect(controlClass).not.toContain("h-10");
      expect(controlClass).not.toContain("rounded-md");
      expect(controlClass).not.toContain("px-4");
    }

    // Icon-only: no visible verb or product text is rendered, the labels live in
    // visually hidden spans (not aria-label), and textContent keeps the same
    // "Ver <name>" / "Agregar <name> al carrito" wording the route test asserts.
    expect(add.textContent).toBe(ADD_NAME);
    expect(view.textContent).toBe(VIEW_NAME);
    expect(add.getAttribute("aria-label")).toBeNull();
    expect(view.getAttribute("aria-label")).toBeNull();
    for (const control of [add, view]) {
      const renderedChildren = Array.from(control.children);
      expect(renderedChildren).toHaveLength(2);
      const icon = control.querySelector("svg");
      expect(icon).not.toBeNull();
      expect(icon?.getAttribute("aria-hidden")).toBe("true");
      expect(icon?.getAttribute("class")).toContain("size-5");
      // The only visible child is the icon; everything else is visually hidden.
      const visibleChildren = renderedChildren.filter(
        (child) => !(child.getAttribute("class") ?? "").includes("sr-only"),
      );
      expect(visibleChildren).toEqual([icon]);
      expect(control.querySelector(".sr-only")?.textContent).not.toBe("");
    }
    // The link's visible wording is emitted by neither the icon nor a visible text
    // node: the sr-only span is the only node carrying it.
    expect(view.querySelectorAll("span:not(.sr-only)")).toHaveLength(0);

    // Sibling controls, never nested inside the image or title links.
    const [imageLink] = screen.getAllByRole("link", { name: product.name });
    expect(imageLink?.querySelector("button")).toBeNull();
    expect(add.closest("a")).toBeNull();
    expect(view.closest("a")).toBe(view);

    // The frame owns the CSS reveal: hover and focus-within open the overlay, and
    // no-hover devices keep it open because they cannot hover. Reduced motion drops
    // the transition without hiding the controls.
    const frameClass = frame?.getAttribute("class") ?? "";
    expect(frameClass).toContain("group-hover/image:opacity-100");
    expect(frameClass).toContain("group-focus-within/image:opacity-100");
    expect(frameClass).toContain("pointer-coarse:opacity-100");
    expect(frameClass).toContain("any-pointer-coarse:opacity-100");
    expect(frameClass).toContain("[@media(hover:none)]:opacity-100");
    expect(frameClass).toContain("motion-reduce:transition-none");

    // Controls stay inert until revealed, so an invisible control cannot swallow a
    // click, and focus-within reveals them so Tab never lands on an invisible trap.
    expect(add.getAttribute("class")).toContain("pointer-events-none");
    expect(add.getAttribute("class")).toContain("group-focus-within/image:pointer-events-auto");
    expect(add.getAttribute("class")).toContain("pointer-coarse:pointer-events-auto");
    expect(add.getAttribute("class")).toContain("[@media(hover:none)]:pointer-events-auto");
    expect(view.getAttribute("class")).toContain("group-hover/image:pointer-events-auto");

    // The favourite keeps its own stacking above the overlay.
    const favorite = screen.getByRole("button", { name: `Añadir ${product.name} a favoritos` });
    expect(favorite.getAttribute("class")).toContain("z-20");
    expect(frameClass).toContain("z-10");
  });

  it("toggles the favourite state, store and toast on both clicks", async () => {
    const user = userEvent.setup();
    renderCard();

    const favourite = await screen.findByRole("button", {
      name: `Añadir ${product.name} a favoritos`,
    });
    expect(favourite.getAttribute("aria-pressed")).toBe("false");

    await user.click(favourite);

    expect(useFavoritesStore.getState().ids).toContain(product.id);
    expect(toast).toHaveBeenCalledWith("Añadido a favoritos");

    const pressed = await screen.findByRole("button", {
      name: `Quitar ${product.name} de favoritos`,
    });
    expect(pressed.getAttribute("aria-pressed")).toBe("true");

    await user.click(pressed);

    expect(useFavoritesStore.getState().ids).not.toContain(product.id);
    expect(toast).toHaveBeenCalledWith("Quitado de favoritos");

    const released = await screen.findByRole("button", {
      name: `Añadir ${product.name} a favoritos`,
    });
    expect(released.getAttribute("aria-pressed")).toBe("false");
  });
});
