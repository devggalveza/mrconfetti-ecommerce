// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { useCartStore } from "./cart-store";
import { useSavedStore } from "./saved-store";

beforeEach(() => {
  useCartStore.setState({ lines: [] });
  useSavedStore.setState({ ids: [] });
});

describe("saved store", () => {
  it("appends ids in order and ignores an already-saved id", () => {
    useSavedStore.getState().saveForLater(1);
    useSavedStore.getState().saveForLater(2);
    useSavedStore.getState().saveForLater(1);
    expect(useSavedStore.getState().ids).toEqual([1, 2]);
  });

  it("unsaves an id", () => {
    useSavedStore.getState().saveForLater(1);
    useSavedStore.getState().saveForLater(2);
    useSavedStore.getState().unsave(1);
    expect(useSavedStore.getState().ids).toEqual([2]);
  });

  it("moves an id to the cart so it is never in both lists", () => {
    useSavedStore.getState().saveForLater(7);
    useSavedStore.getState().moveToCart(7);
    expect(useSavedStore.getState().ids).toEqual([]);
    expect(useCartStore.getState().lines).toEqual([{ id: 7, quantity: 1 }]);
  });

  it("adds one unit to an existing cart line when moving", () => {
    useCartStore.getState().add(7);
    useSavedStore.getState().saveForLater(7);
    useSavedStore.getState().moveToCart(7);
    expect(useCartStore.getState().lines).toEqual([{ id: 7, quantity: 2 }]);
  });

  it("clears every id", () => {
    useSavedStore.getState().saveForLater(1);
    useSavedStore.getState().saveForLater(2);
    useSavedStore.getState().clear();
    expect(useSavedStore.getState().ids).toEqual([]);
  });

  it("persists under the legacy localStorage key", () => {
    expect(useSavedStore.persist.getOptions().name).toBe("mc-saved");
  });
});
