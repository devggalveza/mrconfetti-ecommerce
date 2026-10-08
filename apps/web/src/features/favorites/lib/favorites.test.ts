import { describe, expect, it } from "vitest";

import {
  clearFavorites,
  isFavorite,
  pruneUnknownIds,
  removeFavorite,
  toggleFavorite,
} from "./favorites";

describe("isFavorite", () => {
  it("detects whether an id is present", () => {
    expect(isFavorite([1, 2], 2)).toBe(true);
    expect(isFavorite([1, 2], 3)).toBe(false);
  });
});

describe("toggleFavorite", () => {
  it("appends an absent id", () => {
    expect(toggleFavorite([1, 2], 3)).toEqual([1, 2, 3]);
  });

  it("removes a present id while preserving order", () => {
    expect(toggleFavorite([1, 2, 3], 2)).toEqual([1, 3]);
  });

  it("does not mutate the input", () => {
    const ids = [1];
    toggleFavorite(ids, 2);
    expect(ids).toEqual([1]);
  });
});

describe("removeFavorite", () => {
  it("removes a present id", () => {
    expect(removeFavorite([1, 2, 3], 2)).toEqual([1, 3]);
  });

  it("returns an equal array when the id is absent", () => {
    const ids = [1, 2];
    expect(removeFavorite(ids, 9)).toEqual(ids);
  });

  it("does not mutate the input", () => {
    const ids = [1, 2];
    removeFavorite(ids, 1);
    expect(ids).toEqual([1, 2]);
  });
});

describe("clearFavorites", () => {
  it("returns an empty array", () => {
    expect(clearFavorites()).toEqual([]);
  });
});

describe("pruneUnknownIds", () => {
  it("drops ids that are not known", () => {
    expect(pruneUnknownIds([1, 2, 3], new Set([1, 3]))).toEqual([1, 3]);
  });

  it("does not mutate the input", () => {
    const ids = [1, 2];
    pruneUnknownIds(ids, new Set([1]));
    expect(ids).toEqual([1, 2]);
  });
});
