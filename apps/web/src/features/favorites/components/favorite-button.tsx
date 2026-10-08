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
 * The 44×44 favourite toggle used on product cards. It lives in the favourites
 * feature because it reads and writes the favourites store; the catalog card
 * only imports it.
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
        "absolute top-0 right-0 grid size-11 place-items-center text-muted-foreground opacity-75 transition-colors hover:text-foreground hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        isFavorite && "text-discount opacity-100",
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
