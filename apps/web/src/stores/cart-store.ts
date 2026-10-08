import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  addLine,
  clearLines,
  removeLine,
  setLineQuantity,
  type CartLine,
} from "@/features/cart/lib/cart-lines";

import { selectCartLineCount, selectCartUnits } from "./selectors";

export type CartStoreState = {
  lines: CartLine[];
  add: (id: number, quantity?: number) => void;
  setQuantity: (id: number, quantity: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartStoreState>()(
  persist(
    (set) => ({
      lines: [],
      add: (id, quantity) => set((state) => ({ lines: addLine(state.lines, id, quantity) })),
      setQuantity: (id, quantity) =>
        set((state) => ({ lines: setLineQuantity(state.lines, id, quantity) })),
      remove: (id) => set((state) => ({ lines: removeLine(state.lines, id) })),
      clear: () => set({ lines: clearLines() }),
    }),
    {
      name: "mc-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

/** Number of product units in the cart, re-rendering only when it changes. */
export function useCartUnits(): number {
  return useCartStore(selectCartUnits);
}

/** Number of distinct cart lines, re-rendering only when it changes. */
export function useCartLineCount(): number {
  return useCartStore(selectCartLineCount);
}
