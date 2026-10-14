import { ORDER_REF_PATTERN } from "@/features/checkout/lib/order";
import type { LastOrder } from "@/stores/orders-store";

/** The four fulfilment steps, in progression order. */
export const TRACKING_STEPS = ["confirmed", "preparing", "shipped", "delivered"] as const;
export type TrackingStepId = (typeof TRACKING_STEPS)[number];
export type TrackingStepState = "done" | "current" | "pending";

/**
 * Hours after the order date at which each step counts as reached.
 *
 * The storefront has no fulfilment API, so these thresholds are a documented
 * stand-in for one: they model the demo timeline the page renders. They are
 * data, not a promise about a real courier.
 */
export const TRACKING_STEP_HOURS: Record<TrackingStepId, number> = {
  confirmed: 0,
  preparing: 4,
  shipped: 24,
  delivered: 72,
};

const MS_PER_HOUR = 3_600_000;

/** Normalises a typed reference: trims surrounding space and uppercases. */
export function normalizeOrderRef(input: string): string {
  return input.trim().toUpperCase();
}

/**
 * Marks every step from the order date against an injected `now`, so the
 * module stays deterministic under test. An unparsable date counts as elapsed
 * zero. The first pending step becomes `"current"`; when every step is done no
 * step is current.
 */
export function markTrackingSteps(
  orderDate: string,
  now: Date,
): Record<TrackingStepId, TrackingStepState> {
  const parsed = Date.parse(orderDate);
  const elapsed = Number.isNaN(parsed) ? 0 : Math.max(0, now.getTime() - parsed);

  const steps = {} as Record<TrackingStepId, TrackingStepState>;
  for (const id of TRACKING_STEPS) {
    steps[id] = elapsed >= TRACKING_STEP_HOURS[id] * MS_PER_HOUR ? "done" : "pending";
  }

  const nextPending = TRACKING_STEPS.find((id) => steps[id] === "pending");
  if (nextPending !== undefined) {
    steps[nextPending] = "current";
  }

  return steps;
}

/**
 * The outcome of a tracking lookup. Carries codes and step states only: the
 * copy module owns every human string, and `not-found` invents no step, date
 * or total for a reference the app cannot resolve.
 */
export type TrackingResult =
  | { status: "empty" }
  | { status: "malformed"; reference: string }
  | { status: "not-found"; reference: string }
  | {
      status: "found";
      reference: string;
      order: LastOrder;
      steps: Record<TrackingStepId, TrackingStepState>;
    };

/**
 * Resolves a typed reference against the persisted last order. The storefront
 * only keeps one order in `mc-last-order`, so a well-formed reference that does
 * not match it is honestly `not-found` rather than an invented timeline.
 */
export function resolveTracking(
  input: string,
  lastOrder: LastOrder | null,
  now: Date,
): TrackingResult {
  const reference = normalizeOrderRef(input);

  if (reference.length === 0) {
    return { status: "empty" };
  }
  if (!ORDER_REF_PATTERN.test(reference)) {
    return { status: "malformed", reference };
  }
  if (lastOrder === null || normalizeOrderRef(lastOrder.ref) !== reference) {
    return { status: "not-found", reference };
  }

  return {
    status: "found",
    reference,
    order: lastOrder,
    steps: markTrackingSteps(lastOrder.date, now),
  };
}
