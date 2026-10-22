import { Link } from "@tanstack/react-router";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PRODUCT_STOCK_COPY } from "@/features/catalog/data/product-detail-content";
import { quantityLimit } from "@/features/catalog/lib/product-detail";
import type { Product } from "@/features/catalog/schemas/product";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

import { ProductPrice } from "./product-price";
import { QuantityStepper } from "./quantity-stepper";

type AddToCartDialogProps = {
  product: Product;
  /**
   * Called whenever the dialog has to go away — the close control, `Escape`, a
   * backdrop click or `Continuar comprando`. The caller unmounts it.
   */
  onClose: () => void;
};

/**
 * Visible labels of the dialog. The three exits are listed in their priority
 * order, which is also the order they render in: keep shopping first, then the
 * payment step, then the cart.
 */
const ADD_TO_CART_DIALOG_COPY = {
  title: "Añadido al carrito",
  description: "Ajusta la cantidad o elige cómo seguir.",
  quantityLabel: "Cantidad",
  totalLabel: "Total",
  keepShopping: "Continuar comprando",
  checkout: "Continuar con el pago",
  cart: "Ver mi carrito",
} as const;

/**
 * The confirmation modal behind a product card's cart control.
 *
 * The card writes the unit before opening this dialog, so there is nothing left to
 * confirm: the shopper lands on a dialog that already states the product is in the
 * cart and offers the three ways out. The stepper is therefore not an "add more"
 * control but the cart line's own quantity editor — it reads the line and every
 * step writes it through `setQuantity`, so the dialog and the cart can never
 * disagree.
 *
 * Editing keeps the same guard the add has: the ceiling is `quantityLimit`, and a
 * sold-out product shows no quantity editor and no total because no line exists.
 */
export function AddToCartDialog({ product, onClose }: AddToCartDialogProps) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const line = useCartStore((state) => state.lines.find((entry) => entry.id === product.id));

  const quantity = line?.quantity ?? 0;
  const limit = quantityLimit(product);
  const isBuyable = limit > 0;

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader className="pr-16">
          <DialogTitle>{ADD_TO_CART_DIALOG_COPY.title}</DialogTitle>
          <DialogDescription>{ADD_TO_CART_DIALOG_COPY.description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <img
            src={product.image}
            alt=""
            width={product.width}
            height={product.height}
            className="border-border bg-surface size-16 shrink-0 rounded-lg border object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold">{product.name}</p>
            <div className="mt-1">
              <ProductPrice product={product} size="compact" />
            </div>
          </div>
        </div>

        {isBuyable && quantity > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium">{ADD_TO_CART_DIALOG_COPY.quantityLabel}</span>
            <QuantityStepper
              product={product}
              value={quantity}
              onChange={(next) => {
                setQuantity(product.id, next);
              }}
            />
          </div>
        ) : (
          <p className="text-destructive text-sm font-semibold">{PRODUCT_STOCK_COPY.outOfStock}</p>
        )}

        {quantity > 0 ? (
          <div className="border-border flex items-baseline justify-between gap-3 border-t pt-4">
            <span className="text-sm font-medium">{ADD_TO_CART_DIALOG_COPY.totalLabel}</span>
            <span className="text-lg font-extrabold">
              {formatMoney(product.price * quantity)}
            </span>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <Button type="button" size="pill" onClick={onClose} className="w-full">
            {ADD_TO_CART_DIALOG_COPY.keepShopping}
          </Button>
          <Link
            to="/checkout"
            className={cn(buttonVariants({ variant: "outline", size: "pill" }), "w-full")}
          >
            {ADD_TO_CART_DIALOG_COPY.checkout}
          </Link>
          <Link
            to="/cart"
            className={cn(buttonVariants({ variant: "ghost", size: "pill" }), "w-full")}
          >
            {ADD_TO_CART_DIALOG_COPY.cart}
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
