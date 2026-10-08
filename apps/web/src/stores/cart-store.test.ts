// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { MAX_QUANTITY } from "@/lib/constants";

import { useCartStore } from "./cart-store";
import { selectCartLineCount, selectCartUnits } from "./selectors";

beforeEach(() => {
  useCartStore.setState({ lines: [] });
});

describe("cart store", () => {
  it("adds lines and clamps through the cart helpers", () => {
    useCartStore.getState().add(1);
    useCartStore.getState().add(1, 20);
    expect(useCartStore.getState().lines).toEqual([{ id: 1, quantity: MAX_QUANTITY }]);
  });

  it("sets, removes and clears lines", () => {
    useCartStore.getState().add(1, 2);
    useCartStore.getState().add(2, 1);
    useCartStore.getState().setQuantity(1, 5);
    expect(useCartStore.getState().lines).toEqual([
      { id: 1, quantity: 5 },
      { id: 2, quantity: 1 },
    ]);

    useCartStore.getState().remove(1);
    expect(useCartStore.getState().lines).toEqual([{ id: 2, quantity: 1 }]);

    useCartStore.getState().clear();
    expect(useCartStore.getState().lines).toEqual([]);
  });

  it("exposes selector helpers over the current state", () => {
    useCartStore.getState().add(1, 2);
    useCartStore.getState().add(2, 3);
    const state = useCartStore.getState();
    expect(selectCartUnits(state)).toBe(5);
    expect(selectCartLineCount(state)).toBe(2);
  });

  it("persists under the legacy localStorage key", () => {
    expect(useCartStore.persist.getOptions().name).toBe("mc-cart");
  });
});
