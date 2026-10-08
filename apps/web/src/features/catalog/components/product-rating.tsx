import { Star } from "lucide-react";

import { formatRating } from "@/lib/format";

const STAR_COUNT = 5;

type ProductRatingProps = {
  rating: number;
  reviews: number;
};

/**
 * The product rating row: a decorative five-star cluster in the amber token
 * plus the readable `4,9 (312)` text that carries the accessible value.
 */
export function ProductRating({ rating, reviews }: ProductRatingProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span aria-hidden="true" className="flex items-center text-warning">
        {Array.from({ length: STAR_COUNT }, (_, index) => (
          <Star key={index} className="size-3.5 fill-current" strokeWidth={1.5} />
        ))}
      </span>
      <span>{formatRating(rating, reviews)}</span>
    </div>
  );
}
