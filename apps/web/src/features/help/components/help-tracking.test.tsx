// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HELP_COPY } from "@/features/help/data/help-copy";
import { formatOrderDate } from "@/features/help/lib/format-order-date";
import { TRACKING_STEPS } from "@/features/help/lib/tracking";
import { formatMoney } from "@/lib/format";
import { useOrdersStore } from "@/stores/orders-store";

import { HelpTracking, TRACKING_REFERENCE_ERROR_ID } from "./help-tracking";

// `useStoresHydrated` reads a context that only flips true after a real promise
// resolves. This component is rendered without the provider, so the override is
// the deterministic way to exercise both the hydrated panel and the first paint.
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

/**
 * An order old enough that `confirmed` is done but young enough that `preparing`
 * is still pending (below its 4h threshold), so `preparing` is the single current
 * step and all four state words are exercised.
 */
const ORDER_AGE_HOURS = 2;

const ORDER = {
  ref: "MC-TESTORDER",
  total: 39.9,
  items: [{ id: 1, quantity: 1 }],
  email: "ana@example.com",
  date: new Date(Date.now() - ORDER_AGE_HOURS * 3_600_000).toISOString(),
};

async function submitReference(reference?: string): Promise<void> {
  const user = userEvent.setup({ delay: null });

  if (reference !== undefined) {
    await user.type(screen.getByLabelText(HELP_COPY.tracking.label), reference);
  }
  await user.click(screen.getByRole("button", { name: HELP_COPY.tracking.submit }));
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  vi.stubGlobal("scrollTo", vi.fn());
  Element.prototype.scrollIntoView = (): void => {};
  useOrdersStore.setState({ lastOrder: null, pendingConfirmation: false });
  hydration.forced = true;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe("HelpTracking", () => {
  it("shows the empty field error and no result panel for an empty submit", async () => {
    render(<HelpTracking />);

    await submitReference();

    const field = screen.getByLabelText(HELP_COPY.tracking.label);
    expect(screen.getByRole("alert").textContent).toContain(HELP_COPY.tracking.emptyError);
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(field.getAttribute("aria-describedby")).toBe(TRACKING_REFERENCE_ERROR_ID);
    expect(screen.queryByRole("list", { name: HELP_COPY.tracking.stepsLabel })).toBeNull();
  });

  it("shows the malformed field error for a reference that does not match the format", async () => {
    render(<HelpTracking />);

    await submitReference("ABC123");

    const field = screen.getByLabelText(HELP_COPY.tracking.label);
    expect(screen.getByRole("alert").textContent).toContain(HELP_COPY.tracking.malformedError);
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByRole("list", { name: HELP_COPY.tracking.stepsLabel })).toBeNull();
  });

  it("reports an unknown reference honestly and points at the contact section", async () => {
    render(<HelpTracking />);

    await submitReference("MC-NOPE123");

    expect(screen.getByText(HELP_COPY.tracking.notFound("MC-NOPE123"))).toBeTruthy();
    const link = screen.getByRole("link", { name: HELP_COPY.topics.contacto });
    expect(link.getAttribute("href")).toBe("#contacto");
    expect(screen.queryByRole("list", { name: HELP_COPY.tracking.stepsLabel })).toBeNull();
    // No invented timeline, and not a field error either.
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders one row per tracking step for a stored order", async () => {
    useOrdersStore.setState({ lastOrder: ORDER, pendingConfirmation: false });
    render(<HelpTracking />);

    await submitReference(ORDER.ref);

    expect(screen.getByText(HELP_COPY.tracking.found(ORDER.ref))).toBeTruthy();

    const list = screen.getByRole("list", { name: HELP_COPY.tracking.stepsLabel });
    const items = within(list).getAllByRole("listitem");
    // The list is zipped from `TRACKING_STEPS`, so its order is the progression.
    expect(items).toHaveLength(4);

    const labels = items.map((item) => item.textContent ?? "");
    TRACKING_STEPS.forEach((id, index) => {
      expect(labels[index]).toContain(HELP_COPY.tracking.stepById[id].label);
      expect(labels[index]).toContain(HELP_COPY.tracking.stepById[id].description);
    });

    // Two hours in, confirmed is done, preparing is current and the last two pend.
    expect(within(list).getAllByText(HELP_COPY.tracking.stepState.done)).toHaveLength(1);
    expect(within(list).getAllByText(HELP_COPY.tracking.stepState.current)).toHaveLength(1);
    expect(within(list).getAllByText(HELP_COPY.tracking.stepState.pending)).toHaveLength(2);

    const current = list.querySelectorAll('[aria-current="step"]');
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent).toContain(HELP_COPY.tracking.stepById.preparing.label);

    expect(screen.getByText(HELP_COPY.tracking.dateLabel(formatOrderDate(ORDER.date)))).toBeTruthy();
    expect(screen.getByText(HELP_COPY.tracking.totalLabel(formatMoney(ORDER.total)))).toBeTruthy();
  });

  it("keeps the heading and anchor but hides the panel behind one named loading status", () => {
    hydration.forced = false;
    render(<HelpTracking />);

    // The heading and the `#pedido` anchor are in the server markup too.
    expect(screen.getByRole("heading", { name: HELP_COPY.tracking.heading })).toBeTruthy();
    expect(document.getElementById("pedido")).toBeTruthy();

    expect(screen.getAllByRole("status", { name: HELP_COPY.loading })).toHaveLength(1);
    expect(screen.queryByLabelText(HELP_COPY.tracking.label)).toBeNull();
  });
});
