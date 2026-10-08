import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SheetSide = "right" | "left" | "bottom";

const SIDE_CLASSES: Record<SheetSide, string> = {
  right:
    "border-border data-ending-style:translate-x-full data-starting-style:translate-x-full inset-y-0 right-0 h-full w-80 max-w-full border-l",
  left: "border-border data-ending-style:-translate-x-full data-starting-style:-translate-x-full inset-y-0 left-0 h-full w-80 max-w-full border-r",
  bottom:
    "border-border data-ending-style:translate-y-full data-starting-style:translate-y-full inset-x-0 bottom-0 w-full border-t",
};

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-base font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: DialogPrimitive.Popup.Props & { side?: SheetSide }) {
  return (
    <DialogPrimitive.Portal data-slot="sheet-portal">
      <DialogPrimitive.Backdrop
        data-slot="sheet-backdrop"
        className="bg-foreground/40 data-ending-style:opacity-0 data-starting-style:opacity-0 fixed inset-0 z-50 transition-opacity duration-300 ease-out motion-reduce:transition-none"
      />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "bg-background fixed z-50 flex flex-col gap-4 overflow-y-auto p-4 transition-transform duration-300 ease-out motion-reduce:transition-none",
          SIDE_CLASSES[side],
          className,
        )}
        {...props}
      >
        {children}
        <SheetClose
          type="button"
          aria-label="Cerrar"
          className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 rounded-lg absolute top-2 right-2 flex size-11 items-center justify-center transition-colors outline-none focus-visible:ring-2 [&_svg]:size-5 [&_svg]:shrink-0"
        >
          <XIcon aria-hidden />
        </SheetClose>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger };
