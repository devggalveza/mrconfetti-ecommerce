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
import { CART_COPY } from "@/features/cart/data/cart-copy";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

/**
 * The clear-all confirmation. It is an alert dialog over `useCartStore.clear`: the
 * cancel action is the default, the confirm action is destructive, and the dialog
 * cannot be dismissed by an outside click.
 */
export function ClearCartDialog() {
  const [open, setOpen] = useState(false);
  const clear = useCartStore((state) => state.clear);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "pill" }),
          "text-destructive hover:bg-destructive/10",
        )}
      >
        {CART_COPY.summary.clearCart}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogTitle>{CART_COPY.clearDialog.title}</AlertDialogTitle>
        <AlertDialogDescription>{CART_COPY.clearDialog.description}</AlertDialogDescription>

        <div className="flex flex-wrap justify-end gap-2">
          <AlertDialogCancel>{CART_COPY.clearDialog.cancel}</AlertDialogCancel>
          <AlertDialogConfirm
            onClick={() => {
              clear();
            }}
          >
            {CART_COPY.clearDialog.confirm}
          </AlertDialogConfirm>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
