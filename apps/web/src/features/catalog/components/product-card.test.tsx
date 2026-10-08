// @vitest-environment jsdom
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
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

function renderCard(): void {
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
  const routeTree = rootRoute.addChildren([indexRoute, productRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

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

  it("adds to the cart and toasts when the add-to-cart button is clicked", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(await screen.findByRole("button", { name: "Añadir al carrito" }));

    expect(selectCartUnits(useCartStore.getState())).toBe(1);
    expect(toast).toHaveBeenCalledWith("Añadido al carrito");
  });

  it("toggles the favourite pressed state and store on click", async () => {
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
  });
});
