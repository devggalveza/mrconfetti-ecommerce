import { RotateCcw, ShieldCheck, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PRODUCT_PERKS_COPY } from "@/features/catalog/data/product-detail-content";
import { deliveryEstimate } from "@/features/catalog/lib/product-detail";
import type { Product } from "@/features/catalog/schemas/product";

type ProductPerksProps = {
  product: Product;
  /** Injected so the delivery estimate is never read from the clock in here. */
  now: Date;
};

type Perk = {
  icon: LucideIcon;
  title: string;
  detail: string;
};

/**
 * The three purchase perks under the buy controls: shipping, returns and warranty.
 *
 * The first perk swaps its title on `product.freeShipping` and derives its detail
 * line from the injected `now`, so the caller owns the clock and this component
 * stays a pure function of its props.
 */
export function ProductPerks({ product, now }: ProductPerksProps) {
  const perks: Perk[] = [
    {
      icon: Truck,
      title: product.freeShipping
        ? PRODUCT_PERKS_COPY.shippingFreeTitle
        : PRODUCT_PERKS_COPY.shippingPaidTitle,
      detail: deliveryEstimate(now, product.freeShipping),
    },
    {
      icon: RotateCcw,
      title: PRODUCT_PERKS_COPY.returnsTitle,
      detail: PRODUCT_PERKS_COPY.returnsDetail,
    },
    {
      icon: ShieldCheck,
      title: PRODUCT_PERKS_COPY.warrantyTitle,
      detail: PRODUCT_PERKS_COPY.warrantyDetail,
    },
  ];

  return (
    <ul className="border-border mt-6 grid list-none gap-4 border-t pt-6">
      {perks.map((perk) => (
        <li key={perk.title} className="grid grid-cols-[24px_minmax(0,1fr)] gap-4 text-sm">
          <perk.icon aria-hidden="true" className="text-brand size-5" />
          <div>
            <span className="block font-semibold">{perk.title}</span>
            <span className="text-muted-foreground">{perk.detail}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
