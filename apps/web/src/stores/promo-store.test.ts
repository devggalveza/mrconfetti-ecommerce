// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { usePromoStore } from "./promo-store";

beforeEach(() => {
  usePromoStore.setState({ code: null });
});

describe("promo store", () => {
  it("stores the canonical code of a valid coupon", () => {
    expect(usePromoStore.getState().apply(" emox10 ")).toBe(true);
    expect(usePromoStore.getState().code).toBe("EMOX10");
  });

  it("leaves the state unchanged and returns false for an invalid code", () => {
    usePromoStore.getState().apply("EMOX10");
    expect(usePromoStore.getState().apply("NOPE")).toBe(false);
    expect(usePromoStore.getState().code).toBe("EMOX10");
  });

  it("does not store a blank code", () => {
    expect(usePromoStore.getState().apply("   ")).toBe(false);
    expect(usePromoStore.getState().code).toBeNull();
  });

  it("clears the stored code", () => {
    usePromoStore.getState().apply("BIENVENIDO");
    usePromoStore.getState().clear();
    expect(usePromoStore.getState().code).toBeNull();
  });

  it("persists under the legacy localStorage key", () => {
    expect(usePromoStore.persist.getOptions().name).toBe("mc-promo");
  });
});
