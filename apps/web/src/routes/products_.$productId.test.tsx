// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useSearch,
} from "@tanstack/react-router";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PRODUCT_ADD_TO_CART_COPY,
  PRODUCT_COUPON_COPY,
  PRODUCT_GALLERY_COPY,
  PRODUCT_INSTALMENTS_COPY,
  PRODUCT_NOT_FOUND_COPY,
  PRODUCT_OPTION_COPY,
  PRODUCT_QUANTITY_COPY,
  PRODUCT_RELATED_COPY,
  PRODUCT_REVIEWS_COPY,
  PRODUCT_STICKY_BAR_COPY,
  PRODUCT_STOCK_COPY,
  PRODUCT_TABS_COPY,
} from "@/features/catalog/data/product-detail-content";
import { products } from "@/features/catalog/data/products";
import { instalments, priceWithPack, quantityLimit } from "@/features/catalog/lib/product-detail";
import { relatedProducts } from "@/features/catalog/lib/selectors";
import { productsSearchSchema } from "@/features/catalog/schemas/products-search";
import { MAX_QUANTITY } from "@/lib/constants";
import { formatMoney, formatRating, formatRatingValue, formatReviewCount } from "@/lib/format";
import { parseSearchParams, stringifySearchParams } from "@/lib/search-params";
import { routeTree } from "@/routeTree.gen";
import { useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";
import { selectCartUnits } from "@/stores/selectors";

import { Route as productDetailRoute } from "./products_.$productId";

// The real generated tree's root document renders the app's `<Toaster/>`, so the
// mock has to provide that export as well as the `toast` function the page calls.
vi.mock("sonner", () => ({ toast: vi.fn(), Toaster: () => null }));

/** A row whose stock is under the per-order ceiling, so its stock sets the ceiling. */
const belowCeilingProduct = products.find((product) => product.stock < MAX_QUANTITY);

/** A row with stock above the per-order ceiling, so the ceiling is the order limit. */
const aboveCeilingProduct = products.find((product) => product.stock > MAX_QUANTITY);

/**
 * Wait longer than the route's own pending delay, so a timer that was not cancelled
 * by the unmount has every chance to fire before the assertion runs.
 */
const ADD_SETTLE_MS = 900;

/** Moves to another product the way a shopper does: through a related-rail card. */
async function navigateThroughRail(
  user: ReturnType<typeof userEvent.setup>,
  targetProductId: number,
): Promise<void> {
  const rail = await screen.findByRole("list", { name: PRODUCT_RELATED_COPY.heading });
  const railLink = rail.querySelector(`a[href="/products/${targetProductId}"]`);

  if (railLink === null) {
    throw new Error(`the related rail does not link to product ${targetProductId}`);
  }

  await user.click(railLink);
}

if (belowCeilingProduct === undefined || aboveCeilingProduct === undefined) {
  throw new Error("test fixture expects products below and above the per-order ceiling");
}

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

type ObserverEntry = { isIntersecting: boolean; boundingClientRect: { top: number } };
type ObserverCallback = (entries: ObserverEntry[]) => void;

/** Callbacks and targets captured from the sticky bar's observer. */
const observerCallbacks: ObserverCallback[] = [];
const observedTargets: Element[] = [];

class IntersectionObserverStub {
  constructor(callback: ObserverCallback) {
    observerCallbacks.push(callback);
  }

  observe(target: Element): void {
    observedTargets.push(target);
  }

  unobserve(): void {}
  disconnect(): void {}
}

/**
 * The primary add-to-cart button's accessible name: the visible label plus the
 * product, so it is not confused with the related rail's identical labels.
 */
function primaryAddButtonName(productName: string): (accessibleName: string) => boolean {
  return (accessibleName) =>
    accessibleName.includes(PRODUCT_ADD_TO_CART_COPY.idle) &&
    accessibleName.includes(PRODUCT_ADD_TO_CART_COPY.productName(productName));
}

/** Renders the catalogue stub with the search the router actually resolved. */
function CatalogStub() {
  const search = useSearch({ from: "/products" });

  return (
    <>
      <h1>Catálogo de prueba</h1>
      <p data-testid="catalog-search">{JSON.stringify(search)}</p>
    </>
  );
}

/** Renders the real `/products/$productId` component inside a memory router. */
async function renderDetail(initialEntry: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <main>
        <Outlet />
      </main>
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => null,
  });
  const listRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/products",
    validateSearch: (search: Record<string, unknown>) => productsSearchSchema.catch({}).parse(search),
    component: CatalogStub,
  });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/products/$productId",
    component: productDetailRoute.options.component,
  });
  // The generated route id keeps the underscore of the `products_.$productId`
  // filename, while the public path drops it, and the component resolves its params
  // through that id. `createRoute` rejects `id` and `path` together, but `init` reads
  // the id from the options at router build time, so it is assigned here.
  (detailRoute.options as { id?: string }).id = "/products_/$productId";
  const routeTree = rootRoute.addChildren([indexRoute, listRoute, detailRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    parseSearch: parseSearchParams,
    stringifySearch: stringifySearchParams,
  });

  await router.load();
  render(<RouterProvider router={router} />);

  return router;
}

/**
 * Renders the application's real generated route tree inside a memory router.
 *
 * Unlike `renderDetail` above, which builds a synthetic root with the detail route
 * as a direct child, this mounts `routeTree.gen.ts` exactly as the app does. That is
 * the only harness that can catch a routing defect: a synthetic root that parents
 * the detail route to the root hides whatever the generated tree actually does.
 */
async function renderRealApp(initialEntry: string) {
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
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
  observerCallbacks.length = 0;
  observedTargets.length = 0;
  useCartStore.setState({ lines: [] });
  useFavoritesStore.setState({ ids: [] });
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe("/products/$productId route in the real generated tree", () => {
  it("renders the detail page at /products/10, not the catalogue", async () => {
    const product = products.find((candidate) => candidate.id === 10);

    if (product === undefined) {
      throw new Error("test fixture expects product 10");
    }

    await renderRealApp(`/products/${product.id}`);

    expect(await screen.findByRole("heading", { level: 1, name: product.name })).toBeTruthy();
    expect(screen.getByRole("tablist", { name: PRODUCT_TABS_COPY.sectionLabel })).toBeTruthy();
    expect(screen.getByLabelText(PRODUCT_COUPON_COPY.label)).toBeTruthy();
  });

  it("still renders the catalogue listing at /products", async () => {
    await renderRealApp("/products");

    expect(await screen.findAllByRole("article")).toHaveLength(12);
    expect(screen.getByText("36 productos")).toBeTruthy();
  });
});

describe("/products/$productId route", () => {
  it("renders the product name in the only h1, its price and its stock line", async () => {
    const product = products[0];
    await renderDetail(`/products/${product.id}`);

    expect(await screen.findByRole("heading", { level: 1, name: product.name })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    const buyBox = screen.getByRole("region", { name: product.name });
    expect(within(buyBox).getByText(formatMoney(product.price))).toBeTruthy();
    expect(within(buyBox).getByText(formatMoney(product.original)).tagName.toLowerCase()).toBe("s");
    expect(within(buyBox).getByText(PRODUCT_STOCK_COPY.inStock(product.stock))).toBeTruthy();

    // The instalments line divides the price the page is showing, with the plan size
    // and the wording both coming from the copy module.
    expect(
      within(buyBox).getByText(
        PRODUCT_INSTALMENTS_COPY.line(
          formatMoney(instalments(priceWithPack(product, product.packs[0]), PRODUCT_INSTALMENTS_COPY.planCount)),
        ),
      ),
    ).toBeTruthy();

    // The section that holds the tabs carries the design's own name, and the list
    // inside it is a named landmark of its own rather than an anonymous tablist.
    expect(screen.getByRole("region", { name: PRODUCT_TABS_COPY.sectionLabel })).toBeTruthy();
    const tablist = screen.getByRole("tablist", { name: PRODUCT_TABS_COPY.sectionLabel });
    expect(within(tablist).getAllByRole("tab")).toHaveLength(3);
  });

  it("keeps the page's only tablist in the detail tabs, with the thumbnail as a pressed button", async () => {
    const product = products[0];
    await renderDetail(`/products/${product.id}`);

    const thumbnail = await screen.findByRole("button", { name: product.name });
    expect(thumbnail.getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByRole("list", { name: PRODUCT_GALLERY_COPY.thumbnailsLabel }),
    ).toBeTruthy();

    const tablists = screen.getAllByRole("tablist");
    expect(tablists).toHaveLength(1);
    expect(within(tablists[0]).getAllByRole("tab")).toHaveLength(3);
  });

  it("adds the chosen quantity to the cart and toasts the copy module's label", async () => {
    const user = userEvent.setup();
    const product = products[0];
    await renderDetail(`/products/${product.id}`);

    const buyBox = screen.getByRole("region", { name: product.name });
    await user.click(
      within(buyBox).getByRole("button", { name: primaryAddButtonName(product.name) }),
    );

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(PRODUCT_ADD_TO_CART_COPY.toast);
    });
    expect(selectCartUnits(useCartStore.getState())).toBe(1);
  });

  it("renders the unknown-product state with a link back to the catalogue", async () => {
    const user = userEvent.setup();
    await renderDetail("/products/9999");

    expect(
      await screen.findByRole("heading", { level: 1, name: PRODUCT_NOT_FOUND_COPY.heading }),
    ).toBeTruthy();
    expect(screen.getByText(PRODUCT_NOT_FOUND_COPY.message)).toBeTruthy();

    const back = screen.getByRole("link", { name: PRODUCT_NOT_FOUND_COPY.backLabel });
    expect(back.getAttribute("href")).toBe("/products");

    await user.click(back);
    expect(await screen.findByRole("heading", { level: 1, name: "Catálogo de prueba" })).toBeTruthy();
  });

  it("falls back to the unknown-product state for a non-numeric id", async () => {
    await renderDetail("/products/no-es-un-numero");

    expect(
      await screen.findByRole("heading", { level: 1, name: PRODUCT_NOT_FOUND_COPY.heading }),
    ).toBeTruthy();
  });

  it("caps the quantity at the stock when the stock is below the per-order limit", async () => {
    const user = userEvent.setup();
    const limit = quantityLimit(belowCeilingProduct!);
    await renderDetail(`/products/${belowCeilingProduct!.id}`);

    const increase = await screen.findByRole("button", { name: "Aumentar cantidad" });
    for (let step = 1; step < limit; step += 1) {
      await user.click(increase);
    }

    expect(screen.getByText(String(limit))).toBeTruthy();
    expect((increase as HTMLButtonElement).disabled).toBe(true);
  });

  it("caps the quantity at the per-order limit when the stock is above it", async () => {
    const user = userEvent.setup();
    const limit = quantityLimit(aboveCeilingProduct!);
    await renderDetail(`/products/${aboveCeilingProduct!.id}`);

    const increase = await screen.findByRole("button", { name: "Aumentar cantidad" });
    for (let step = 1; step < limit; step += 1) {
      await user.click(increase);
    }

    expect(limit).toBeLessThan(aboveCeilingProduct!.stock);
    expect(screen.getByText(String(limit))).toBeTruthy();
    expect((increase as HTMLButtonElement).disabled).toBe(true);
  });

  it("prints the aggregate and the review link once each in the buy-box rating row", async () => {
    const product = products[0];
    await renderDetail(`/products/${product.id}`);

    const buyBox = await screen.findByRole("region", { name: product.name });
    const reviewLink = within(buyBox).getByRole("link", {
      name: formatReviewCount(product.reviews),
    });
    const ratingRow = reviewLink.parentElement;

    if (ratingRow === null) {
      throw new Error("rating row is missing");
    }

    const aggregate = PRODUCT_REVIEWS_COPY.aggregateLabel(formatRatingValue(product.rating));
    const reviewLinkLabel = formatReviewCount(product.reviews);
    const rowText = (ratingRow.textContent ?? "").replace(/\s+/g, " ").trim();

    expect(within(ratingRow).getByText(aggregate)).toBeTruthy();
    expect(within(ratingRow).queryByText(formatRating(product.rating, product.reviews))).toBeNull();

    // The row shows the aggregate label and the review link, nothing else: the count
    // rides in the link alone. products[0] carries 312 reviews, a figure no other
    // number of this row contains, so one occurrence proves it is printed once.
    expect(rowText).toContain(aggregate);
    expect(rowText.endsWith(reviewLinkLabel)).toBe(true);
    expect(rowText.split(reviewLinkLabel)).toHaveLength(2);
    expect(rowText.match(new RegExp(String(product.reviews), "g"))).toHaveLength(1);
  });

  it("links the category crumb to the catalogue filtered by that category", async () => {
    const user = userEvent.setup();
    const product = products[0];
    const router = await renderDetail(`/products/${product.id}`);

    const categoryCrumb = screen.getByRole("link", { name: product.category });
    expect(categoryCrumb.getAttribute("href")).toBe(
      `/products?cat=${encodeURIComponent(product.category)}`,
    );

    await user.click(categoryCrumb);

    expect(await screen.findByRole("heading", { level: 1, name: "Catálogo de prueba" })).toBeTruthy();
    const catalogSearch = screen.getByTestId("catalog-search").textContent ?? "{}";
    expect(JSON.parse(catalogSearch)).toMatchObject({ cat: [product.category] });
    expect(router.state.location.href).toContain("cat=");
  });

  it("shows the featured review authors on the reviews tab", async () => {
    const user = userEvent.setup();
    const product = products[0];
    await renderDetail(`/products/${product.id}`);

    await user.click(
      await screen.findByRole("tab", { name: PRODUCT_TABS_COPY.reviews(product.reviews) }),
    );

    for (const review of product.customerReviews) {
      expect(await screen.findByText(review.author)).toBeTruthy();
    }
  });

  it("leaves the current product out of the related rail", async () => {
    const product = products[0];
    await renderDetail(`/products/${product.id}`);

    const rail = await screen.findByRole("list", { name: PRODUCT_RELATED_COPY.heading });
    expect(rail.querySelectorAll("li").length).toBeGreaterThan(0);
    expect(within(rail).queryByRole("link", { name: product.name })).toBeNull();
    expect(rail.querySelector(`a[href="/products/${product.id}"]`)).toBeNull();
  });

  it("reveals the sticky bar only once the primary add-to-cart control is above the viewport", async () => {
    const product = products[0];
    const stickyName = PRODUCT_STICKY_BAR_COPY.addAriaLabel(product.name);
    await renderDetail(`/products/${product.id}`);

    const buyBox = screen.getByRole("region", { name: product.name });
    const primary = within(buyBox).getByRole("button", {
      name: primaryAddButtonName(product.name),
    });
    expect(observedTargets[0]).toBe(primary);
    expect(screen.queryByRole("button", { name: stickyName })).toBeNull();

    const [callback] = observerCallbacks;
    expect(callback).toBeDefined();

    await act(async () => {
      callback?.([{ isIntersecting: false, boundingClientRect: { top: -120 } }]);
    });
    expect(await screen.findByRole("button", { name: stickyName })).toBeTruthy();

    await act(async () => {
      callback?.([{ isIntersecting: true, boundingClientRect: { top: 40 } }]);
    });
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: stickyName })).toBeNull();
    });
  });

  it("names the primary add button after its product and the rail cards after theirs", async () => {
    const product = products[0];
    await renderDetail(`/products/${product.id}`);

    const buyBox = await screen.findByRole("region", { name: product.name });
    const primary = within(buyBox).getByRole("button", { name: primaryAddButtonName(product.name) });

    // Composed, not substituted: no aria-label hides the visible words, and the
    // product name rides along in the visually hidden tail.
    expect(primary.getAttribute("aria-label")).toBeNull();
    expect(primary.textContent).toContain(PRODUCT_ADD_TO_CART_COPY.idle);
    expect(primary.textContent).toContain(product.name);

    // The computed name is exactly the visible words followed by the product, so the
    // visible label is a substring of the accessible name (WCAG label in name).
    expect(
      within(buyBox).getByRole("button", {
        name: `${PRODUCT_ADD_TO_CART_COPY.idle} ${product.name}`,
      }),
    ).toBe(primary);

    // The rail's five cards each name their own product through the shared card
    // action, so none of them collides with the primary's bare label.
    const rail = screen.getByRole("list", { name: PRODUCT_RELATED_COPY.heading });
    const railAddButtons = within(rail).getAllByRole("button", {
      name: /^Agregar .+ al carrito$/,
    });
    expect(railAddButtons.map((button) => button.textContent)).toEqual(
      relatedProducts(products, product).map((related) => `Agregar ${related.name} al carrito`),
    );
    expect(
      within(rail).queryAllByRole("button", { name: PRODUCT_ADD_TO_CART_COPY.idle }),
    ).toHaveLength(0);
  });

  it("names the gallery stage after the product and the zoom state", async () => {
    const user = userEvent.setup();
    const product = products[0];
    await renderDetail(`/products/${product.id}`);

    const resting = await screen.findByRole("button", {
      name: PRODUCT_GALLERY_COPY.stageLabel(product.name, false),
    });
    expect(resting.getAttribute("aria-pressed")).toBe("false");

    await user.click(resting);

    const zoomed = screen.getByRole("button", {
      name: PRODUCT_GALLERY_COPY.stageLabel(product.name, true),
    });
    expect(zoomed.getAttribute("aria-pressed")).toBe("true");
  });

  it("resets the quantity, the pack and the status when the rail moves to another product", async () => {
    const user = userEvent.setup();
    const highStock = products.find((product) => product.id === 10);
    const lowStock = products.find((product) => product.id === 36);

    if (highStock === undefined || lowStock === undefined) {
      throw new Error("test fixture expects products 10 and 36");
    }

    // The fixture's premise: 10 is capped by the order ceiling, 36 by its own stock.
    expect(quantityLimit(highStock)).toBe(MAX_QUANTITY);
    expect(lowStock.stock).toBe(3);

    const paidPack = highStock.packs.find((pack) => pack.extra !== 0);

    if (paidPack === undefined) {
      throw new Error("test fixture expects a pack with a surcharge");
    }

    await renderDetail(`/products/${highStock.id}`);

    const buyBox = await screen.findByRole("region", { name: highStock.name });
    const packs = within(buyBox).getByRole("radiogroup", { name: PRODUCT_OPTION_COPY.packLabel });
    await user.click(
      within(packs).getByRole("radio", {
        name: `${paidPack.name} ${PRODUCT_OPTION_COPY.packSurcharge(paidPack.extra)}`,
      }),
    );
    expect(within(buyBox).getByText(formatMoney(priceWithPack(highStock, paidPack)))).toBeTruthy();

    const increase = within(buyBox).getByRole("button", {
      name: PRODUCT_QUANTITY_COPY.increaseLabel,
    });
    for (let step = 1; step < quantityLimit(highStock); step += 1) {
      await user.click(increase);
    }
    const quantityGroup = within(buyBox).getByRole("group", {
      name: PRODUCT_QUANTITY_COPY.groupLabel,
    });
    expect(within(quantityGroup).getByText(String(quantityLimit(highStock)))).toBeTruthy();

    await navigateThroughRail(user, lowStock.id);

    const nextBuyBox = await screen.findByRole("region", { name: lowStock.name });

    // Face one: the quantity is back at the floor, so the new ceiling applies from
    // the first render instead of nine units of a three-stock product.
    const nextQuantityGroup = within(nextBuyBox).getByRole("group", {
      name: PRODUCT_QUANTITY_COPY.groupLabel,
    });
    expect(within(nextQuantityGroup).getByText("1")).toBeTruthy();
    expect(
      (
        within(nextQuantityGroup).getByRole("button", {
          name: PRODUCT_QUANTITY_COPY.decreaseLabel,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    // Face two: the pack is back to the base option, so no stale surcharge is shown
    // or charged.
    const nextPacks = within(nextBuyBox).getByRole("radiogroup", {
      name: PRODUCT_OPTION_COPY.packLabel,
    });
    expect(
      within(nextPacks).getByRole("radio", { name: lowStock.packs[0].name }).getAttribute(
        "aria-checked",
      ),
    ).toBe("true");
    expect(
      within(nextPacks)
        .getByRole("radio", {
          name: `${paidPack.name} ${PRODUCT_OPTION_COPY.packSurcharge(paidPack.extra)}`,
        })
        .getAttribute("aria-checked"),
    ).toBe("false");
    expect(
      within(nextBuyBox).getByText(formatMoney(priceWithPack(lowStock, lowStock.packs[0]))),
    ).toBeTruthy();

    // Face three: the status is idle for a product that was never added, and the add
    // writes one unit of the product on screen.
    const nextAdd = within(nextBuyBox).getByRole("button", {
      name: primaryAddButtonName(lowStock.name),
    });
    expect((nextAdd as HTMLButtonElement).disabled).toBe(false);
    expect(nextAdd.textContent).toContain(PRODUCT_ADD_TO_CART_COPY.idle);

    await user.click(nextAdd);

    await waitFor(() => {
      expect(selectCartUnits(useCartStore.getState())).toBe(1);
    });
    expect(useCartStore.getState().lines).toEqual([{ id: lowStock.id, quantity: 1 }]);
  });

  it("drops an in-flight add when the rail moves to another product", async () => {
    const user = userEvent.setup();
    const highStock = products.find((product) => product.id === 10);
    const lowStock = products.find((product) => product.id === 36);

    if (highStock === undefined || lowStock === undefined) {
      throw new Error("test fixture expects products 10 and 36");
    }

    await renderDetail(`/products/${highStock.id}`);

    const buyBox = await screen.findByRole("region", { name: highStock.name });
    await user.click(
      within(buyBox).getByRole("button", { name: primaryAddButtonName(highStock.name) }),
    );

    await navigateThroughRail(user, lowStock.id);
    await screen.findByRole("heading", { level: 1, name: lowStock.name });

    await act(async () => {
      await new Promise((resolve) => {
        window.setTimeout(resolve, ADD_SETTLE_MS);
      });
    });

    // The pending timer died with the product it belonged to.
    expect(useCartStore.getState().lines).toEqual([]);

    const nextBuyBox = screen.getByRole("region", { name: lowStock.name });
    const nextAdd = within(nextBuyBox).getByRole("button", {
      name: primaryAddButtonName(lowStock.name),
    });
    expect((nextAdd as HTMLButtonElement).disabled).toBe(false);
    expect(nextAdd.textContent).toContain(PRODUCT_ADD_TO_CART_COPY.idle);
  });
});
