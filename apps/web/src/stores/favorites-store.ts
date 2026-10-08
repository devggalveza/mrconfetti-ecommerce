import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  clearFavorites,
  removeFavorite,
  toggleFavorite,
} from "@/features/favorites/lib/favorites";

import { selectFavoriteIds } from "./selectors";

export type FavoritesStoreState = {
  ids: number[];
  toggle: (id: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

export const useFavoritesStore = create<FavoritesStoreState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((state) => ({ ids: toggleFavorite(state.ids, id) })),
      remove: (id) => set((state) => ({ ids: removeFavorite(state.ids, id) })),
      clear: () => set({ ids: clearFavorites() }),
    }),
    {
      name: "mc-favoritos",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

/** Number of favorites, re-rendering only when it changes. */
export function useFavoritesCount(): number {
  return useFavoritesStore((state) => selectFavoriteIds(state).length);
}
