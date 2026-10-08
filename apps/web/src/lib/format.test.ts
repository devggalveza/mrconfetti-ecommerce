import { describe, expect, it } from "vitest";

import { formatDiscount, formatMoney, formatRating, formatReviewCount } from "./format";

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

describe("formatRating", () => {
  it("renders the rounded rating with a comma decimal separator", () => {
    expect(formatRating(4.9, 312)).toBe("4,9 (312)");
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
