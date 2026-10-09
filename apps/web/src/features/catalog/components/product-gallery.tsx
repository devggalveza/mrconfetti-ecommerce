import { useState } from "react";

import { PRODUCT_GALLERY_COPY } from "@/features/catalog/data/product-detail-content";
import { discountPercent } from "@/features/catalog/lib/selectors";
import type { Product } from "@/features/catalog/schemas/product";
import { formatDiscount } from "@/lib/format";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  product: Product;
};

/** One image the gallery can show, with the intrinsic size the source declares. */
type GalleryView = {
  image: string;
  width: number;
  height: number;
  label: string;
};

/**
 * The detail gallery: a stage with the product image and a click/keyboard zoom,
 * plus the thumbnail list.
 *
 * The catalogue model carries exactly one `image` per product, so there is one view
 * and one thumbnail. The list stays rendered and named rather than being dropped or
 * padded out with fake angles, and the thumbnail is a pressed-state button — not a
 * `tablist` of one, which would promise a tab interaction that does not exist — so
 * extra shots the model may gain later need no markup change. The stage names itself
 * from the copy module with the product and the state of the zoom, so its accessible
 * name never falls back to a run-on of the badge, the image alt and the hint.
 * Zooming only swaps the resting scale for the enlarged one and its hint; the
 * pointer-following origin of the source design is not reproduced.
 */
export function ProductGallery({ product }: ProductGalleryProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeView, setActiveView] = useState(0);
  const percent = discountPercent(product);
  const hasDiscount = percent > 0;

  const views: GalleryView[] = [
    { image: product.image, width: product.width, height: product.height, label: product.name },
  ];
  const currentView = views[activeView] ?? views[0];

  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-4 max-md:grid-cols-1">
      <ul
        aria-label={PRODUCT_GALLERY_COPY.thumbnailsLabel}
        className="flex list-none flex-col gap-2 max-md:order-2 max-md:flex-row max-md:overflow-x-auto"
      >
        {views.map((view, index) => (
          <li key={view.image} className="flex-none">
            <button
              type="button"
              aria-pressed={index === activeView}
              aria-label={view.label}
              onClick={() => {
                setActiveView(index);
              }}
              className="bg-background focus-visible:outline-ring grid size-[72px] place-items-center rounded-lg border border-border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 aria-pressed:border-2 aria-pressed:border-brand"
            >
              <img
                src={view.image}
                alt=""
                width={view.width}
                height={view.height}
                className="block max-h-[88%] max-w-[88%] object-contain"
              />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        aria-pressed={isZoomed}
        aria-label={PRODUCT_GALLERY_COPY.stageLabel(product.name, isZoomed)}
        onClick={() => {
          setIsZoomed((zoomed) => !zoomed);
        }}
        className={cn(
          "bg-background relative grid aspect-square cursor-zoom-in place-items-center overflow-hidden rounded-xl border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          isZoomed && "cursor-zoom-out",
        )}
      >
        {hasDiscount ? (
          <span className="bg-discount absolute top-4 left-4 z-1 rounded-full px-3 py-0.5 text-[13px] font-bold text-white">
            {formatDiscount(percent)}
          </span>
        ) : null}

        <img
          src={currentView.image}
          alt={currentView.label}
          width={currentView.width}
          height={currentView.height}
          className={cn(
            "block h-auto max-h-[92%] w-auto max-w-[92%] object-contain transition-transform duration-300 ease-out motion-reduce:transition-none",
            isZoomed && "scale-[1.8]",
          )}
        />

        <span className="border-border bg-background text-muted-foreground absolute right-4 bottom-4 rounded-full border px-3 py-0.5 text-xs">
          {isZoomed ? PRODUCT_GALLERY_COPY.zoomOut : PRODUCT_GALLERY_COPY.zoomIn}
        </span>
      </button>
    </div>
  );
}
