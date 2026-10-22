// @vitest-environment jsdom
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CheckoutHeader } from "@/components/layout/checkout-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProductCard } from "@/features/catalog/components/product-card";
import { products } from "@/features/catalog/data/products";
import { productsSearchSchema } from "@/features/catalog/schemas/products-search";
import { parseSearchParams, stringifySearchParams } from "@/lib/search-params";
import { useCartStore } from "@/stores/cart-store";

/** The Tailwind `z-<n>` step a node declares, or 0 when it declares none. */
function zIndexOf(element: Element): number {
  const match = (element.getAttribute("class") ?? "").match(/(?:^|\s)z-(\d+)(?:\s|$)/);
  return match?.[1] === undefined ? 0 : Number(match[1]);
}

const rootRoute = createRootRoute({
  component: () => (
    <div>
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
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

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: () => null,
});

const favoritosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/favoritos",
  component: () => null,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => null,
});

const ayudaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ayuda",
  component: () => null,
});

const breadcrumbsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/breadcrumbs",
  component: () => (
    <Breadcrumbs
      items={[
        { label: "Inicio", to: "/" },
        { label: "Carrito", to: "/cart" },
        { label: "Finalizar compra" },
      ]}
    />
  ),
});

/** A page whose content floats controls over an image, like the real grid does. */
const stackingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/stacking",
  component: () => {
    const product = products[0];
    if (product === undefined) throw new Error("test fixture expects at least one product");
    return <ProductCard product={product} />;
  },
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout-preview",
  component: () => <CheckoutHeader currentStep={2} />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  productsRoute,
  cartRoute,
  favoritosRoute,
  loginRoute,
  ayudaRoute,
  breadcrumbsRoute,
  checkoutRoute,
  stackingRoute,
]);

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    parseSearch: parseSearchParams,
    stringifySearch: stringifySearchParams,
  });
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  useCartStore.setState({ lines: [] });
});

afterEach(() => {
  cleanup();
});

describe("shared chrome", () => {
  it("renders the nine category links in the home header", async () => {
    renderAt("/");
    const header = await screen.findByRole("banner");
    const nav = within(header).getByRole("navigation", { name: "Categorías" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(9);
    expect(links[0]?.getAttribute("href")).toBe("/products");
    expect(links[1]?.getAttribute("href")).toBe("/products?cat=Graduaci%C3%B3n");
  });

  it("renders the announcement strip above the sticky header, not inside it", async () => {
    renderAt("/");
    const bar = await screen.findByRole("complementary", { name: "Anuncios" });
    const header = await screen.findByRole("banner");

    expect(header.contains(bar)).toBe(false);
    expect(bar.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps the sticky header above the floating controls of the page content", async () => {
    renderAt("/stacking");
    const header = await screen.findByRole("banner");
    const product = products[0];
    if (product === undefined) throw new Error("test fixture expects at least one product");
    const favourite = await screen.findByRole("button", {
      name: `Añadir ${product.name} a favoritos`,
    });

    // The card control floats over its own image, but never over the chrome: a tie
    // would let the later node in the DOM win, which is exactly the scroll bug.
    expect(zIndexOf(favourite)).toBeGreaterThan(0);
    expect(zIndexOf(header)).toBeGreaterThan(zIndexOf(favourite));
  });

  it("keeps the search bar and the account chips on every route", async () => {
    renderAt("/products?cat=Globos");
    const header = await screen.findByRole("banner");
    expect(within(header).getByRole("search")).toBeTruthy();
    expect(within(header).getByRole("link", { name: "Carrito" })).toBeTruthy();
  });

  it("hides the category rail outside the home page", async () => {
    renderAt("/products?cat=Globos");
    const header = await screen.findByRole("banner");
    expect(within(header).queryByRole("navigation", { name: "Categorías" })).toBeNull();
  });

  it("hides the category rail on a filtered products listing", async () => {
    renderAt("/products?q=globo");
    const header = await screen.findByRole("banner");
    expect(within(header).queryByRole("navigation", { name: "Categorías" })).toBeNull();
  });

  it("shows the cart store unit count in the cart badge", async () => {
    useCartStore.setState({ lines: [{ id: 1, quantity: 3 }] });
    renderAt("/");
    const header = await screen.findByRole("banner");
    const cart = within(header).getByRole("link", { name: "Carrito" });
    expect(within(cart).getByText("3")).toBeTruthy();
  });

  it("keeps the account label desktop-only and the cart icon-only", async () => {
    renderAt("/");
    const header = await screen.findByRole("banner");

    const account = within(header).getByRole("link", { name: "Iniciar sesión" });
    const label = account.querySelector("span");
    expect(label?.textContent).toBe("Iniciar sesión");
    expect(label?.className).toContain("hidden");
    expect(label?.className).toContain("md:inline");

    const cart = within(header).getByRole("link", { name: "Carrito" });
    expect(within(cart).queryByText("Carrito")).toBeNull();
    expect(cart.querySelector("span:not([data-slot='badge'])")).toBeNull();
    expect(within(cart).getByText("0")).toBeTruthy();
  });

  it("orders account, favourites and cart with their Spanish accessible names", async () => {
    renderAt("/");
    const header = await screen.findByRole("banner");
    const account = within(header).getByRole("link", { name: "Iniciar sesión" });
    const actions = account.parentElement as HTMLElement;

    const actionLinks = within(actions).getAllByRole("link");
    expect(actionLinks.map((link) => link.getAttribute("aria-label"))).toEqual([
      "Iniciar sesión",
      "Favoritos",
      "Carrito",
    ]);
  });

  it("renders the footer link groups and the help links", async () => {
    renderAt("/");
    const footer = await screen.findByRole("contentinfo");
    expect(within(footer).getByRole("heading", { name: "Comprar" })).toBeTruthy();
    expect(within(footer).getByRole("heading", { name: "Ayuda" })).toBeTruthy();
    expect(within(footer).getByRole("heading", { name: "Empresa" })).toBeTruthy();

    const company = within(footer).getByRole("navigation", { name: "Empresa" });
    const companyLinks = within(company).getAllByRole("link");
    expect(companyLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/ayuda?tema=nosotros",
      "/ayuda?tema=privacidad",
      "/ayuda?tema=terminos",
    ]);
  });

  it("renders breadcrumbs with hidden separators and a plain last item", async () => {
    renderAt("/breadcrumbs");
    const nav = await screen.findByRole("navigation", { name: "Ruta de navegación" });
    expect(nav.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
    expect(within(nav).getAllByRole("link")).toHaveLength(2);
    expect(within(nav).queryByRole("link", { name: "Finalizar compra" })).toBeNull();
    expect(within(nav).getByText("Finalizar compra")).toBeTruthy();
  });

  it("marks the current checkout step", async () => {
    renderAt("/checkout-preview");
    const steps = await screen.findByRole("list", { name: "Pasos de la compra" });
    const current = steps.querySelector('[aria-current="step"]');
    expect(current?.textContent).toContain("Envío y pago");
  });
});
