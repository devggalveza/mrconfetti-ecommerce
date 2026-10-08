import { useCallback, useEffect, useRef, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Product } from "@/features/catalog/schemas/product";
import { SectionHeading } from "@/features/home/components/section-heading";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import { ProductCard } from "./product-card";

/** `(100% - (columns - 1) * gap) / columns` at the four rail breakpoints. */
const RAIL_ITEM_WIDTH =
  "w-[calc((100%_-_4rem)/5)] max-lg:w-[calc((100%_-_3rem)/4)] max-md:w-[calc((100%_-_2rem)/3)] max-[480px]:w-[calc((100%_-_1rem)/2)]";

const ARROW_CLASS =
  "absolute top-[35%] z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default disabled:opacity-40 max-lg:hidden";

type ProductRailProps = {
  products: readonly Product[];
  title: string;
  headingId: string;
  actionHref: string;
};

/**
 * A horizontally scrollable product rail with a section heading and edge
 * arrows. Touch scrolling takes over below 1024px, where the arrows are hidden.
 */
export function ProductRail({ products, title, headingId, actionHref }: ProductRailProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  const updateArrows = useCallback((): void => {
    const node = scrollerRef.current;
    // `scrollWidth === 0` means the layout has not been measured yet (SSR or jsdom).
    if (node === null || node.scrollWidth === 0) {
      return;
    }
    const maxScrollLeft = node.scrollWidth - node.clientWidth;
    setCanScrollLeft(node.scrollLeft > 0);
    setCanScrollRight(node.scrollLeft < maxScrollLeft - 1);
  }, []);

  useEffect(() => {
    const node = scrollerRef.current;
    if (node === null) {
      return;
    }

    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    observer.observe(node);
    window.addEventListener("resize", updateArrows);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  const scrollByViewport = (direction: -1 | 1): void => {
    const node = scrollerRef.current;
    if (node === null) {
      return;
    }
    node.scrollBy({
      left: direction * node.clientWidth,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <section aria-labelledby={headingId} className="mt-8">
      <SectionHeading title={title} headingId={headingId} actionHref={actionHref} />

      <div className="relative">
        <button
          type="button"
          aria-label="Desplazar a la izquierda"
          disabled={!canScrollLeft}
          onClick={() => {
            scrollByViewport(-1);
          }}
          className={cn(ARROW_CLASS, "-left-4")}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>

        <ul
          ref={scrollerRef}
          aria-labelledby={headingId}
          tabIndex={0}
          onScroll={updateArrows}
          className="flex list-none snap-x snap-proximity gap-4 overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product, index) => (
            <li key={product.id} className={cn("flex-none snap-start", RAIL_ITEM_WIDTH)}>
              <ProductCard product={product} priority={index === 0} />
            </li>
          ))}
        </ul>

        <button
          type="button"
          aria-label="Desplazar a la derecha"
          disabled={!canScrollRight}
          onClick={() => {
            scrollByViewport(1);
          }}
          className={cn(ARROW_CLASS, "-right-4")}
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>
    </section>
  );
}
