import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";

import { CART_COPY } from "@/features/cart/data/cart-copy";
import type { CartItem } from "@/features/cart/lib/totals";
import { QuantityStepper } from "@/features/catalog/components/quantity-stepper";
import { formatMoney } from "@/lib/format";
import { useCartStore } from "@/stores/cart-store";
import { useSavedStore } from "@/stores/saved-store";

/**
 * One cart line: thumbnail, linked name, unit price, the shared quantity stepper,
 * the pre-discount line subtotal, and the remove and save-for-later actions.
 *
 * The stepper is the catalogue's own, so its floor is `1` and its ceiling is
 * `quantityLimit(product)`; quantity and remove writes go through the cart store and
 * the save action through the saved store. Every control is at least 44px.
 */
export function CartLine({ item }: { item: CartItem }) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const saveForLater = useSavedStore((state) => state.saveForLater);
  const { product } = item;

  return (
    <li className="flex gap-4 py-4">
      <img
        src={product.image}
        alt={CART_COPY.line.thumbnailAlt(product.name)}
        width={product.width}
        height={product.height}
        loading="lazy"
        decoding="async"
        className="border-border bg-surface size-20 shrink-0 rounded-lg border object-contain"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-base leading-snug font-medium">
            <Link
              to="/products/$productId"
              params={{ productId: String(product.id) }}
              className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {product.name}
            </Link>
          </h2>

          <p className="font-bold">{formatMoney(item.lineSubtotal)}</p>
        </div>

        <p className="text-muted-foreground flex gap-1 text-xs">
          <span>{CART_COPY.line.unitPriceLabel}:</span>
          <span>{formatMoney(item.unitPrice)}</span>
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <QuantityStepper
            product={product}
            value={item.quantity}
            onChange={(next) => {
              setQuantity(product.id, next);
            }}
          />

          <button
            type="button"
            aria-label={CART_COPY.line.removeLabel(product.name)}
            onClick={() => {
              remove(product.id);
            }}
            className="border-border text-muted-foreground hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring grid size-11 place-items-center rounded-full border transition-colors"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>

          <button
            type="button"
            aria-label={CART_COPY.line.saveLabel(product.name)}
            onClick={() => {
              saveForLater(product.id);
            }}
            className="border-border text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors"
          >
            {CART_COPY.line.save}
          </button>
        </div>
      </div>
    </li>
  );
}
