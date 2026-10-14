import { Radio, RadioGroup } from "@/components/ui/radio-group";
import { SHIPPING_METHOD_PRICES, type ShippingMethod } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

import { CHECKOUT_COPY } from "../data/checkout-copy";

/** The shipping options, in the order the customer sees them. */
const SHIPPING_METHODS: readonly ShippingMethod[] = ["standard", "express", "pickup"];

export type ShippingMethodPanelProps = {
  value: ShippingMethod;
  onChange: (method: ShippingMethod) => void;
  /** Whether the cart qualifies for free standard shipping, independent of the selection. */
  freeStandardShipping: boolean;
};

/**
 * The shipping-method radiogroup.
 *
 * It formats the price it is handed and never recomputes it: the form supplies
 * the prices from `SHIPPING_METHOD_PRICES` and the qualification flag, and the
 * standard row reads as free when that flag is set.
 */
export function ShippingMethodPanel({
  value,
  onChange,
  freeStandardShipping,
}: ShippingMethodPanelProps) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="text-base font-bold">{CHECKOUT_COPY.fieldsets.shipping}</legend>
      <RadioGroup
        value={value}
        onValueChange={(next) => {
          onChange(next);
        }}
        className="mt-3 gap-2"
      >
        {SHIPPING_METHODS.map((method) => {
          const option = CHECKOUT_COPY.shipping[method];
          const isFree = method === "standard" && freeStandardShipping;
          return (
            <Radio key={method} value={method}>
              <span className="flex flex-1 items-center justify-between gap-3 text-left">
                <span className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-muted-foreground text-[13px]">{option.description}</span>
                </span>
                <span className="font-semibold">
                  {isFree
                    ? CHECKOUT_COPY.shippingFree
                    : formatMoney(SHIPPING_METHOD_PRICES[method])}
                </span>
              </span>
            </Radio>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
