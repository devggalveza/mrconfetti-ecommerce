import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CART_COPY } from "@/features/cart/data/cart-copy";
import { formatMoney } from "@/lib/format";
import { selectLastOrder, selectPendingConfirmation } from "@/stores/selectors";
import { useOrdersStore } from "@/stores/orders-store";

/**
 * The order-confirmation dialog. It renders only when an order exists *and* the
 * pending flag is set, and it clears the flag on close.
 *
 * Nothing writes an order until phase 8 wires checkout, so in the current app this
 * component stays inert — that is the expected seam, not a defect.
 */
export function OrderConfirmationDialog() {
  const order = useOrdersStore(selectLastOrder);
  const pendingConfirmation = useOrdersStore(selectPendingConfirmation);
  const dismissConfirmation = useOrdersStore((state) => state.dismissConfirmation);
  const open = order !== null && pendingConfirmation;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          dismissConfirmation();
        }
      }}
    >
      {order === null || !pendingConfirmation ? null : (
        <AlertDialogContent>
          <AlertDialogTitle>{CART_COPY.confirmation.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {CART_COPY.confirmation.description(order.ref)}
          </AlertDialogDescription>

          <dl className="flex items-center justify-between gap-2 text-sm">
            <dt className="text-muted-foreground">{CART_COPY.confirmation.totalLabel}</dt>
            <dd className="font-extrabold">{formatMoney(order.total)}</dd>
          </dl>

          <div className="flex justify-end">
            <AlertDialogAction>{CART_COPY.confirmation.close}</AlertDialogAction>
          </div>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
