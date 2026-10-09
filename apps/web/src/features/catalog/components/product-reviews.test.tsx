// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProductReviews } from "@/features/catalog/components/product-reviews";
import { PRODUCT_REVIEWS_COPY } from "@/features/catalog/data/product-detail-content";
import { products } from "@/features/catalog/data/products";
import { reviewDistribution } from "@/features/catalog/lib/product-detail";
import { formatRatingValue } from "@/lib/format";

/** Star values in the order the bars render, matching the component's own order. */
const STAR_VALUES = [5, 4, 3, 2, 1] as const;

/** A real catalogue row, so the bars come from the same aggregate the page shows. */
const product = products[0];

afterEach(() => {
  cleanup();
});

describe("ProductReviews", () => {
  it("prints the five shares of the distribution in star order", () => {
    render(<ProductReviews product={product} />);

    const distribution = reviewDistribution(product.rating, product.reviews);
    const bars = screen.getAllByRole("meter");

    expect(bars).toHaveLength(STAR_VALUES.length);

    bars.forEach((bar, index) => {
      const row = bar.parentElement;

      if (row === null) {
        throw new Error("distribution row is missing");
      }

      const share = distribution[index] ?? -1;
      expect(within(row).getByText(PRODUCT_REVIEWS_COPY.percentLabel(share))).toBeTruthy();
    });
  });

  it("keeps each bar's share available to assistive technology", () => {
    render(<ProductReviews product={product} />);

    const distribution = reviewDistribution(product.rating, product.reviews);

    STAR_VALUES.forEach((stars, index) => {
      const bar = screen.getByRole("meter", { name: PRODUCT_REVIEWS_COPY.starRowLabel(stars) });

      expect(bar.getAttribute("aria-valuenow")).toBe(String(distribution[index]));
      expect(bar.getAttribute("aria-valuemin")).toBe("0");
      expect(bar.getAttribute("aria-valuemax")).toBe("100");
    });
  });

  it("prints the aggregate line and the featured review cards", () => {
    render(<ProductReviews product={product} />);

    expect(
      screen.getByText(PRODUCT_REVIEWS_COPY.aggregateLabel(formatRatingValue(product.rating))),
    ).toBeTruthy();

    for (const review of product.customerReviews) {
      expect(screen.getByText(review.author)).toBeTruthy();
      expect(screen.getByText(review.body)).toBeTruthy();
    }
  });
});
