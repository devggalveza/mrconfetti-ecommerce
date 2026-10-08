// @vitest-environment jsdom
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductRail } from "@/features/catalog/components/product-rail";
import { products } from "@/features/catalog/data/products";
import { useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";

const RAIL_PRODUCTS = products.slice(0, 3);

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

vi.mock("sonner", () => ({ toast: vi.fn() }));

function renderRail(): HTMLElement {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <ProductRail
        products={RAIL_PRODUCTS}
        title="Ofertas"
        headingId="rail-heading"
        actionHref="/products?deal=true"
      />
    ),
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

  return render(<RouterProvider router={router} />).container;
}

/** jsdom has no layout, so the rail's scroll metrics are stubbed explicitly. */
function stubScrollMetrics(
  rail: HTMLElement,
  metrics: { scrollWidth: number; clientWidth: number; scrollLeft: number },
): void {
  Object.defineProperty(rail, "scrollWidth", { configurable: true, value: metrics.scrollWidth });
  Object.defineProperty(rail, "clientWidth", { configurable: true, value: metrics.clientWidth });
  Object.defineProperty(rail, "scrollLeft", {
    configurable: true,
    writable: true,
    value: metrics.scrollLeft,
  });
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  useCartStore.setState({ lines: [] });
  useFavoritesStore.setState({ ids: [] });
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe("ProductRail", () => {
  it("renders one list item per product", async () => {
    const container = renderRail();
    await screen.findByRole("list", { name: "Ofertas" });

    expect(container.querySelectorAll("li")).toHaveLength(RAIL_PRODUCTS.length);
  });

  it("disables the left arrow at the start and re-enables the right arrow away from the edge", async () => {
    const container = renderRail();
    await screen.findByRole("list", { name: "Ofertas" });

    const left = screen.getByRole("button", { name: "Desplazar a la izquierda" });
    const right = screen.getByRole("button", { name: "Desplazar a la derecha" });

    expect((left as HTMLButtonElement).disabled).toBe(true);
    expect((right as HTMLButtonElement).disabled).toBe(false);

    const rail = container.querySelector("ul");
    if (rail === null) {
      throw new Error("rail list is missing");
    }

    stubScrollMetrics(rail, { scrollWidth: 1000, clientWidth: 400, scrollLeft: 0 });
    fireEvent.scroll(rail);

    await waitFor(() => {
      expect((left as HTMLButtonElement).disabled).toBe(true);
      expect((right as HTMLButtonElement).disabled).toBe(false);
    });
  });

  it("disables the right arrow once the rail reaches its right edge", async () => {
    const container = renderRail();
    await screen.findByRole("list", { name: "Ofertas" });

    const right = screen.getByRole("button", { name: "Desplazar a la derecha" });
    const rail = container.querySelector("ul");
    if (rail === null) {
      throw new Error("rail list is missing");
    }

    stubScrollMetrics(rail, { scrollWidth: 1000, clientWidth: 400, scrollLeft: 600 });
    fireEvent.scroll(rail);

    await waitFor(() => {
      expect((right as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
