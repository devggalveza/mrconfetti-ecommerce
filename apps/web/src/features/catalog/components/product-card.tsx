import { Link } from "@tanstack/react-router";
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
 * The storefront product card: image frame, favourite toggle, title, rating,
 * price, optional free-shipping line and the add-to-cart pill. It is purely
 * presentational and knows nothing about grid or rail sizing.
 */
export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.add);
  const productId = String(product.id);

  const handleAddToCart = (): void => {
    addToCart(product.id, 1);
    toast("Añadido al carrito");
  };

  return (
    <article className={cn("relative flex min-w-0 flex-col gap-2 bg-background", className)}>
      <FavoriteButton productId={product.id} productName={product.name} />

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

      <Button
        type="button"
        variant="outline"
        size="pill"
        onClick={handleAddToCart}
        className="self-start border-brand text-brand hover:bg-brand hover:text-primary-foreground"
      >
        Añadir al carrito
      </Button>
    </article>
  );
}
