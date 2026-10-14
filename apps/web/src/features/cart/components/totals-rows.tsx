import { CART_COPY } from "@/features/cart/data/cart-copy";
import type { CartTotals } from "@/features/cart/lib/totals";
import { formatMoney } from "@/lib/format";

/**
 * The cart's amount rows: the subtotal, the discount only when something is
 * discounted, the shipping line (which reads `Gratis` when the cart ships free)
 * and the total.
 *
 * Extracted from the cart's order summary so the summary and the checkout amount
 * block render identical rows from the one `CartTotals` the caller computed.
 */
export function TotalsRows({ totals }: { totals: CartTotals }) {
  return (
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
  );
}
