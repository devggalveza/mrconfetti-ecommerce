import type { RefObject } from "react";

import { Link } from "@tanstack/react-router";

import { formatMoney } from "@/lib/format";
import type { LastOrder } from "@/stores/orders-store";

import { CHECKOUT_COPY } from "../data/checkout-copy";

export type CheckoutSuccessProps = {
  /** The order the form just wrote, rendered without reading any store. */
  order: LastOrder;
  /** The heading the form focuses once the order is placed. */
  headingRef?: RefObject<HTMLHeadingElement | null>;
};

/** The order confirmation panel: the reference, the total, the email and a way back. */
export function CheckoutSuccess({ order, headingRef }: CheckoutSuccessProps) {
  return (
    <section className="bg-surface rounded-xl p-6 text-center">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="focus-visible:outline-ring text-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {CHECKOUT_COPY.success.heading}
      </h2>
      <p className="text-muted-foreground mt-2">{CHECKOUT_COPY.success.reference(order.ref)}</p>

      <dl className="border-border mx-auto mt-4 flex max-w-xs flex-col gap-2 border-t pt-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{CHECKOUT_COPY.success.totalLabel}</dt>
          <dd className="font-extrabold">{formatMoney(order.total)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{CHECKOUT_COPY.success.emailLabel}</dt>
          <dd className="font-medium">{order.email}</dd>
        </div>
      </dl>

      <Link
        to="/products"
        className="bg-brand hover:bg-brand-dark focus-visible:outline-ring mt-6 inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {CHECKOUT_COPY.success.backToCatalog}
      </Link>
    </section>
  );
}
