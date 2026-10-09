import { Star } from "lucide-react";

import { PRODUCT_REVIEWS_COPY } from "@/features/catalog/data/product-detail-content";
import { reviewDistribution } from "@/features/catalog/lib/product-detail";
import type { Product } from "@/features/catalog/schemas/product";
import { formatRatingValue } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Star values in the order the distribution bars are rendered: 5★ down to 1★. */
const STAR_VALUES = [5, 4, 3, 2, 1] as const;

/** Highest star value, used for the review card clusters. */
const MAX_STARS = 5;

type ProductReviewsProps = {
  product: Product;
};

/**
 * The reviews panel: the five distribution bars, the aggregate line and the
 * featured review cards.
 *
 * The bars come from `reviewDistribution(product.rating, product.reviews)` against
 * the 5★ to 1★ rows. Each row prints its share, and the same figure is exposed to
 * assistive technology on the bar itself (`role="meter"` with `aria-valuenow`), so
 * the figure never rests on the bar width alone. The printed share is `aria-hidden`
 * because the meter already announces it. The featured cards are the model's
 * highlight set, which is shorter than the aggregate count by design.
 */
export function ProductReviews({ product }: ProductReviewsProps) {
  const distribution = reviewDistribution(product.rating, product.reviews);

  return (
    <div>
      <div
        role="group"
        aria-label={PRODUCT_REVIEWS_COPY.barsLabel}
        className="mb-6 grid max-w-[360px] gap-1.5 text-[13px] text-muted-foreground"
      >
        {STAR_VALUES.map((stars, index) => {
          const percent = distribution[index] ?? 0;

          return (
            <div
              key={stars}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.75rem] items-center gap-2"
            >
              <span className="flex items-center gap-0.5">
                <span>{stars}</span>
                <Star aria-hidden="true" className="size-3 fill-current" strokeWidth={0} />
              </span>
              <span
                role="meter"
                aria-label={PRODUCT_REVIEWS_COPY.starRowLabel(stars)}
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="bg-border relative block h-2 overflow-hidden rounded-full"
              >
                <span
                  aria-hidden="true"
                  style={{ width: `${percent}%` }}
                  className="bg-warning absolute inset-y-0 left-0 rounded-full"
                />
              </span>
              <span aria-hidden="true" className="text-right tabular-nums">
                {PRODUCT_REVIEWS_COPY.percentLabel(percent)}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-muted-foreground mb-6 text-sm">
        {PRODUCT_REVIEWS_COPY.aggregateLabel(formatRatingValue(product.rating))}
      </p>

      <ul className="grid list-none gap-0">
        {product.customerReviews.map((review) => (
          <li key={review.author} className="border-border border-b py-4 last:border-b-0">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold">{review.author}</span>
              <span
                role="img"
                aria-label={PRODUCT_REVIEWS_COPY.starRowLabel(review.rating)}
                className="text-warning flex items-center"
              >
                {Array.from({ length: MAX_STARS }, (_, starIndex) => (
                  <Star
                    key={starIndex}
                    aria-hidden="true"
                    className={cn(
                      "size-4",
                      starIndex < review.rating ? "fill-current" : "opacity-35",
                    )}
                  />
                ))}
              </span>
              <span className="text-muted-foreground text-xs">
                {PRODUCT_REVIEWS_COPY.verifiedBadge}
              </span>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">{review.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
