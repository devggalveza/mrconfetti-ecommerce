// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { CouponField } from "@/features/catalog/components/coupon-field";
import { PRODUCT_COUPON_COPY } from "@/features/catalog/data/product-detail-content";
import { COUPONS } from "@/lib/coupons";

const validCoupon = COUPONS.EMOX10;

if (validCoupon === undefined) {
  throw new Error("test fixture expects the coupon table to carry EMOX10");
}

afterEach(() => {
  cleanup();
});

describe("CouponField", () => {
  it("reports the empty message when the form is submitted with no code", async () => {
    const user = userEvent.setup();
    render(<CouponField />);

    await user.click(screen.getByRole("button", { name: PRODUCT_COUPON_COPY.submitLabel }));

    expect(screen.getByRole("status").textContent).toBe(PRODUCT_COUPON_COPY.emptyMessage);
  });

  it("applies a valid code and names it in the message", async () => {
    const user = userEvent.setup();
    render(<CouponField />);

    await user.type(screen.getByLabelText(PRODUCT_COUPON_COPY.label), validCoupon.code);
    await user.click(screen.getByRole("button", { name: PRODUCT_COUPON_COPY.submitLabel }));

    const status = screen.getByRole("status").textContent ?? "";
    expect(status).toBe(PRODUCT_COUPON_COPY.appliedMessage(validCoupon.code));
    expect(status).toContain(validCoupon.code);
  });

  it("reports the invalid message for an unknown code and marks the input invalid", async () => {
    const user = userEvent.setup();
    render(<CouponField />);

    await user.type(screen.getByLabelText(PRODUCT_COUPON_COPY.label), "NO-EXISTE");
    await user.click(screen.getByRole("button", { name: PRODUCT_COUPON_COPY.submitLabel }));

    expect(screen.getByRole("status").textContent).toBe(PRODUCT_COUPON_COPY.invalidMessage);
    expect(screen.getByLabelText(PRODUCT_COUPON_COPY.label).getAttribute("aria-invalid")).toBe(
      "true",
    );
  });
});
