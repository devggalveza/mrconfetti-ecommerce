import { useEffect, useState } from "react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { PRODUCT_STICKY_BAR_COPY } from "@/features/catalog/data/product-detail-content";
import type { Product } from "@/features/catalog/schemas/product";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type StickyAddToCartProps = {
  product: Product;
  /** Unit price of the current colour and pack selection, in GTQ. */
  unitPrice: number;
  quantity: number;
  onAdd: () => void;
  /** The primary add-to-cart control the bar watches. */
  targetRef: RefObject<HTMLElement | null>;
};

/**
 * The mobile-only add-to-cart bar pinned to the bottom of the viewport.
 *
 * It shows the price for the chosen quantity and only appears once the primary
 * add-to-cart control has scrolled out of view above the viewport. The scroll
 * state comes from an `IntersectionObserver` created inside an effect, guarded for
 * its absence because this route is server-rendered. While it is off-screen the
 * bar is `aria-hidden` and `inert`, so the hidden control never catches the
 * keyboard or a screen reader; the wide-screen breakpoint hides it in CSS as well.
 */
export function StickyAddToCart({
  product,
  unitPrice,
  quantity,
  onAdd,
  targetRef,
}: StickyAddToCartProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = targetRef.current;

    if (target === null || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];

      if (entry === undefined) {
        return;
      }

      setIsVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [targetRef]);

  return (
    <div
      aria-hidden={!isVisible}
      inert={!isVisible}
      className={cn(
        "bg-background border-border fixed inset-x-0 bottom-0 z-40 hidden items-center gap-4 border-t px-4 py-2 transition-transform duration-200 ease-out motion-reduce:transition-none max-md:flex",
        isVisible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <span className="flex-1 font-bold">{formatMoney(unitPrice * quantity)}</span>
      <Button
        type="button"
        size="pill"
        onClick={onAdd}
        aria-label={PRODUCT_STICKY_BAR_COPY.addAriaLabel(product.name)}
      >
        {PRODUCT_STICKY_BAR_COPY.addLabel}
      </Button>
    </div>
  );
}
