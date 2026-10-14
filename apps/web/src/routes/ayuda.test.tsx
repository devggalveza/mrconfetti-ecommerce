// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HELP_COPY, type StaticHelpTopic } from "@/features/help/data/help-copy";
import { HELP_TOPICS } from "@/features/help/schemas/help-search";
import { parseSearchParams, stringifySearchParams } from "@/lib/search-params";
import { routeTree } from "@/routeTree.gen";
import { useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useOrdersStore } from "@/stores/orders-store";
import { usePromoStore } from "@/stores/promo-store";
import { useSavedStore } from "@/stores/saved-store";

// The real generated tree's root document renders the app's `<Toaster/>`, so the
// mock has to provide that export as well as the `toast` function.
vi.mock("sonner", () => ({ toast: vi.fn(), Toaster: () => null }));

// `useStoresHydrated` reads a context that only flips true after a real promise
// resolves, so asserting the first paint by racing that promise would be timing
// dependent. The override pins the unhydrated path deterministically while every
// other test falls through to the real hook (`null`).
const hydration = vi.hoisted(() => ({ forced: null as boolean | null }));

vi.mock("@/stores/store-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/stores/store-provider")>();

  return {
    ...actual,
    useStoresHydrated: (): boolean => {
      const real = actual.useStoresHydrated();
      return hydration.forced ?? real;
    },
  };
});

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/** The five topics that render as authored static sections. */
const STATIC_TOPICS: readonly StaticHelpTopic[] = HELP_TOPICS.filter(
  (topic): topic is StaticHelpTopic => topic !== "ayuda" && topic !== "pedido",
);

/**
 * Mounts the application's real generated route tree at `initialEntry`, so
 * reaching `/ayuda` here is the same proof the running application offers.
 */
async function renderHelp(initialEntry = "/ayuda") {
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
  vi.stubGlobal("scrollTo", vi.fn());
  Element.prototype.scrollIntoView = (): void => {};
  useCartStore.setState({ lines: [] });
  useSavedStore.setState({ ids: [] });
  useFavoritesStore.setState({ ids: [] });
  usePromoStore.setState({ code: null });
  useOrdersStore.setState({ lastOrder: null, pendingConfirmation: false });
  hydration.forced = null;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe("/ayuda route in the real generated tree", () => {
  it("is reachable at /ayuda with one h1 and the labelled table of contents", async () => {
    const router = await renderHelp("/ayuda");

    expect(
      await screen.findByRole("heading", { level: 1, name: HELP_COPY.heading }),
    ).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(router.state.location.pathname).toBe("/ayuda");
    expect(router.state.matches.some((match) => match.routeId === "/ayuda")).toBe(true);

    const nav = screen.getByRole("navigation", { name: HELP_COPY.tocLabel });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(7);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      HELP_TOPICS.map((topic) => `#${topic}`),
    );
  });

  it("renders the five static sections and the FAQ details", async () => {
    await renderHelp("/ayuda");
    await screen.findByRole("heading", { level: 1, name: HELP_COPY.heading });

    for (const topic of STATIC_TOPICS) {
      expect(
        screen.getByRole("heading", { level: 2, name: HELP_COPY.sections[topic].title }),
      ).toBeTruthy();
      expect(document.getElementById(topic)).toBeTruthy();
    }

    expect(
      screen.getByRole("heading", { level: 2, name: HELP_COPY.faq.heading }),
    ).toBeTruthy();
    expect(document.querySelectorAll("details")).toHaveLength(HELP_COPY.faq.items.length);
  });

  it("marks exactly the pedido entry for ?tema=pedido", async () => {
    await renderHelp("/ayuda?tema=pedido");
    await screen.findByRole("heading", { level: 1, name: HELP_COPY.heading });

    const nav = screen.getByRole("navigation", { name: HELP_COPY.tocLabel });
    const current = nav.querySelectorAll('[aria-current="location"]');
    expect(current).toHaveLength(1);
    expect(current[0]?.getAttribute("href")).toBe("#pedido");

    const marked = within(nav)
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") !== null);
    expect(marked).toHaveLength(1);
  });

  it("marks no entry for an unknown tema", async () => {
    await renderHelp("/ayuda?tema=desconocido");
    await screen.findByRole("heading", { level: 1, name: HELP_COPY.heading });

    const nav = screen.getByRole("navigation", { name: HELP_COPY.tocLabel });
    expect(nav.querySelectorAll("[aria-current]")).toHaveLength(0);
  });

  it("marks no entry for an empty tema", async () => {
    await renderHelp("/ayuda?tema=");
    await screen.findByRole("heading", { level: 1, name: HELP_COPY.heading });

    const nav = screen.getByRole("navigation", { name: HELP_COPY.tocLabel });
    expect(nav.querySelectorAll("[aria-current]")).toHaveLength(0);
  });

  it("moves the marker to exactly one pedido entry on a client-side tema change", async () => {
    const router = await renderHelp("/ayuda");
    await screen.findByRole("heading", { level: 1, name: HELP_COPY.heading });

    await act(() => router.navigate({ to: "/ayuda", search: { tema: "pedido" } }));

    const current = document.querySelectorAll('[aria-current="location"]');
    expect(current).toHaveLength(1);
    expect(current[0]?.getAttribute("href")).toBe("#pedido");
  });

  it("renders the tracking heading and anchor but one loading status before hydration", async () => {
    hydration.forced = false;
    await renderHelp("/ayuda");
    await screen.findByRole("heading", { level: 1, name: HELP_COPY.heading });

    expect(
      screen.getByRole("heading", { level: 2, name: HELP_COPY.tracking.heading }),
    ).toBeTruthy();
    expect(document.getElementById("pedido")).toBeTruthy();

    expect(screen.getAllByRole("status", { name: HELP_COPY.loading })).toHaveLength(1);
    expect(screen.queryByLabelText(HELP_COPY.tracking.label)).toBeNull();
  });
});
