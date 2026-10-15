import { Heart } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/stores/favorites-store";

type FavoriteButtonProps = {
  productId: number;
  productName: string;
  className?: string;
};

/**
 * The shared circular favourite toggle. On cards it floats inset over the image
 * corner; the product detail passes `static size-12` so it sits in flow beside
 * the buy button. It lives in the favourites feature because it reads and writes
 * the favourites store; consumers only import it.
 */
export function FavoriteButton({ productId, productName, className }: FavoriteButtonProps) {
  const isFavorite = useFavoritesStore((state) => state.ids.includes(productId));
  const toggle = useFavoritesStore((state) => state.toggle);

  const handleClick = (): void => {
    toggle(productId);
    toast(isFavorite ? "Quitado de favoritos" : "Añadido a favoritos");
  };

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={
        isFavorite
          ? `Quitar ${productName} de favoritos`
          : `Añadir ${productName} a favoritos`
      }
      onClick={handleClick}
      className={cn(
        "absolute top-2 right-2 grid size-8 place-items-center rounded-full border border-border bg-background text-red-600 shadow-sm transition-[color,background-color,border-color,box-shadow] duration-200 ease-out hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none dark:text-red-400 dark:hover:border-red-700 dark:hover:bg-red-950 dark:hover:text-red-300",
        isFavorite && "border-red-300 bg-red-50 text-red-600 dark:border-red-700 dark:bg-red-950 dark:text-red-400",
        className,
      )}
    >
      <Heart
        aria-hidden="true"
        strokeWidth={1.75}
        className={cn("size-4", isFavorite && "fill-current")}
      />
    </button>
  );
}
