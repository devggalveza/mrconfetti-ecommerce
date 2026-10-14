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
    (set) => ({
      ids: [],
      saveForLater: (id) =>
        set((state) => (state.ids.includes(id) ? {} : { ids: [...state.ids, id] })),
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
