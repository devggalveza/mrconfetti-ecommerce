/**
 * Rounds a GTQ amount to two decimals with the half-up rule `Math.round(amount * 100) / 100`.
 *
 * The scaling is plain IEEE-754 double arithmetic, so the rounded direction follows
 * the scaled product rather than the decimal literal: values whose product lands
 * exactly on `x.5` round away from zero (`0.005` becomes `0.01`), while a value whose
 * product lands just below `x.5` rounds down (`1.005` becomes `1`).
 */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Formats a GTQ amount as `Q.` plus thousands groups, dropping a trailing `.00`. */
export function formatMoney(amount: number): string {
  const rounded = roundMoney(amount);
  const [integerPart = "0", decimalPart = "00"] = rounded.toFixed(2).split(".");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimalPart === "00" ? `Q.${grouped}` : `Q.${grouped}.${decimalPart}`;
}

/** Formats a rating to one decimal with a comma separator, plus its review count. */
export function formatRating(rating: number, reviews: number): string {
  const rounded = Math.round(rating * 10) / 10;
  return `${rounded.toFixed(1).replace(".", ",")} (${reviews})`;
}

/** Formats a discount percentage as `-NN %`. */
export function formatDiscount(percent: number): string {
  return `-${percent} %`;
}

/** Formats a review count with the correct Spanish singular/plural noun. */
export function formatReviewCount(reviews: number): string {
  return `${reviews} ${reviews === 1 ? "reseña" : "reseñas"}`;
}
