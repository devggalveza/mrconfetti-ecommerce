// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { useOrdersStore, type LastOrder } from "./orders-store";

const order: LastOrder = {
  ref: "MC-1001",
  total: 89.95,
  items: [{ id: 1, quantity: 2 }],
  email: "ana@example.com",
  date: "2024-10-01T12:00:00.000Z",
};

beforeEach(() => {
  useOrdersStore.setState({ lastOrder: null, pendingConfirmation: false });
});

describe("orders store", () => {
  it("stores the last order and flags a pending confirmation", () => {
    useOrdersStore.getState().setLastOrder(order);
    expect(useOrdersStore.getState().lastOrder).toEqual(order);
    expect(useOrdersStore.getState().pendingConfirmation).toBe(true);
  });

  it("dismisses the confirmation while keeping the order", () => {
    useOrdersStore.getState().setLastOrder(order);
    useOrdersStore.getState().dismissConfirmation();
    expect(useOrdersStore.getState().pendingConfirmation).toBe(false);
    expect(useOrdersStore.getState().lastOrder).toEqual(order);
  });

  it("clears both the order and the flag", () => {
    useOrdersStore.getState().setLastOrder(order);
    useOrdersStore.getState().clear();
    expect(useOrdersStore.getState().lastOrder).toBeNull();
    expect(useOrdersStore.getState().pendingConfirmation).toBe(false);
  });

  it("persists under the legacy localStorage key", () => {
    expect(useOrdersStore.persist.getOptions().name).toBe("mc-last-order");
  });
});
