export type CouponType = "percent" | "amount";

export type Coupon = {
  code: string;
  type: CouponType;
  value: number;
  label: string;
};

export const COUPONS: Readonly<Record<string, Coupon>> = {
  EMOX10: { code: "EMOX10", type: "percent", value: 10, label: "Código EMOX10 (-10 %)" },
  BIENVENIDO: { code: "BIENVENIDO", type: "amount", value: 5, label: "Código BIENVENIDO (-Q.5)" },
};

/** Normalizes a user-entered code and returns the matching coupon, or null. */
export function resolveCoupon(input: string): Coupon | null {
  const code = input.trim().toUpperCase();
  if (code.length === 0) {
    return null;
  }
  return COUPONS[code] ?? null;
}

/** Returns the discount (in GTQ) produced by a coupon over a subtotal. */
export function applyCoupon(subtotal: number, coupon: Coupon | null): number {
  if (coupon === null) {
    return 0;
  }
  if (coupon.type === "percent") {
    return (subtotal * coupon.value) / 100;
  }
  return Math.min(coupon.value, subtotal);
}
