import { describe, expect, it } from "vitest";

import { applyCoupon, resolveCoupon } from "./coupons";

describe("resolveCoupon", () => {
  it("resolves a lowercase code", () => {
    expect(resolveCoupon("emox10")?.code).toBe("EMOX10");
  });

  it("trims and uppercases whitespace-padded input", () => {
    expect(resolveCoupon("  bienvenido  ")?.code).toBe("BIENVENIDO");
  });

  it("returns null for an unknown code", () => {
    expect(resolveCoupon("NOPE")).toBeNull();
  });

  it("returns null for an empty or whitespace-only string", () => {
    expect(resolveCoupon("")).toBeNull();
    expect(resolveCoupon("   ")).toBeNull();
  });
});

describe("applyCoupon", () => {
  it("returns 0 when there is no coupon", () => {
    expect(applyCoupon(200, null)).toBe(0);
  });

  it("applies a percent coupon to the subtotal", () => {
    expect(applyCoupon(200, resolveCoupon("EMOX10"))).toBe(20);
  });

  it("applies an amount coupon to the subtotal", () => {
    expect(applyCoupon(200, resolveCoupon("BIENVENIDO"))).toBe(5);
  });

  it("clamps an amount coupon to a smaller subtotal", () => {
    expect(applyCoupon(3, resolveCoupon("BIENVENIDO"))).toBe(3);
  });
});
