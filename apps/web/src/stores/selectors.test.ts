import { describe, expect, it } from "vitest";

import { COUPONS } from "@/lib/coupons";

import type { LastOrder } from "./orders-store";
import {
  selectAppliedCoupon,
  selectLastOrder,
  selectPendingConfirmation,
  selectSavedIds,
} from "./selectors";

const order: LastOrder = {
  ref: "MC-1001",
  total: 89.95,
  items: [{ id: 1, quantity: 2 }],
  email: "ana@example.com",
  date: "2024-10-01T12:00:00.000Z",
};

describe("selectSavedIds", () => {
  it("returns the ids reference without copying", () => {
    const ids = [1, 2];
    expect(selectSavedIds({ ids })).toBe(ids);
  });
});

describe("selectAppliedCoupon", () => {
  it("resolves a stored code against the coupon table", () => {
    expect(selectAppliedCoupon({ code: "EMOX10" })).toEqual(COUPONS.EMOX10);
  });

  it("returns null when no code is stored", () => {
    expect(selectAppliedCoupon({ code: null })).toBeNull();
  });
});

describe("selectLastOrder", () => {
  it("returns the stored order", () => {
    expect(selectLastOrder({ lastOrder: order, pendingConfirmation: false })).toEqual(order);
  });

  it("returns null when there is no order", () => {
    expect(selectLastOrder({ lastOrder: null, pendingConfirmation: false })).toBeNull();
  });
});

describe("selectPendingConfirmation", () => {
  it("returns the confirmation flag", () => {
    expect(selectPendingConfirmation({ lastOrder: null, pendingConfirmation: true })).toBe(true);
    expect(selectPendingConfirmation({ lastOrder: null, pendingConfirmation: false })).toBe(false);
  });
});
