// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CheckoutFieldName } from "@/features/checkout/lib/validation";

import { CHECKOUT_PROCESSING_MS, useCheckoutForm } from "./use-checkout-form";

/** A fixed instant injected as `now`, so expiry checks are deterministic. */
const NOW = new Date(2026, 0, 15, 10, 0, 0);
const now = (): Date => NOW;

/** Every required field filled with a value that passes the 8a rules. */
const VALID_CARD_VALUES: Record<CheckoutFieldName, string> = {
  email: "ana@example.com",
  firstName: "Ana",
  lastName: "López",
  phone: "12345678",
  address: "Calle Uno 1-23",
  city: "Guatemala",
  postalCode: "01001",
  cardNumber: "4111111111111111",
  cardName: "Ana López",
  cardExpiry: "12/30",
  cardCvc: "123",
  bizumPhone: "12345678",
  paypalEmail: "ana@example.com",
};

/** Applies every entry through the hook's `setField`, one render at a time. */
function fill(result: { current: ReturnType<typeof useCheckoutForm> }): void {
  for (const [name, value] of Object.entries(VALID_CARD_VALUES)) {
    act(() => {
      result.current.setField(name as CheckoutFieldName, value);
    });
  }
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useCheckoutForm masking", () => {
  it("applies each field's mask before storing the value", () => {
    const { result } = renderHook(() => useCheckoutForm({ now, onSubmit: vi.fn() }));

    act(() => result.current.setField("cardNumber", "4111111111111111"));
    act(() => result.current.setField("cardExpiry", "1228"));
    act(() => result.current.setField("cardCvc", "12345"));
    act(() => result.current.setField("postalCode", "123456"));
    act(() => result.current.setField("phone", "1234-5678"));
    act(() => result.current.setField("bizumPhone", "123456789"));
    act(() => result.current.setField("firstName", "Ana"));

    expect(result.current.values.cardNumber).toBe("4111 1111 1111 1111");
    expect(result.current.values.cardExpiry).toBe("12/28");
    expect(result.current.values.cardCvc).toBe("1234");
    expect(result.current.values.postalCode).toBe("12345");
    expect(result.current.values.phone).toBe("12345678");
    expect(result.current.values.bizumPhone).toBe("12345678");
    expect(result.current.values.firstName).toBe("Ana");
  });
});

describe("useCheckoutForm blur validation", () => {
  it("stores the field's error code on blur", () => {
    const { result } = renderHook(() => useCheckoutForm({ now, onSubmit: vi.fn() }));

    act(() => result.current.blurField("email"));

    expect(result.current.errors.email).toBe("required");
    expect(result.current.errorList).toEqual([{ field: "email", code: "required" }]);
  });

  it("stores an email-specific code for a malformed value", () => {
    const { result } = renderHook(() => useCheckoutForm({ now, onSubmit: vi.fn() }));

    act(() => result.current.setField("email", "not-an-email"));
    act(() => result.current.blurField("email"));

    expect(result.current.errors.email).toBe("email");
  });

  it("clears the stored code when the value becomes valid", () => {
    const { result } = renderHook(() => useCheckoutForm({ now, onSubmit: vi.fn() }));

    act(() => result.current.setField("email", "nope"));
    act(() => result.current.blurField("email"));
    expect(result.current.errors.email).toBe("email");

    act(() => result.current.setField("email", "ana@example.com"));
    act(() => result.current.blurField("email"));

    expect(result.current.errors.email).toBeUndefined();
  });

  it("clears the field's error while the customer is typing", () => {
    const { result } = renderHook(() => useCheckoutForm({ now, onSubmit: vi.fn() }));

    act(() => result.current.blurField("email"));
    expect(result.current.errors.email).toBe("required");

    act(() => result.current.setField("email", "a"));

    expect(result.current.errors.email).toBeUndefined();
  });
});

describe("useCheckoutForm payment-method switch", () => {
  it("clears the errors of the fields outside the newly selected method", () => {
    const { result } = renderHook(() => useCheckoutForm({ now, onSubmit: vi.fn() }));

    act(() => result.current.blurField("cardNumber"));
    act(() => result.current.blurField("city"));
    expect(result.current.errors.cardNumber).toBe("required");
    expect(result.current.errors.city).toBe("required");

    act(() => result.current.setPaymentMethod("bizum"));

    expect(result.current.errors.cardNumber).toBeUndefined();
    expect(result.current.errors.city).toBe("required");
  });
});

describe("useCheckoutForm submit", () => {
  it("returns false and stores every error on an invalid form", () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useCheckoutForm({ now, onSubmit }));

    let accepted: boolean | undefined;
    act(() => {
      accepted = result.current.submit();
    });

    expect(accepted).toBe(false);
    expect(result.current.errors.email).toBe("required");
    expect(result.current.errors.cardNumber).toBe("required");
    expect(result.current.errors.cardCvc).toBe("required");
    expect(Object.keys(result.current.errors)).toHaveLength(11);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("returns true and calls onSubmit after the processing delay", () => {
    vi.useFakeTimers();
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useCheckoutForm({ now, onSubmit }));

    fill(result);

    let accepted: boolean | undefined;
    act(() => {
      accepted = result.current.submit();
    });

    expect(accepted).toBe(true);
    expect(result.current.submitting).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(CHECKOUT_PROCESSING_MS);
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      values: expect.objectContaining({ email: "ana@example.com" }),
      shippingMethod: "standard",
      paymentMethod: "card",
    });
    expect(result.current.submitting).toBe(false);
  });

  it("clears the pending timer on unmount", () => {
    vi.useFakeTimers();
    const onSubmit = vi.fn();
    const { result, unmount } = renderHook(() => useCheckoutForm({ now, onSubmit }));

    fill(result);
    act(() => {
      result.current.submit();
    });

    unmount();
    act(() => {
      vi.advanceTimersByTime(CHECKOUT_PROCESSING_MS * 2);
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
