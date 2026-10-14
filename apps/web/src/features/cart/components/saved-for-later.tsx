import { useId } from "react";

import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";

import { CART_COPY } from "@/features/cart/data/cart-copy";
import { products } from "@/features/catalog/data/products";
import type { Product } from "@/features/catalog/schemas/product";
import { formatMoney } from "@/lib/format";
import { selectSavedIds } from "@/stores/selectors";
import { useSavedStore } from "@/stores/saved-store";

/**
 * The saved-for-later panel. It joins the saved ids to the catalogue, drops any id
 * the catalogue no longer knows, and renders nothing when the list is empty. Each
 * row can move the product into the cart or drop it from the saved list.
 */
export function SavedForLater() {
  const headingId = useId();
  const savedIds = useSavedStore(selectSavedIds);
  const moveToCart = useSavedStore((state) => state.moveToCart);
  const unsave = useSavedStore((state) => state.unsave);

  const savedProducts = savedIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => product !== undefined);

  if (savedProducts.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={headingId} className="mt-8">
      <h2 id={headingId} className="text-lg font-bold">
        {CART_COPY.saved.heading}
      </h2>

      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {savedProducts.map((product) => (
          <li
            key={product.id}
            className="border-border flex items-center gap-3 rounded-lg border p-3"
          >
            <img
              src={product.image}
              alt={CART_COPY.line.thumbnailAlt(product.name)}
              width={product.width}
              height={product.height}
              loading="lazy"
              decoding="async"
              className="border-border bg-surface size-14 shrink-0 rounded-lg border object-contain"
            />

            <div className="min-w-0 flex-1">
              <Link
                to="/products/$productId"
                params={{ productId: String(product.id) }}
                className="rounded-sm text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {product.name}
              </Link>
              <p className="mt-1 font-semibold">{formatMoney(product.price)}</p>
            </div>

            <button
              type="button"
              aria-label={CART_COPY.saved.moveToCartLabel(product.name)}
              onClick={() => {
                moveToCart(product.id);
              }}
              className="border-brand text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring inline-flex min-h-11 items-center rounded-full border px-3 text-sm font-semibold transition-colors"
            >
              {CART_COPY.saved.moveToCart}
            </button>

            <button
              type="button"
              aria-label={CART_COPY.saved.removeLabel(product.name)}
              onClick={() => {
                unsave(product.id);
              }}
              className="border-border text-muted-foreground hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring grid size-11 place-items-center rounded-full border transition-colors"
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
