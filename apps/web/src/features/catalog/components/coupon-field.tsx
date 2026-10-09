import { useId, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRODUCT_COUPON_COPY } from "@/features/catalog/data/product-detail-content";
import { resolveCoupon } from "@/lib/coupons";
import { cn } from "@/lib/utils";

type CouponMessage = {
  tone: "error" | "success";
  text: string;
};

/**
 * The coupon block: label, input, submit button and a `role="status"` message region.
 *
 * Validation goes through `resolveCoupon`, and the input is marked `aria-invalid`
 * whenever the last attempt failed. The three states are an empty input, an applied
 * code and an invalid code, each with its copy from `PRODUCT_COUPON_COPY`.
 *
 * The coupon validates and reports only: it never changes the displayed price, so
 * applying a discount to a total stays a checkout concern.
 */
export function CouponField() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<CouponMessage | null>(null);
  const inputId = useId();
  const messageId = useId();
  const isInvalid = message?.tone === "error";

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (code.trim().length === 0) {
      setMessage({ tone: "error", text: PRODUCT_COUPON_COPY.emptyMessage });
      return;
    }

    const coupon = resolveCoupon(code);
    setMessage(
      coupon === null
        ? { tone: "error", text: PRODUCT_COUPON_COPY.invalidMessage }
        : { tone: "success", text: PRODUCT_COUPON_COPY.appliedMessage(coupon.code) },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <h2 className="mb-2 text-sm font-semibold">
        <label htmlFor={inputId}>{PRODUCT_COUPON_COPY.label}</label>
      </h2>

      <div className="flex gap-2">
        <Input
          id={inputId}
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
          }}
          placeholder={PRODUCT_COUPON_COPY.placeholder}
          autoComplete="off"
          aria-invalid={isInvalid}
          aria-describedby={messageId}
          className="border-border h-11 rounded-lg px-3 text-sm"
        />
        <Button type="submit" variant="outline" size="pill" className="border-brand text-brand h-11">
          {PRODUCT_COUPON_COPY.submitLabel}
        </Button>
      </div>

      <p
        id={messageId}
        role="status"
        className={cn(
          "mt-1.5 min-h-5 text-[13px]",
          message?.tone === "error" && "text-destructive",
          message?.tone === "success" && "text-success",
        )}
      >
        {message?.text ?? ""}
      </p>
    </form>
  );
}
