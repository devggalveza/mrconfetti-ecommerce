import type { ComponentProps } from "react";

import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full text-xs font-medium [&>svg]:pointer-events-none [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        count:
          "bg-highlight text-highlight-foreground text-xs font-bold rounded-full min-w-[22px] h-[22px] px-1.5 inline-grid place-items-center",
        discount: "bg-discount text-white h-[22px] px-1.5 font-bold",
        success: "bg-success text-success-foreground h-[22px] px-2 font-semibold",
        outline: "border border-border bg-background text-foreground h-[22px] px-2 font-medium",
      },
    },
    defaultVariants: {
      variant: "count",
    },
  },
);

function Badge({
  className,
  variant = "count",
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
