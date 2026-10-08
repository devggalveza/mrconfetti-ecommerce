import { describe, expect, it } from "vitest";

import { MAX_QUANTITY } from "@/lib/constants";

import {
  addLine,
  clearLines,
  countUnits,
  hasLine,
  pruneUnknownIds,
  removeLine,
  setLineQuantity,
  type CartLine,
} from "./cart-lines";

const line = (id: number, quantity: number): CartLine => ({ id, quantity });

describe("addLine", () => {
  it("appends a new line with the given quantity", () => {
    expect(addLine([], 1, 2)).toEqual([line(1, 2)]);
  });

  it("defaults to a quantity of one", () => {
    expect(addLine([], 5)).toEqual([line(5, 1)]);
  });

  it("increases an existing line and keeps its position", () => {
    const lines = [line(1, 1), line(2, 1)];
    expect(addLine(lines, 1, 2)).toEqual([line(1, 3), line(2, 1)]);
  });

  it("clamps the resulting quantity to MAX_QUANTITY", () => {
    expect(addLine([line(1, 8)], 1, 5)).toEqual([line(1, MAX_QUANTITY)]);
  });

  it("clamps a new line to at least one", () => {
    expect(addLine([], 1, 0)).toEqual([line(1, 1)]);
  });

  it("does not mutate the input", () => {
    const lines = [line(1, 1)];
    addLine(lines, 1, 1);
    expect(lines).toEqual([line(1, 1)]);
  });
});

describe("setLineQuantity", () => {
  it("sets a clamped quantity", () => {
    expect(setLineQuantity([line(1, 1)], 1, MAX_QUANTITY + 5)).toEqual([line(1, MAX_QUANTITY)]);
  });

  it("clamps to at least one", () => {
    expect(setLineQuantity([line(1, 5)], 1, -2)).toEqual([line(1, 1)]);
  });

  it("returns an equal array when the id is absent", () => {
    const lines = [line(1, 2)];
    expect(setLineQuantity(lines, 9, 3)).toEqual(lines);
  });

  it("does not mutate the input", () => {
    const lines = [line(1, 1)];
    setLineQuantity(lines, 1, 7);
    expect(lines).toEqual([line(1, 1)]);
  });
});

describe("removeLine", () => {
  it("removes the matching line", () => {
    expect(removeLine([line(1, 1), line(2, 2)], 1)).toEqual([line(2, 2)]);
  });

  it("does not mutate the input", () => {
    const lines = [line(1, 1)];
    removeLine(lines, 1);
    expect(lines).toEqual([line(1, 1)]);
  });
});

describe("clearLines", () => {
  it("returns an empty array", () => {
    expect(clearLines()).toEqual([]);
  });
});

describe("countUnits", () => {
  it("sums the quantities", () => {
    expect(countUnits([line(1, 2), line(2, 3)])).toBe(5);
    expect(countUnits([])).toBe(0);
  });
});

describe("hasLine", () => {
  it("detects whether an id is present", () => {
    expect(hasLine([line(1, 1)], 1)).toBe(true);
    expect(hasLine([line(1, 1)], 2)).toBe(false);
  });
});

describe("pruneUnknownIds", () => {
  it("drops lines whose id is not known", () => {
    const lines = [line(1, 1), line(2, 1), line(3, 1)];
    expect(pruneUnknownIds(lines, new Set([1, 3]))).toEqual([line(1, 1), line(3, 1)]);
  });

  it("does not mutate the input", () => {
    const lines = [line(1, 1)];
    pruneUnknownIds(lines, new Set());
    expect(lines).toEqual([line(1, 1)]);
  });
});
