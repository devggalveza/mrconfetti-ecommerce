import { describe, expect, it } from "vitest";

import {
  formatDiscount,
  formatMoney,
  formatRating,
  formatRatingValue,
  formatReviewCount,
  roundMoney,
} from "./format";

describe("formatMoney", () => {
  it("drops the trailing .00 for whole amounts", () => {
    expect(formatMoney(149)).toBe("Q.149");
    expect(formatMoney(0)).toBe("Q.0");
  });

  it("groups thousands with a comma", () => {
    expect(formatMoney(1234)).toBe("Q.1,234");
  });

  it("keeps exactly two decimals when the amount has cents", () => {
    expect(formatMoney(4.95)).toBe("Q.4.95");
    expect(formatMoney(149.5)).toBe("Q.149.50");
  });

  it("rounds to two decimals before formatting", () => {
    expect(formatMoney(149.999)).toBe("Q.150");
  });
});

describe("roundMoney", () => {
  it("rounds half a cent up when the scaled product lands exactly on x.5", () => {
    expect(roundMoney(0.005)).toBe(0.01);
    expect(roundMoney(0.015)).toBe(0.02);
  });

  it("rounds down when IEEE-754 scaling lands just below x.5", () => {
    expect(roundMoney(1.005)).toBe(1);
  });

  it("rounds the remaining cent boundary half up", () => {
    expect(roundMoney(129.665)).toBe(129.67);
  });
});

describe("formatRating", () => {
  it("renders the rounded rating with a comma decimal separator", () => {
    expect(formatRating(4.9, 312)).toBe("4,9 (312)");
  });
});

describe("formatRatingValue", () => {
  it("renders one decimal with a comma separator and no review count", () => {
    expect(formatRatingValue(4.9)).toBe("4,9");
  });

  it("rounds half up when the scaled value lands exactly on x.5", () => {
    expect(formatRatingValue(4.65)).toBe("4,7");
    expect(formatRatingValue(4.95)).toBe("5,0");
  });

  it("keeps the tenth below the boundary", () => {
    expect(formatRatingValue(4.94)).toBe("4,9");
  });

  it("pads whole ratings to one decimal", () => {
    expect(formatRatingValue(5)).toBe("5,0");
    expect(formatRatingValue(0)).toBe("0,0");
  });

  it("stays the sole rule behind formatRating's rating part", () => {
    for (const rating of [0, 4.65, 4.94, 5, 3.45]) {
      expect(formatRating(rating, 7).startsWith(formatRatingValue(rating))).toBe(true);
    }
  });
});

describe("formatDiscount", () => {
  it("renders a negative percentage with a space before the sign", () => {
    expect(formatDiscount(40)).toBe("-40 %");
  });
});

describe("formatReviewCount", () => {
  it("uses the plural form for counts other than one", () => {
    expect(formatReviewCount(312)).toBe("312 reseñas");
  });

  it("uses the singular form for exactly one review", () => {
    expect(formatReviewCount(1)).toBe("1 reseña");
  });
});
