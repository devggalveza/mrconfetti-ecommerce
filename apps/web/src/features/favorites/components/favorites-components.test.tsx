// @vitest-environment jsdom
import type { ReactNode } from "react";

import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { products } from "@/features/catalog/data/products";
import { ClearFavoritesDialog } from "@/features/favorites/components/clear-favorites-dialog";
import { FavoritesGrid } from "@/features/favorites/components/favorites-grid";
import { EXIT_FALLBACK_MS } from "@/features/favorites/components/favorites-grid";
import { FAVORITES_COPY } from "@/features/favorites/data/favorites-copy";
import { selectFavoriteIds } from "@/stores/selectors";
import { useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";

vi.mock("sonner", () => ({ toast: vi.fn() }));

/** A `change` listener registered through the stubbed `matchMedia`. */
type MediaQueryListener = (event: MediaQueryListEvent) => void;

const mediaListeners = new Set<MediaQueryListener>();

/** Replaces `matchMedia` with a stub whose query always reports `matches`. */
function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: MediaQueryListener) => {
      mediaListeners.add(listener);
    },
    removeEventListener: (_type: string, listener: MediaQueryListener) => {
      mediaListeners.delete(listener);
    },
    addListener: (listener: MediaQueryListener) => {
      mediaListeners.add(listener);
    },
    removeListener: (listener: MediaQueryListener) => {
      mediaListeners.delete(listener);
    },
    dispatchEvent: () => false,
  }));
}

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/**
 * Renders `ui` inside the minimal router the cards need for their `Link`s. The
 * grid itself has no route of its own; the extra routes exist only so those links
 * resolve. The router mounts asynchronously, so callers wait for a `findBy*`.
 */
function renderInRouter(ui: ReactNode) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <>{ui}</>,
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
  const routeTree = rootRoute.addChildren([indexRoute, productsRoute, productDetailRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  return render(<RouterProvider router={router} />);
}

const first = products[0];
const second = products[1];

if (first === undefined || second === undefined) {
  throw new Error("test fixture expects at least two products");
}

/** The accessible name of a card's heart toggle for a named product. */
function heartLabel(productName: string): string {
  return `Quitar ${productName} de favoritos`;
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  useCartStore.setState({ lines: [] });
  useFavoritesStore.setState({ ids: [] });
});

afterEach(() => {
  mediaListeners.clear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  cleanup();
});

describe("FavoritesGrid", () => {
  it("renders one card per favourite and never a stale one", async () => {
    useFavoritesStore.setState({ ids: [first.id, second.id] });
    const { container } = renderInRouter(<FavoritesGrid />);

    const list = await screen.findByRole("list", { name: FAVORITES_COPY.gridLabel });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(container.querySelectorAll("[data-favorite-id]")).toHaveLength(2);
  });

  it("animates a card out through its own heart toggle before dropping it", async () => {
    useFavoritesStore.setState({ ids: [first.id, second.id] });
    renderInRouter(<FavoritesGrid />);

    const list = await screen.findByRole("list", { name: FAVORITES_COPY.gridLabel });
    fireEvent.click(within(list).getByRole("button", { name: heartLabel(first.name) }));

    // The store dropped the id, but the card stays mounted while it fades, hidden
    // from assistive tech, and is not announced as content.
    expect(useFavoritesStore.getState().ids).toEqual([second.id]);
    const exiting = list.querySelector<HTMLElement>(`[data-favorite-id="${first.id}"]`);
    expect(exiting).not.toBeNull();
    expect(exiting?.getAttribute("aria-hidden")).toBe("true");
    expect(within(list).queryAllByRole("listitem")).toHaveLength(1);

    // The exit transition completing removes it for good.
    fireEvent.transitionEnd(exiting as HTMLElement);
    expect(list.querySelector(`[data-favorite-id="${first.id}"]`)).toBeNull();
  });

  it("removes a card immediately, with no exiting state, under reduced motion", async () => {
    stubMatchMedia(true);
    useFavoritesStore.setState({ ids: [first.id, second.id] });
    renderInRouter(<FavoritesGrid />);

    const list = await screen.findByRole("list", { name: FAVORITES_COPY.gridLabel });
    fireEvent.click(within(list).getByRole("button", { name: heartLabel(first.name) }));

    expect(useFavoritesStore.getState().ids).toEqual([second.id]);
    expect(list.querySelector(`[data-favorite-id="${first.id}"]`)).toBeNull();
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
  });

  it("settles an exiting card whose transition event never arrives", async () => {
    useFavoritesStore.setState({ ids: [first.id, second.id] });
    renderInRouter(<FavoritesGrid />);

    const list = await screen.findByRole("list", { name: FAVORITES_COPY.gridLabel });
    // Timers start faked only after the router has mounted, so `findBy*` is real.
    vi.useFakeTimers();
    fireEvent.click(within(list).getByRole("button", { name: heartLabel(first.name) }));

    expect(list.querySelector(`[data-favorite-id="${first.id}"]`)).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(EXIT_FALLBACK_MS);
    });

    expect(list.querySelector(`[data-favorite-id="${first.id}"]`)).toBeNull();
  });

  it("animates every card out consistently when the whole list is cleared", async () => {
    useFavoritesStore.setState({ ids: [first.id, second.id] });
    const { container } = renderInRouter(<FavoritesGrid />);

    const list = await screen.findByRole("list", { name: FAVORITES_COPY.gridLabel });

    act(() => {
      useFavoritesStore.getState().clear();
    });

    expect(useFavoritesStore.getState().ids).toEqual([]);
    for (const id of [first.id, second.id]) {
      expect(
        list.querySelector(`[data-favorite-id="${id}"]`)?.getAttribute("aria-hidden"),
      ).toBe("true");
    }
    expect(within(list).queryAllByRole("listitem")).toHaveLength(0);

    // Each card settles independently; the last one to go lets the grid give way
    // to the empty state.
    fireEvent.transitionEnd(list.querySelector(`[data-favorite-id="${first.id}"]`) as HTMLElement);
    expect(list.querySelector(`[data-favorite-id="${first.id}"]`)).toBeNull();
    expect(list.querySelector(`[data-favorite-id="${second.id}"]`)).not.toBeNull();

    fireEvent.transitionEnd(list.querySelector(`[data-favorite-id="${second.id}"]`) as HTMLElement);
    expect(container.querySelectorAll("[data-favorite-id]")).toHaveLength(0);
    expect(await screen.findByText(FAVORITES_COPY.empty.heading)).toBeTruthy();
  });

  it("moves focus into the grid when the focused card is removed", async () => {
    useFavoritesStore.setState({ ids: [first.id, second.id] });
    renderInRouter(<FavoritesGrid />);

    const list = await screen.findByRole("list", { name: FAVORITES_COPY.gridLabel });
    const heart = within(list).getByRole("button", { name: heartLabel(first.name) });
    heart.focus();
    expect(document.activeElement).toBe(heart);

    fireEvent.click(heart);

    // Focus never falls to the document body; the list takes it.
    expect(document.activeElement).toBe(list);
    expect(document.activeElement).not.toBe(document.body);
  });

  it("moves focus into the empty state when the last favourite is removed under reduced motion", async () => {
    stubMatchMedia(true);
    useFavoritesStore.setState({ ids: [first.id] });
    renderInRouter(<FavoritesGrid />);

    const list = await screen.findByRole("list", { name: FAVORITES_COPY.gridLabel });
    const heart = within(list).getByRole("button", { name: heartLabel(first.name) });
    heart.focus();
    expect(document.activeElement).toBe(heart);

    fireEvent.click(heart);

    // The grid gives way to the empty state, so the rescue must land there —
    // never on the document body.
    expect(useFavoritesStore.getState().ids).toEqual([]);
    expect(document.activeElement).not.toBe(document.body);

    const heading = await screen.findByText(FAVORITES_COPY.empty.heading);
    const active = document.activeElement as HTMLElement | null;
    expect(active).not.toBeNull();
    expect(active?.contains(heading)).toBe(true);
  });
});

describe("ClearFavoritesDialog", () => {
  it("renders no trigger when there is nothing to clear", () => {
    const { container } = render(<ClearFavoritesDialog />);
    expect(container.innerHTML).toBe("");
  });

  it("clears every favourite when the destructive confirm is pressed", async () => {
    const user = userEvent.setup();
    useFavoritesStore.setState({ ids: [first.id, second.id] });
    render(<ClearFavoritesDialog />);

    await user.click(screen.getByRole("button", { name: FAVORITES_COPY.clear.trigger }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: FAVORITES_COPY.clear.confirm }));

    expect(useFavoritesStore.getState().ids).toEqual([]);
    expect(selectFavoriteIds(useFavoritesStore.getState())).toEqual([]);
  });
});
