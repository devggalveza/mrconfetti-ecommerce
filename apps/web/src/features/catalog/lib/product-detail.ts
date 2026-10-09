import { MAX_QUANTITY } from "@/lib/constants";
import { roundMoney } from "@/lib/format";

import type { Product, ProductPack } from "../schemas/product";

/** Star values in the order the review bars are rendered: 5★ down to 1★. */
const STAR_VALUES = [5, 4, 3, 2, 1] as const;

/** Exponent search bounds; the mean is monotone in the exponent over this range. */
const THETA_BOUND = 60;

/** Fixed locale and time zone for the delivery line, so the copy never drifts by host. */
const DELIVERY_LOCALE = "es-ES";
const DELIVERY_TIME_ZONE = "UTC";

/** Calendar days added before the Sunday skip: free shipping promises one day sooner. */
const FREE_SHIPPING_LEAD_DAYS = 1;
const PAID_SHIPPING_LEAD_DAYS = 2;

/** Mean star value of the maximum-entropy distribution with the given exponent. */
function meanStarValue(theta: number): number {
  // Weights are centred on three stars so the exponent stays representable.
  const weights = STAR_VALUES.map((stars) => Math.exp(theta * (stars - 3)));
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const weightedStars = weights.reduce((sum, weight, index) => sum + weight * (STAR_VALUES[index] ?? 0), 0);
  return weightedStars / weightTotal;
}

/** Rounds fractional weights into integers that still sum to exactly `total`. */
function largestRemainder(weights: readonly number[], total: number): number[] {
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const exact = weights.map((weight) => (weight / weightTotal) * total);
  const rounded = exact.map((value) => Math.floor(value));
  let remaining = total - rounded.reduce((sum, value) => sum + value, 0);
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of byRemainder) {
    if (remaining <= 0) {
      break;
    }
    rounded[index] = (rounded[index] ?? 0) + 1;
    remaining -= 1;
  }
  return rounded;
}

/**
 * Distributes an aggregate rating over the five review bars as integer percentages
 * ordered 5★ to 1★.
 *
 * The only honest input is the aggregate, so the buckets are the maximum-entropy
 * (least-committal) distribution whose mean equals `rating`: an exponential tilt
 * solved by bisection, then rounded with the largest-remainder method so the five
 * buckets always sum to exactly 100. A 5.0 rating puts the whole mass on 5★ and a
 * rating at or below 1.0 puts it all on 1★. `total` gates the result: with no reviews
 * there is nothing to distribute and five zeros are returned. A non-finite rating such
 * as `NaN` fails every comparison, so the bisection drives the tilt to its lower bound
 * and the whole mass lands on 1★.
 */
export function reviewDistribution(rating: number, total: number): number[] {
  if (total <= 0) {
    return [0, 0, 0, 0, 0];
  }
  if (rating >= 5) {
    return [100, 0, 0, 0, 0];
  }
  if (rating <= 1) {
    return [0, 0, 0, 0, 100];
  }

  let low = -THETA_BOUND;
  let high = THETA_BOUND;
  for (let step = 0; step < 100; step += 1) {
    const mid = (low + high) / 2;
    if (meanStarValue(mid) < rating) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const theta = (low + high) / 2;
  const weights = STAR_VALUES.map((stars) => Math.exp(theta * (stars - 3)));
  return largestRemainder(weights, 100);
}

/**
 * Per-instalment amount for the `3 pagos sin intereses` line, rounded to cents with
 * the same half-up rule `lib/format.ts` applies to money. `count` is clamped to at
 * least one so a zero or negative plan cannot divide by zero.
 */
export function instalments(price: number, count: number): number {
  const safeCount = Math.max(1, Math.trunc(count));
  return roundMoney(price / safeCount);
}

/** Base price plus the selected pack's surcharge, in GTQ; the base pack adds zero. */
export function priceWithPack(product: Product, pack: ProductPack): number {
  return product.price + pack.extra;
}

/**
 * Highest quantity the add-to-cart stepper may offer for `product`.
 *
 * A product with no stock is unbuyable and yields `0`, and a negative `stock` is
 * treated the same way because a ceiling can never be negative. Otherwise the
 * limit is the smaller of {@link MAX_QUANTITY} and the units on hand, so a large
 * stock still respects the per-order ceiling the shared constants define.
 */
export function quantityLimit(product: Product): number {
  if (product.stock <= 0) {
    return 0;
  }
  return Math.min(MAX_QUANTITY, product.stock);
}

/**
 * Spanish delivery line for the perks block, derived from the injected `now`.
 *
 * Rule: add one calendar day for free shipping and two for paid shipping, then keep
 * pushing forward while the target lands on a Sunday, so a promised date is never a
 * Sunday. Weekday, day and month are rendered with the fixed `es-ES` locale in UTC.
 */
export function deliveryEstimate(now: Date, freeShipping: boolean): string {
  const leadDays = freeShipping ? FREE_SHIPPING_LEAD_DAYS : PAID_SHIPPING_LEAD_DAYS;
  const target = new Date(now.getTime());
  target.setUTCDate(target.getUTCDate() + leadDays);
  while (target.getUTCDay() === 0) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  const parts = new Intl.DateTimeFormat(DELIVERY_LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: DELIVERY_TIME_ZONE,
  }).formatToParts(target);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((piece) => piece.type === type)?.value ?? "";
  return `Recíbelo el ${part("weekday")} ${part("day")} de ${part("month")}`;
}
