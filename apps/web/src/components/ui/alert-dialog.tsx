import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A minimal alert-dialog wrapper over `@base-ui/react/alert-dialog`, mirroring the
 * structure and `cn` usage of `sheet.tsx`.
 *
 * Base UI's alert-dialog root forces `modal` on and pointer dismissal off, so the
 * dialog never closes on an outside click, and its popup returns focus to the
 * trigger on close. The surface follows the design system: white background, a
 * single hairline border and no shadow.
 */

function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({ ...props }: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogTitle({ className, ...props }: AlertDialogPrimitive.Title.Props) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg leading-tight font-bold", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({ className, ...props }: AlertDialogPrimitive.Description.Props) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function AlertDialogContent({ className, children, ...props }: AlertDialogPrimitive.Popup.Props) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal">
      <AlertDialogPrimitive.Backdrop
        data-slot="alert-dialog-backdrop"
        className="bg-foreground/40 data-ending-style:opacity-0 data-starting-style:opacity-0 fixed inset-0 z-50 transition-opacity duration-200 ease-out motion-reduce:transition-none"
      />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        className={cn(
          "bg-background border-border data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 fixed top-1/2 left-1/2 z-50 flex w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border p-6 transition-all duration-200 ease-out motion-reduce:transition-none",
          className,
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Popup>
    </AlertDialogPrimitive.Portal>
  );
}

/** The default action: closes the dialog without confirming anything. */
function AlertDialogCancel({ className, ...props }: AlertDialogPrimitive.Close.Props) {
  return (
    <AlertDialogPrimitive.Close
      type="button"
      data-slot="alert-dialog-cancel"
      className={cn(buttonVariants({ variant: "outline", size: "pill" }), className)}
      {...props}
    />
  );
}

/** The destructive action, used when confirming removes data. */
function AlertDialogConfirm({ className, ...props }: AlertDialogPrimitive.Close.Props) {
  return (
    <AlertDialogPrimitive.Close
      type="button"
      data-slot="alert-dialog-confirm"
      className={cn(buttonVariants({ variant: "destructive", size: "pill" }), className)}
      {...props}
    />
  );
}

/** The neutral primary action: closes the dialog while confirming the message. */
function AlertDialogAction({ className, ...props }: AlertDialogPrimitive.Close.Props) {
  return (
    <AlertDialogPrimitive.Close
      type="button"
      data-slot="alert-dialog-action"
      className={cn(buttonVariants({ variant: "default", size: "pill" }), className)}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogConfirm,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
};
