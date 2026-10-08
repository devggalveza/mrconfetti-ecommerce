// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { useFavoritesStore } from "./favorites-store";
import { selectFavoriteIds } from "./selectors";

beforeEach(() => {
  useFavoritesStore.setState({ ids: [] });
});

describe("favorites store", () => {
  it("toggles ids on and off, preserving order", () => {
    useFavoritesStore.getState().toggle(1);
    useFavoritesStore.getState().toggle(2);
    expect(useFavoritesStore.getState().ids).toEqual([1, 2]);

    useFavoritesStore.getState().toggle(1);
    expect(useFavoritesStore.getState().ids).toEqual([2]);
  });

  it("removes and clears ids", () => {
    useFavoritesStore.getState().toggle(1);
    useFavoritesStore.getState().toggle(2);
    useFavoritesStore.getState().remove(1);
    expect(selectFavoriteIds(useFavoritesStore.getState())).toEqual([2]);

    useFavoritesStore.getState().clear();
    expect(useFavoritesStore.getState().ids).toEqual([]);
  });

  it("persists under the legacy localStorage key", () => {
    expect(useFavoritesStore.persist.getOptions().name).toBe("mc-favoritos");
  });
});
