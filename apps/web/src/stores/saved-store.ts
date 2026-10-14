import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { useCartStore } from "./cart-store";

export type SavedStoreState = {
  ids: number[];
  saveForLater: (id: number) => void;
  unsave: (id: number) => void;
  moveToCart: (id: number) => void;
  clear: () => void;
};

export const useSavedStore = create<SavedStoreState>()(
  persist(
    (set, get) => ({
      ids: [],
      saveForLater: (id) => {
        if (get().ids.includes(id)) {
          return;
        }
        // The exact inverse of `moveToCart`: saving takes the line out of the
        // cart, so a product is never in both lists and a save/move round trip
        // cannot double its units. The cart is a separate store, so both writes
        // happen in one action and subscribers only observe the end state.
        useCartStore.getState().remove(id);
        set((state) => ({ ids: [...state.ids, id] }));
      },
      unsave: (id) => set((state) => ({ ids: state.ids.filter((value) => value !== id) })),
      moveToCart: (id) => {
        useCartStore.getState().add(id);
        set((state) => ({ ids: state.ids.filter((value) => value !== id) }));
      },
      clear: () => set({ ids: [] }),
    }),
    {
      name: "mc-saved",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
