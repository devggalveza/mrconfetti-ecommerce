import { Badge } from "@/components/ui/badge";
import { discountPercent } from "@/features/catalog/lib/selectors";
import type { Product } from "@/features/catalog/schemas/product";
import { formatDiscount, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ProductPriceSize = "default" | "compact";

type ProductPriceProps = {
  product: Product;
  /** `compact` is the smaller row the cart and order summaries use. */
  size?: ProductPriceSize;
};

/**
 * The price row: the current price in bold, the struck-through original and the
 * discount badge. Without a discount only the current price renders.
 */
export function ProductPrice({ product, size = "default" }: ProductPriceProps) {
  const percent = discountPercent(product);
  const hasDiscount = percent > 0;
  const isCompact = size === "compact";

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={cn("font-extrabold", isCompact ? "text-base" : "text-[22px]")}>
        {formatMoney(product.price)}
      </span>
      {hasDiscount ? (
        <>
          <s className={cn("text-muted-foreground", isCompact ? "text-xs" : "text-sm")}>
            {formatMoney(product.original)}
          </s>
          <Badge variant="discount" className={isCompact ? "text-xs" : undefined}>
            {formatDiscount(percent)}
          </Badge>
        </>
      ) : null}
    </div>
  );
}
