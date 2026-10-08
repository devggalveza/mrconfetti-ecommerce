import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { useCartStore } from "./cart-store";
import { useFavoritesStore } from "./favorites-store";

const StoresHydratedContext = createContext(false);

/** Reads the hydration flag; returns false when no provider is mounted. */
export function useStoresHydrated(): boolean {
  return useContext(StoresHydratedContext);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  // The app renders on the server, so reading localStorage during render would
  // desynchronise the server and client markup. Both stores skip automatic
  // hydration and rehydrate here, on the client only, after the first paint.
  useEffect(() => {
    let active = true;
    Promise.all([
      useCartStore.persist.rehydrate(),
      useFavoritesStore.persist.rehydrate(),
    ]).then(() => {
      if (active) {
        setHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <StoresHydratedContext.Provider value={hydrated}>{children}</StoresHydratedContext.Provider>
  );
}
