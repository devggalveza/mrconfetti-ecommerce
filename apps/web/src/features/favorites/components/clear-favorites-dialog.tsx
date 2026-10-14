import { useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogConfirm,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { FAVORITES_COPY } from "@/features/favorites/data/favorites-copy";
import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/stores/favorites-store";

/**
 * The clear-all confirmation. It is an alert dialog over `useFavoritesStore.clear`:
 * the cancel action is the default, the confirm action is destructive, and the
 * dialog cannot be dismissed by an outside click.
 *
 * A store with no favourites renders no trigger at all, so the control can never
 * offer to empty an already-empty list.
 */
export function ClearFavoritesDialog() {
  const [open, setOpen] = useState(false);
  const hasFavorites = useFavoritesStore((state) => state.ids.length > 0);
  const clear = useFavoritesStore((state) => state.clear);

  if (!hasFavorites) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "pill" }),
          "text-destructive hover:bg-destructive/10",
        )}
      >
        {FAVORITES_COPY.clear.trigger}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogTitle>{FAVORITES_COPY.clear.title}</AlertDialogTitle>
        <AlertDialogDescription>{FAVORITES_COPY.clear.description}</AlertDialogDescription>

        <div className="flex flex-wrap justify-end gap-2">
          <AlertDialogCancel>{FAVORITES_COPY.clear.cancel}</AlertDialogCancel>
          <AlertDialogConfirm
            onClick={() => {
              clear();
            }}
          >
            {FAVORITES_COPY.clear.confirm}
          </AlertDialogConfirm>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
