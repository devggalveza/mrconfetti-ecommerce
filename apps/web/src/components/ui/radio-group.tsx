import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "@/lib/utils";

function RadioGroup<Value>({ className, ...props }: RadioGroupPrimitive.Props<Value>) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function Radio<Value>({ className, children, ...props }: RadioPrimitive.Root.Props<Value>) {
  return (
    <RadioPrimitive.Root
      data-slot="radio"
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 data-checked:border-brand data-checked:bg-brand-soft hover:border-brand data-disabled:pointer-events-none data-disabled:opacity-50 bg-background border-border rounded-lg flex min-h-11 w-full cursor-pointer items-center justify-start gap-2 border px-3 text-sm transition-colors outline-none select-none focus-visible:ring-2",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-indicator"
        keepMounted
        className="border-border before:bg-white data-checked:border-brand data-checked:bg-brand before:size-2 before:rounded-full before:opacity-0 before:content-[''] data-checked:before:opacity-100 flex size-[18px] shrink-0 items-center justify-center rounded-full border transition-colors before:transition-opacity"
      />
      {children}
    </RadioPrimitive.Root>
  );
}

export { Radio, RadioGroup };
