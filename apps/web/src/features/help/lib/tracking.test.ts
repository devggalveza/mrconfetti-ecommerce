import { describe, expect, it } from "vitest";

import type { LastOrder } from "@/stores/orders-store";

import {
  TRACKING_STEPS,
  TRACKING_STEP_HOURS,
  markTrackingSteps,
  normalizeOrderRef,
  resolveTracking,
} from "./tracking";

const HOUR = 3_600_000;

const ORDER_DATE = "2026-01-15T10:00:00.000Z";
const ORDER_TIME = Date.parse(ORDER_DATE);

/** A complete last order whose fields each test can override. */
function order(overrides: Partial<LastOrder> = {}): LastOrder {
  return {
    ref: "MC-1ABC",
    total: 84.95,
    items: [{ id: 1, quantity: 2 }],
    email: "ana@example.com",
    date: ORDER_DATE,
    ...overrides,
  };
}

/** A fixed instant `elapsedMs` after the order date. */
function at(elapsedMs: number): Date {
  return new Date(ORDER_TIME + elapsedMs);
}

describe("normalizeOrderRef", () => {
  it("trims and uppercases", () => {
    expect(normalizeOrderRef("  mc-1abc ")).toBe("MC-1ABC");
  });

  it("leaves an already normal reference untouched", () => {
    expect(normalizeOrderRef("MC-1ABC")).toBe("MC-1ABC");
  });
});

describe("TRACKING_STEPS", () => {
  it("keeps the four steps in progression order", () => {
    expect([...TRACKING_STEPS]).toEqual([
      "confirmed",
      "preparing",
      "shipped",
      "delivered",
    ]);
  });

  it("documents the four thresholds in ascending order", () => {
    expect(TRACKING_STEP_HOURS.confirmed).toBe(0);
    expect(TRACKING_STEP_HOURS.preparing).toBe(4);
    expect(TRACKING_STEP_HOURS.shipped).toBe(24);
    expect(TRACKING_STEP_HOURS.delivered).toBe(72);
  });
});

describe("markTrackingSteps", () => {
  it("always marks confirmed as done, even for an unparsable date", () => {
    expect(markTrackingSteps("no es una fecha", at(0)).confirmed).toBe("done");
  });

  it("marks only confirmed done at the start", () => {
    expect(markTrackingSteps(ORDER_DATE, at(0))).toEqual({
      confirmed: "done",
      preparing: "current",
      shipped: "pending",
      delivered: "pending",
    });
  });

  it("keeps preparing current just below its threshold", () => {
    const steps = markTrackingSteps(ORDER_DATE, at(4 * HOUR - 1));
    expect(steps.preparing).toBe("current");
    expect(steps.shipped).toBe("pending");
  });

  it("completes preparing exactly at its threshold and promotes shipped", () => {
    const steps = markTrackingSteps(ORDER_DATE, at(4 * HOUR));
    expect(steps.preparing).toBe("done");
    expect(steps.shipped).toBe("current");
  });

  it("keeps shipped current just below its threshold", () => {
    const steps = markTrackingSteps(ORDER_DATE, at(24 * HOUR - 1));
    expect(steps.shipped).toBe("current");
    expect(steps.delivered).toBe("pending");
  });

  it("completes shipped exactly at its threshold and promotes delivered", () => {
    const steps = markTrackingSteps(ORDER_DATE, at(24 * HOUR));
    expect(steps.shipped).toBe("done");
    expect(steps.delivered).toBe("current");
  });

  it("keeps delivered current just below its threshold", () => {
    expect(markTrackingSteps(ORDER_DATE, at(72 * HOUR - 1)).delivered).toBe("current");
  });

  it("has no current step once every threshold is met", () => {
    expect(markTrackingSteps(ORDER_DATE, at(72 * HOUR))).toEqual({
      confirmed: "done",
      preparing: "done",
      shipped: "done",
      delivered: "done",
    });
  });

  it("clamps a now before the order date to elapsed zero", () => {
    expect(markTrackingSteps(ORDER_DATE, at(-10 * HOUR))).toEqual(
      markTrackingSteps(ORDER_DATE, at(0)),
    );
  });

  it("counts an unparsable date as elapsed zero", () => {
    expect(markTrackingSteps("no es una fecha", at(100 * HOUR))).toEqual(
      markTrackingSteps(ORDER_DATE, at(0)),
    );
  });
});

describe("resolveTracking", () => {
  it("returns empty for empty and whitespace-only input", () => {
    expect(resolveTracking("", order(), at(0))).toEqual({ status: "empty" });
    expect(resolveTracking("   ", order(), at(0))).toEqual({ status: "empty" });
  });

  it("normalizes before testing the pattern", () => {
    expect(resolveTracking("  mc-1abc ", order(), at(0)).status).toBe("found");
  });

  it("reports a malformed reference with its normalized form", () => {
    for (const value of ["1234", "MC-", "MC 123", "XX-1"]) {
      expect(resolveTracking(value, order(), at(0))).toEqual({
        status: "malformed",
        reference: normalizeOrderRef(value),
      });
    }
  });

  it("reports not-found when no order is stored", () => {
    expect(resolveTracking("MC-1ABC", null, at(0))).toEqual({
      status: "not-found",
      reference: "MC-1ABC",
    });
  });

  it("reports not-found when the stored order has another reference", () => {
    expect(resolveTracking("MC-OTHER", order(), at(0))).toEqual({
      status: "not-found",
      reference: "MC-OTHER",
    });
  });

  it("compares the stored reference after normalizing both sides", () => {
    expect(resolveTracking("mc-1abc", order({ ref: "mc-1abc" }), at(0)).status).toBe("found");
    expect(resolveTracking("MC-1ABC", order({ ref: "  mc-1abc  " }), at(0)).status).toBe("found");
    expect(resolveTracking("MC-1ABC", order({ ref: "MC-OTHER" }), at(0)).status).toBe(
      "not-found",
    );
  });

  it("returns the stored order and its steps on a match", () => {
    const stored = order();
    expect(resolveTracking("MC-1ABC", stored, at(24 * HOUR))).toEqual({
      status: "found",
      reference: "MC-1ABC",
      order: stored,
      steps: markTrackingSteps(ORDER_DATE, at(24 * HOUR)),
    });
  });

  it("never mutates the stored order", () => {
    const stored = order();
    const snapshot = structuredClone(stored);
    resolveTracking("MC-1ABC", stored, at(100 * HOUR));
    expect(stored).toEqual(snapshot);
  });
});
