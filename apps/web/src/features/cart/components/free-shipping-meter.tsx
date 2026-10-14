import { CART_COPY } from "@/features/cart/data/cart-copy";
import type { CartTotals } from "@/features/cart/lib/totals";
import { formatMoney } from "@/lib/format";

/**
 * The free-shipping progress meter and its text state.
 *
 * The bar is a real `role="progressbar"` covering the whole `0..100` range, and the
 * message beneath it repeats the same state in words: the remaining amount while the
 * cart is short, and a success line once the cart ships free — whether because the
 * subtotal cleared the threshold or because every item ships free on its own. An
 * empty cart renders nothing.
 */
export function FreeShippingMeter({ totals }: { totals: CartTotals }) {
  if (totals.items.length === 0) {
    return null;
  }

  const percent = Math.round(totals.freeShippingProgress * 100);
  const message = totals.freeShippingApplied
    ? CART_COPY.freeShipping.reached
    : CART_COPY.freeShipping.remaining(formatMoney(totals.freeShippingRemaining));

  return (
    <div className="mt-4">
      <div
        role="progressbar"
        aria-label={CART_COPY.freeShipping.progressLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={message}
        className="bg-surface h-2 w-full overflow-hidden rounded-full"
      >
        <div className="bg-success h-full rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-muted-foreground mt-2 text-sm">{message}</p>
    </div>
  );
}
