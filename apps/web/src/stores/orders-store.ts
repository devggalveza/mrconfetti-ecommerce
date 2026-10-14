import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type LastOrder = {
  ref: string;
  total: number;
  items: { id: number; quantity: number }[];
  email: string;
  date: string;
};

export type OrdersStoreState = {
  lastOrder: LastOrder | null;
  pendingConfirmation: boolean;
  setLastOrder: (order: LastOrder) => void;
  dismissConfirmation: () => void;
  clear: () => void;
};

export const useOrdersStore = create<OrdersStoreState>()(
  persist(
    (set) => ({
      lastOrder: null,
      pendingConfirmation: false,
      setLastOrder: (order) => set({ lastOrder: order, pendingConfirmation: true }),
      dismissConfirmation: () => set({ pendingConfirmation: false }),
      clear: () => set({ lastOrder: null, pendingConfirmation: false }),
    }),
    {
      name: "mc-last-order",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
