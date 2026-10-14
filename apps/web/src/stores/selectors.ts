import type { CartLine } from "@/features/cart/lib/cart-lines";
import { countUnits } from "@/features/cart/lib/cart-lines";
import { resolveCoupon, type Coupon } from "@/lib/coupons";

import type { LastOrder } from "./orders-store";

type CartLinesState = { lines: CartLine[] };
type FavoritesState = { ids: number[] };
type SavedState = { ids: number[] };
type PromoState = { code: string | null };
type OrdersState = { lastOrder: LastOrder | null; pendingConfirmation: boolean };

/** Returns the cart lines reference without creating a new array. */
export function selectCartLines(state: CartLinesState): CartLine[] {
  return state.lines;
}

/** Returns the total number of units in the cart. */
export function selectCartUnits(state: CartLinesState): number {
  return countUnits(state.lines);
}

/** Returns the number of distinct lines in the cart. */
export function selectCartLineCount(state: CartLinesState): number {
  return state.lines.length;
}

/** Returns the favorites ids reference without creating a new array. */
export function selectFavoriteIds(state: FavoritesState): number[] {
  return state.ids;
}

/** Returns the saved-for-later ids reference without creating a new array. */
export function selectSavedIds(state: SavedState): number[] {
  return state.ids;
}

/** Resolves the stored promo code against the coupon table, or returns null. */
export function selectAppliedCoupon(state: PromoState): Coupon | null {
  return state.code === null ? null : resolveCoupon(state.code);
}

/** Returns the last order reference, or null when there is none. */
export function selectLastOrder(state: OrdersState): LastOrder | null {
  return state.lastOrder;
}

/** Reports whether the last order still awaits its confirmation dialog. */
export function selectPendingConfirmation(state: OrdersState): boolean {
  return state.pendingConfirmation;
}
