import type { CartLine } from "@/features/cart/lib/cart-lines";
import { countUnits } from "@/features/cart/lib/cart-lines";

type CartLinesState = { lines: CartLine[] };
type FavoritesState = { ids: number[] };

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
