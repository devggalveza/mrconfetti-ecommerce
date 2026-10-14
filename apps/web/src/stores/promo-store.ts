import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { resolveCoupon } from "@/lib/coupons";

export type PromoStoreState = {
  code: string | null;
  apply: (input: string) => boolean;
  clear: () => void;
};

export const usePromoStore = create<PromoStoreState>()(
  persist(
    (set) => ({
      code: null,
      apply: (input) => {
        const coupon = resolveCoupon(input);
        if (coupon === null) {
          return false;
        }
        set({ code: coupon.code });
        return true;
      },
      clear: () => set({ code: null }),
    }),
    {
      name: "mc-promo",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
