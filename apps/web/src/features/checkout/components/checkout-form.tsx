import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { TotalsRows } from "@/features/cart/components/totals-rows";
import { computeTotals } from "@/features/cart/lib/totals";
import { products } from "@/features/catalog/data/products";
import { useCartStore } from "@/stores/cart-store";
import { type LastOrder, useOrdersStore } from "@/stores/orders-store";
import { usePromoStore } from "@/stores/promo-store";
import { selectAppliedCoupon, selectCartLines } from "@/stores/selectors";

import { CHECKOUT_COPY } from "../data/checkout-copy";
import { useCheckoutForm, type CheckoutSnapshot } from "../hooks/use-checkout-form";
import { buildLastOrder } from "../lib/order";

import { AddressPanel } from "./address-panel";
import { CheckoutErrorSummary } from "./checkout-error-summary";
import { CheckoutSuccess } from "./checkout-success";
import { PaymentMethodPanel } from "./payment-method-panel";
import { ShippingMethodPanel } from "./shipping-method-panel";

export type CheckoutFormProps = {
  /** The clock the expiry check and the order reference read; injected for tests. */
  now?: () => Date;
};

/**
 * The checkout form: the integration point between the tested phase 8a rules,
 * the cart stores and the presentational panels.
 *
 * It computes the selected method's totals once here and passes them down, so no
 * panel ever re-derives money. A failed submit moves focus to the error summary;
 * a successful one writes the last order, clears the cart and shows the success
 * panel. The clock is a prop, never read directly.
 */
export function CheckoutForm({ now = () => new Date() }: CheckoutFormProps) {
  const lines = useCartStore(selectCartLines);
  const coupon = usePromoStore(selectAppliedCoupon);
  const setLastOrder = useOrdersStore((state) => state.setLastOrder);
  const clearCart = useCartStore((state) => state.clear);
  const summaryHeadingId = useId();

  const summaryRef = useRef<HTMLDivElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const [failedSubmitCount, setFailedSubmitCount] = useState(0);
  const [successOrder, setSuccessOrder] = useState<LastOrder | null>(null);

  // `handleOrder` is a function declaration so it can be handed to the hook
  // before `totals` is computed below: it closes over this render's cart, clock
  // and totals, which are still current when the processing delay fires.
  const form = useCheckoutForm({ now, onSubmit: handleOrder });

  const totals = useMemo(
    () => computeTotals(lines, products, coupon, form.shippingMethod),
    [lines, coupon, form.shippingMethod],
  );

  /** Builds and persists the order once the processing delay has elapsed. */
  function handleOrder(snapshot: CheckoutSnapshot): void {
    const order = buildLastOrder({
      lines,
      products,
      totals,
      email: snapshot.values.email,
      now: now(),
    });
    setLastOrder(order);
    clearCart();
    setSuccessOrder(order);
  }

  // The cart-level qualification is method-independent, so reading it from the
  // computed remaining amount keeps the standard row free even while a premium
  // method is selected.
  const freeStandardShipping = totals.items.length > 0 && totals.freeShippingRemaining === 0;

  // Keyed on the failed-submit count, not on the error list: the summary must be
  // focused once per failed submit, never again while the customer edits a field
  // (which would steal focus back from the input on every keystroke).
  useEffect(() => {
    if (failedSubmitCount > 0) {
      summaryRef.current?.focus();
    }
  }, [failedSubmitCount]);

  useEffect(() => {
    if (successOrder !== null) {
      successHeadingRef.current?.focus();
    }
  }, [successOrder]);

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!form.submit()) {
      setFailedSubmitCount((count) => count + 1);
    }
  };

  if (successOrder !== null) {
    return <CheckoutSuccess order={successOrder} headingRef={successHeadingRef} />;
  }

  return (
    <form onSubmit={handleFormSubmit} noValidate>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <p className="text-muted-foreground mt-1 text-sm">{CHECKOUT_COPY.formDescription}</p>

          <CheckoutErrorSummary errors={form.errorList} containerRef={summaryRef} />

          <AddressPanel
            values={form.values}
            errors={form.errors}
            onChange={form.setField}
            onBlur={form.blurField}
          />

          <ShippingMethodPanel
            value={form.shippingMethod}
            onChange={form.setShippingMethod}
            freeStandardShipping={freeStandardShipping}
          />

          <PaymentMethodPanel
            value={form.paymentMethod}
            onChange={form.setPaymentMethod}
            values={form.values}
            errors={form.errors}
            onFieldChange={form.setField}
            onFieldBlur={form.blurField}
          />
        </div>

        <aside className="flex flex-col gap-4">
          <section aria-labelledby={summaryHeadingId} className="border-border rounded-xl border p-4">
            <h2 id={summaryHeadingId} className="text-lg font-bold">
              {CHECKOUT_COPY.summaryHeading}
            </h2>
            <TotalsRows totals={totals} />
          </section>

          <Button type="submit" size="pill" disabled={form.submitting} className="w-full">
            {form.submitting ? CHECKOUT_COPY.processing : CHECKOUT_COPY.submit}
          </Button>
        </aside>
      </div>
    </form>
  );
}
