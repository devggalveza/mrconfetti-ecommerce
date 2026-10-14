import { useId } from "react";

import { Link } from "@tanstack/react-router";

import { ClearCartDialog } from "@/features/cart/components/clear-cart-dialog";
import { CART_COPY } from "@/features/cart/data/cart-copy";
import type { CartTotals } from "@/features/cart/lib/totals";

import { TotalsRows } from "./totals-rows";

/**
 * The cart summary: the shared amount rows, the checkout link and the clear-all
 * dialog trigger.
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

      <TotalsRows totals={totals} />

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
