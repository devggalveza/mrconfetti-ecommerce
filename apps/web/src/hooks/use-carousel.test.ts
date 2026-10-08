import { describe, expect, it } from "vitest";

import { clampIndex, nextIndex, previousIndex } from "@/hooks/use-carousel";

describe("nextIndex", () => {
  it("advances one step", () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(1, 3)).toBe(2);
  });

  it("wraps around from the last index to the first", () => {
    expect(nextIndex(2, 3)).toBe(0);
  });

  it("returns 0 for a non-positive count", () => {
    expect(nextIndex(0, 0)).toBe(0);
    expect(nextIndex(4, -2)).toBe(0);
  });
});

describe("previousIndex", () => {
  it("goes back one step", () => {
    expect(previousIndex(2, 3)).toBe(1);
    expect(previousIndex(1, 3)).toBe(0);
  });

  it("wraps around from the first index to the last", () => {
    expect(previousIndex(0, 3)).toBe(2);
  });

  it("returns 0 for a non-positive count", () => {
    expect(previousIndex(0, 0)).toBe(0);
    expect(previousIndex(4, -2)).toBe(0);
  });
});

describe("clampIndex", () => {
  it("keeps an in-range index untouched", () => {
    expect(clampIndex(0, 3)).toBe(0);
    expect(clampIndex(2, 3)).toBe(2);
  });

  it("clamps an index above the last one", () => {
    expect(clampIndex(9, 3)).toBe(2);
  });

  it("clamps a negative index to the first one", () => {
    expect(clampIndex(-4, 3)).toBe(0);
  });

  it("returns 0 for a non-positive count", () => {
    expect(clampIndex(0, 0)).toBe(0);
    expect(clampIndex(3, -1)).toBe(0);
  });
});
