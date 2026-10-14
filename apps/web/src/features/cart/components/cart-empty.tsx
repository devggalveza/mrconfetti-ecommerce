import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";

import { CART_COPY } from "@/features/cart/data/cart-copy";

/**
 * The empty-cart state. It replaces the line list and the summary when the cart has
 * no items, points back at the catalogue, and shows no money.
 */
export function CartEmpty() {
  return (
    <section className="bg-surface rounded-lg px-4 py-12 text-center">
      <ShoppingBag
        aria-hidden="true"
        strokeWidth={1.4}
        className="text-muted-foreground mx-auto mb-3 size-12"
      />
      <h2 className="text-lg font-bold">{CART_COPY.empty.heading}</h2>
      <p className="text-muted-foreground mx-auto mt-1 mb-4 max-w-[48ch] text-sm">
        {CART_COPY.empty.message}
      </p>
      <Link
        to="/products"
        className="bg-brand hover:bg-brand-dark focus-visible:outline-ring inline-flex min-h-11 items-center rounded-full px-6 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {CART_COPY.empty.cta}
      </Link>
    </section>
  );
}
