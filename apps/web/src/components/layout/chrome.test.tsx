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
import { productsSearchSchema } from "@/features/catalog/schemas/products-search";
import { parseSearchParams, stringifySearchParams } from "@/lib/search-params";
import { useCartStore } from "@/stores/cart-store";

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
  it("renders the nine category links in the header", async () => {
    renderAt("/");
    const header = await screen.findByRole("banner");
    const nav = within(header).getByRole("navigation", { name: "Categorías" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(9);
    expect(links[0]?.getAttribute("href")).toBe("/products");
    expect(links[1]?.getAttribute("href")).toBe("/products?cat=Graduaci%C3%B3n");
  });

  it("activates only the link whose search matches the URL exactly", async () => {
    renderAt("/products?cat=Globos");
    const header = await screen.findByRole("banner");
    const nav = within(header).getByRole("navigation", { name: "Categorías" });
    const active = nav.querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(1);
    expect(active[0]?.textContent).toBe("Globos");
  });

  it("leaves every category link inactive on an unrelated search", async () => {
    renderAt("/products?q=globo");
    const header = await screen.findByRole("banner");
    const nav = within(header).getByRole("navigation", { name: "Categorías" });
    expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
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
