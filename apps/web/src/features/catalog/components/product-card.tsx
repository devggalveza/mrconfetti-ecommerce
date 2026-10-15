import { Link } from "@tanstack/react-router";
import { Eye, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Product } from "@/features/catalog/schemas/product";
import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

import { ProductPrice } from "./product-price";
import { ProductRating } from "./product-rating";

type ProductCardProps = {
  product: Product;
  className?: string;
  /** Above-the-fold cards load eagerly so the first rail is not lazy-loaded. */
  priority?: boolean;
};

/**
 * Card action copy. Both controls are icon-only, so this copy never renders as
 * visible text: it is the verb that the visually hidden label composes with the
 * product name, keeping a grid of look-alike cards navigable by name while the
 * control stays a compact 40px square.
 */
const PRODUCT_CARD_ACTION_COPY = {
  view: "Ver",
  add: "Agregar",
  toast: "Añadido al carrito",
} as const;

/**
 * Reveal contract of the image overlay: hidden and lifted until the image area is
 * hovered or holds focus, and always shown where hovering is not available. The
 * no-hover cases are covered twice: `pointer: coarse` / `any-pointer: coarse` for
 * touch and hybrid touchscreens, and `@media (hover: none)` for a device that
 * reports no hover at all. The box itself stays `pointer-events-none` so only the
 * controls capture clicks and the image link keeps the rest of its surface.
 */
const OVERLAY_BOX = cn(
  "pointer-events-none absolute inset-0 z-10 flex min-w-0 items-center justify-center gap-2 rounded-xl bg-gray-500/40 p-2",
  "translate-y-1 opacity-0 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
  "group-hover/image:translate-y-0 group-hover/image:opacity-100",
  "group-focus-within/image:translate-y-0 group-focus-within/image:opacity-100",
  "pointer-coarse:translate-y-0 pointer-coarse:opacity-100",
  "any-pointer-coarse:translate-y-0 any-pointer-coarse:opacity-100",
  "[@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100",
);

/**
 * Each control stays inert while the overlay is closed, so an invisible control
 * cannot swallow a click. Focus-within still reveals the box, so tabbing to a
 * control never lands on an invisible target. The same no-hover media variants that
 * open the box also make its controls clickable.
 */
const OVERLAY_CONTROL_REVEAL = cn(
  "pointer-events-none",
  "group-hover/image:pointer-events-auto",
  "group-focus-within/image:pointer-events-auto",
  "pointer-coarse:pointer-events-auto",
  "any-pointer-coarse:pointer-events-auto",
  "[@media(hover:none)]:pointer-events-auto",
);

/**
 * Shared surface of the two image-frame actions: a 40px square icon control, large
 * enough to tap on a card but smaller than the frame it sits on. `rounded-xl` keeps
 * it a soft square rather than a full circle, and the white fill matches the card's
 * own background so the pair reads as one cluster over the grey backdrop.
 */
const OVERLAY_ICON_CONTROL_CLASS = cn(
  "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white p-0 text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
  OVERLAY_CONTROL_REVEAL,
);

/**
 * The storefront product card: image frame, favourite toggle, title, rating, price
 * and the optional free-shipping line. It owns only the two image-frame actions —
 * an eye-icon link to the detail route and a cart-icon one-unit add — and knows
 * nothing about grid or rail sizing. Both are icon-only squares whose wording lives
 * in visually hidden text, so a screen reader still hears the verb and the product.
 * Buying in quantity still happens on the detail route.
 */
export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const productId = String(product.id);
  const addToCart = useCartStore((state) => state.add);

  const handleAdd = (): void => {
    addToCart(product.id, 1);
    toast(PRODUCT_CARD_ACTION_COPY.toast);
  };

  return (
    <article className={cn("relative flex min-w-0 flex-col gap-2 bg-background", className)}>
      <div className="group/image relative">
        <Link
          to="/products/$productId"
          params={{ productId }}
          className="block aspect-square w-full overflow-hidden rounded-xl border border-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <img
            src={product.image}
            alt={product.name}
            width={product.width}
            height={product.height}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className="block h-full w-full rounded-lg object-contain"
          />
        </Link>

        {/* Siblings of the image link, never nested inside it: the frame stays one
            navigation target while the controls keep their own hit areas. */}
        <div className={OVERLAY_BOX}>
          <Link to="/products/$productId" params={{ productId }} className={OVERLAY_ICON_CONTROL_CLASS}>
            <Eye aria-hidden="true" className="size-5" />
            <span className="sr-only">
              {PRODUCT_CARD_ACTION_COPY.view} {product.name}
            </span>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className={cn(OVERLAY_ICON_CONTROL_CLASS, "min-w-0 shadow-none hover:text-gray-900")}
          >
            <ShoppingCart aria-hidden="true" className="size-5" />
            <span className="sr-only">
              {PRODUCT_CARD_ACTION_COPY.add} {product.name} al carrito
            </span>
          </Button>
        </div>

        {/* Above the overlay so the heart keeps its corner and stays clickable. */}
        <FavoriteButton productId={product.id} productName={product.name} className="z-20" />
      </div>

      <h3 className="line-clamp-2 min-h-[2.8em] text-base leading-[1.4] font-medium">
        <Link
          to="/products/$productId"
          params={{ productId }}
          className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {product.name}
        </Link>
      </h3>

      <ProductRating rating={product.rating} reviews={product.reviews} />
      <ProductPrice product={product} />

      {product.freeShipping ? (
        <p className="mt-auto text-xs font-semibold text-success">Envío gratis</p>
      ) : null}
    </article>
  );
}
