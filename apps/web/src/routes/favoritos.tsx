import { createFileRoute } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { ClearFavoritesDialog } from "@/features/favorites/components/clear-favorites-dialog";
import { FavoritesGrid } from "@/features/favorites/components/favorites-grid";
import { FAVORITES_COPY } from "@/features/favorites/data/favorites-copy";
import { useStoresHydrated } from "@/stores/store-provider";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: FAVORITES_COPY.title },
      { name: "description", content: FAVORITES_COPY.description },
    ],
  }),
  component: FavoritesComponent,
});

/**
 * The `/favoritos` page. The breadcrumbs and the `h1` render unconditionally, on
 * the server too; the persisted grid, the empty state and the clear-all trigger
 * live in `localStorage`, so a single loading status stands in for them until the
 * store provider rehydrates instead of the first paint claiming an empty list.
 */
function FavoritesComponent() {
  const hydrated = useStoresHydrated();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: FAVORITES_COPY.breadcrumbRoot, to: "/" },
          { label: FAVORITES_COPY.breadcrumbCurrent },
        ]}
      />

      <h1 className="text-2xl font-bold">{FAVORITES_COPY.heading}</h1>

      {hydrated ? <FavoritesContents /> : <FavoritesLoading />}
    </>
  );
}

/**
 * Stands in for the persisted grid and the clear-all trigger while the stores
 * rehydrate. It is presentational and shows no money. The single `role="status"`
 * region is named so assistive tech announces the wait.
 */
function FavoritesLoading() {
  return (
    <div role="status" aria-label={FAVORITES_COPY.loading} className="mt-4">
      <Skeleton aria-hidden="true" className="h-2 w-full" />
      <div className="mt-6 grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 min-[480px]:gap-x-4 min-[480px]:gap-y-6 min-[1200px]:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} aria-hidden="true" className="h-64 w-full" />
        ))}
      </div>
    </div>
  );
}

/** The persisted favourites sections, rendered only once the stores are hydrated. */
function FavoritesContents() {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex justify-end">
        <ClearFavoritesDialog />
      </div>
      <FavoritesGrid />
    </div>
  );
}
