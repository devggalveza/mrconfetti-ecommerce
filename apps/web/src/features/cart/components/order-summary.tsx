import { useId } from "react";

import { Link } from "@tanstack/react-router";

import { ClearCartDialog } from "@/features/cart/components/clear-cart-dialog";
import { CART_COPY } from "@/features/cart/data/cart-copy";
import type { CartTotals } from "@/features/cart/lib/totals";
import { formatMoney } from "@/lib/format";

/**
 * The cart summary: subtotal, the discount line only when something is discounted,
 * the shipping line (which reads `Gratis` when the cart ships free), the total, the
 * checkout link and the clear-all dialog trigger.
 *
 * Every amount comes from the `CartTotals` the route computed once; the summary
 * formats them and never re-derives money.
 */
export function OrderSummary({ totals }: { totals: CartTotals }) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="border-border rounded-xl border p-4">
      <h2 id={headingId} className="text-lg font-bold">
        {CART_COPY.summary.heading}
      </h2>

      <dl className="mt-3 flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{CART_COPY.summary.subtotal}</dt>
          <dd className="font-medium">{formatMoney(totals.subtotal)}</dd>
        </div>

        {totals.discount > 0 ? (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">{CART_COPY.summary.discount}</dt>
            <dd className="text-discount font-medium">-{formatMoney(totals.discount)}</dd>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{CART_COPY.summary.shipping}</dt>
          <dd className="font-medium">
            {totals.freeShippingApplied
              ? CART_COPY.summary.freeShipping
              : formatMoney(totals.shipping)}
          </dd>
        </div>

        <div className="border-border flex items-center justify-between gap-2 border-t pt-2 text-base">
          <dt className="font-semibold">{CART_COPY.summary.total}</dt>
          <dd className="font-extrabold">{formatMoney(totals.total)}</dd>
        </div>
      </dl>

      <Link
        to="/checkout"
        className="bg-brand hover:bg-brand-dark focus-visible:outline-ring mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {CART_COPY.summary.checkout}
      </Link>

      <div className="mt-2 flex justify-center">
        <ClearCartDialog />
      </div>
    </section>
  );
}
