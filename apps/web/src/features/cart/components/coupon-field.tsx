import { useId, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CART_COPY } from "@/features/cart/data/cart-copy";
import { resolveCoupon } from "@/lib/coupons";
import { cn } from "@/lib/utils";
import { usePromoStore } from "@/stores/promo-store";
import { selectAppliedCoupon } from "@/stores/selectors";

type CouponFeedback = { tone: "success" | "error"; text: string };

/**
 * The cart coupon field. It rehydrates from the promo store and reports three
 * states through its live region: applied (naming the coupon table's own label),
 * rejected (an unknown code, which leaves any previously applied coupon untouched),
 * and cleared (the explicit clear action).
 *
 * The field only validates and reports; it never computes money. The discount it
 * unlocks is reported once, by the order summary.
 */
export function CouponField() {
  const headingId = useId();
  const inputId = useId();
  const statusId = useId();
  const appliedCoupon = usePromoStore(selectAppliedCoupon);
  const apply = usePromoStore((state) => state.apply);
  const clear = usePromoStore((state) => state.clear);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<CouponFeedback | null>(null);

  const message: CouponFeedback | null =
    feedback ??
    (appliedCoupon === null
      ? null
      : { tone: "success", text: CART_COPY.coupon.applied(appliedCoupon.label) });
  const isInvalid = feedback?.tone === "error";

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (code.trim().length === 0) {
      setFeedback({ tone: "error", text: CART_COPY.coupon.emptyMessage });
      return;
    }

    if (apply(code)) {
      const coupon = resolveCoupon(code);
      setFeedback({
        tone: "success",
        text: CART_COPY.coupon.applied(coupon?.label ?? code.trim().toUpperCase()),
      });
      setCode("");
      return;
    }

    setFeedback({ tone: "error", text: CART_COPY.coupon.rejected });
  };

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="text-lg font-bold">
        {CART_COPY.coupon.heading}
      </h2>

      <form onSubmit={handleSubmit} className="mt-3">
        <label htmlFor={inputId} className="text-sm font-medium">
          {CART_COPY.coupon.label}
        </label>

        <div className="mt-2 flex gap-2">
          <Input
            id={inputId}
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
            }}
            placeholder={CART_COPY.coupon.placeholder}
            autoComplete="off"
            aria-invalid={isInvalid}
            aria-describedby={statusId}
            className="border-border h-11 rounded-lg px-3 text-sm"
          />
          <Button
            type="submit"
            variant="outline"
            size="pill"
            className="border-brand text-brand h-11"
          >
            {CART_COPY.coupon.submitLabel}
          </Button>
        </div>

        <p
          id={statusId}
          role="status"
          className={cn(
            "mt-1.5 min-h-5 text-[13px]",
            message?.tone === "error" && "text-destructive",
            message?.tone === "success" && "text-success",
          )}
        >
          {message?.text ?? ""}
        </p>

        {appliedCoupon !== null ? (
          <button
            type="button"
            onClick={() => {
              clear();
              setFeedback({ tone: "success", text: CART_COPY.coupon.cleared });
              setCode("");
            }}
            className="text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring inline-flex min-h-11 items-center text-sm underline-offset-4 hover:underline"
          >
            {CART_COPY.coupon.clearLabel}
          </button>
        ) : null}
      </form>
    </section>
  );
}
