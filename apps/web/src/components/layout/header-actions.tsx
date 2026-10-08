import { Heart, ShoppingCart, User } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCartUnits } from "@/stores/cart-store";
import { useFavoritesCount } from "@/stores/favorites-store";

const chipClass =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** The header's account, favourites and cart chips. */
export function HeaderActions() {
  const favoritesCount = useFavoritesCount();
  const cartUnits = useCartUnits();

  return (
    <div className="flex items-center gap-2">
      <Link to="/login" aria-label="Iniciar sesión" className={chipClass}>
        <User className="size-5" aria-hidden="true" />
        <span className="hidden md:inline">Iniciar sesión</span>
      </Link>
      <Link to="/favoritos" aria-label="Favoritos" className={chipClass}>
        <Heart className="size-5" aria-hidden="true" />
        <Badge variant="count">{favoritesCount}</Badge>
      </Link>
      <Link
        to="/cart"
        aria-label="Carrito"
        className={cn(chipClass, "bg-brand text-white hover:bg-brand-dark")}
      >
        <ShoppingCart className="size-5" aria-hidden="true" />
        <span className="hidden md:inline">Carrito</span>
        <Badge variant="count">{cartUnits}</Badge>
      </Link>
    </div>
  );
}
