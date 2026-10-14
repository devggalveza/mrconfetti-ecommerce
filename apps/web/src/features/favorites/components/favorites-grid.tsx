import { useCallback, useEffect, useMemo, useRef, useState, type TransitionEvent } from "react";

import { ProductCard } from "@/features/catalog/components/product-card";
import { products } from "@/features/catalog/data/products";
import type { Product } from "@/features/catalog/schemas/product";
import { FAVORITES_COPY } from "@/features/favorites/data/favorites-copy";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/stores/favorites-store";
import { selectFavoriteIds } from "@/stores/selectors";

import { FavoritesEmpty } from "./favorites-empty";

/**
 * How long an exiting card may stay mounted if its `transitionend` never fires.
 * The bound is not optional: without it a card whose transition is dropped by the
 * browser would stay on screen forever. It is deliberately longer than the 200ms
 * fade it backstops so the transition is what normally settles a card.
 */
export const EXIT_FALLBACK_MS = 300;

/** One row of the responsive favourites grid; mirrors the catalog `ProductGrid`. */
const GRID_CLASS =
  "grid list-none grid-cols-2 gap-3 outline-none min-[480px]:grid-cols-3 min-[480px]:gap-x-4 min-[480px]:gap-y-6 min-[1200px]:grid-cols-4";

/** Applied to a card while it fades out; mirrors `EXIT_FALLBACK_MS`'s 200ms fade. */
const EXIT_CLASS = "opacity-0 transition-opacity duration-200 ease-out motion-reduce:transition-none";

/**
 * The favourites grid. It renders one `ProductCard` per store id and owns the
 * exit animation every removal path shares: `remove`, `clear` and the card's own
 * heart toggle all reach the store, and this component watches the store's id
 * list rather than any one control.
 *
 * A card that leaves the store stays mounted as *exiting* — `aria-hidden`, fading
 * to zero opacity — until its `transitionend` arrives, or, if that event is
 * dropped, until the bounded fallback timer settles it. A reduced-motion user
 * never enters the exiting state at all: the id simply disappears, so no timer is
 * scheduled. Focus that sat inside a card being removed moves to the list, never
 * to the document body.
 *
 * The empty state lives here rather than at the route because the grid, not the
 * route, knows whether an exit is still in flight: rendering it as soon as the
 * store empties would unmount the fading cards and swallow the clear animation.
 */
export function FavoritesGrid() {
  const ids = useFavoritesStore(selectFavoriteIds);
  const prefersReducedMotion = usePrefersReducedMotion();
  const gridRef = useRef<HTMLUListElement>(null);

  const [knownIds, setKnownIds] = useState<readonly number[]>(ids);
  const [exitingIds, setExitingIds] = useState<ReadonlySet<number>>(() => new Set());
  const rescueFocusRef = useRef(false);

  // Detect removals during render, so the id is marked exiting in the same commit
  // that drops it from the store. Doing this in an effect instead would unmount
  // the card first, taking its DOM node and any focus inside it with it. React
  // re-runs the component before committing when it sees this render-phase update
  // and `knownIds` is compared by reference, which keeps it idempotent.
  if (knownIds !== ids) {
    const present = new Set(ids);
    const removed = knownIds.filter((id) => !present.has(id));
    setKnownIds(ids);
    if (removed.length > 0) {
      // Capture the focused card here, before React commits and reorders the list;
      // moving a focused DOM node is what blurs it to `document.body`.
      const active = document.activeElement;
      const activeItem =
        active instanceof HTMLElement
          ? active.closest<HTMLElement>("[data-favorite-id]")
          : null;
      const activeId = activeItem === null ? null : Number(activeItem.dataset.favoriteId);
      if (activeId !== null && removed.includes(activeId)) {
        rescueFocusRef.current = true;
      }

      if (!prefersReducedMotion) {
        setExitingIds((current) => {
          let changed = false;
          const next = new Set(current);
          for (const id of removed) {
            if (!next.has(id)) {
              next.add(id);
              changed = true;
            }
          }
          return changed ? next : current;
        });
      }
    }
  }

  const settleExit = useCallback((id: number): void => {
    setExitingIds((current) => {
      if (!current.has(id)) {
        return current;
      }
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  // The focus rescue runs whenever the id list changes, so it also covers the
  // reduced-motion path, where nothing ever enters the exiting state.
  useEffect(() => {
    if (!rescueFocusRef.current) {
      return;
    }
    rescueFocusRef.current = false;
    gridRef.current?.focus();
  }, [ids]);

  // One bounded fallback per exiting card. It is scheduled only for cards that
  // are actually exiting, so reduced motion never arms a timer.
  useEffect(() => {
    if (exitingIds.size === 0) {
      return;
    }

    const timers = Array.from(exitingIds, (id) =>
      window.setTimeout(() => settleExit(id), EXIT_FALLBACK_MS),
    );
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [exitingIds, settleExit]);

  const handleTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLLIElement>): void => {
      // The card's own controls run colour transitions that bubble here; only the
      // list item's own fade should settle it.
      if (event.target !== event.currentTarget) {
        return;
      }
      const id = Number(event.currentTarget.dataset.favoriteId);
      if (!Number.isNaN(id)) {
        settleExit(id);
      }
    },
    [settleExit],
  );

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), []);
  const present = new Set(ids);
  const active = ids.map((id) => productById.get(id)).filter(isProduct);
  // A card that came back to the store before its exit finished renders as active,
  // so an id is never shown both ways; otherwise it is rendered once, exiting.
  const leaving = Array.from(exitingIds)
    .filter((id) => !present.has(id))
    .map((id) => productById.get(id))
    .filter(isProduct);

  if (active.length === 0 && leaving.length === 0) {
    return <FavoritesEmpty />;
  }

  return (
    <ul
      ref={gridRef}
      tabIndex={-1}
      aria-label={FAVORITES_COPY.gridLabel}
      className={cn(
        GRID_CLASS,
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      )}
    >
      {active.map((product) => (
        <li key={product.id} data-favorite-id={product.id} className="min-w-0">
          <ProductCard product={product} />
        </li>
      ))}

      {leaving.map((product) => (
        <li
          key={product.id}
          data-favorite-id={product.id}
          aria-hidden="true"
          className={cn("min-w-0", EXIT_CLASS)}
          onTransitionEnd={handleTransitionEnd}
        >
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

/** Narrows away ids that are no longer part of the known catalogue. */
function isProduct(product: Product | undefined): product is Product {
  return product !== undefined;
}
