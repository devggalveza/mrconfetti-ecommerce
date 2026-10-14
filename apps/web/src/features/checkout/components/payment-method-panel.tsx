import { Radio, RadioGroup } from "@/components/ui/radio-group";

import { CHECKOUT_COPY } from "../data/checkout-copy";
import type {
  CheckoutErrors,
  CheckoutFieldName,
  CheckoutValues,
  PaymentMethod,
} from "../lib/validation";

import { PaymentDetails } from "./payment-details";

/** The payment options, in the order the customer sees them. */
const PAYMENT_METHODS: readonly PaymentMethod[] = ["card", "bizum", "paypal"];

export type PaymentMethodPanelProps = {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  values: CheckoutValues;
  errors: CheckoutErrors;
  onFieldChange: (name: CheckoutFieldName, raw: string) => void;
  onFieldBlur: (name: CheckoutFieldName) => void;
};

/**
 * The payment-method radiogroup and the fields of the selected method. The
 * method choice is controlled by the form; the fields themselves are delegated
 * to `PaymentDetails` so every input shares the address panel's wiring.
 */
export function PaymentMethodPanel({
  value,
  onChange,
  values,
  errors,
  onFieldChange,
  onFieldBlur,
}: PaymentMethodPanelProps) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="text-base font-bold">{CHECKOUT_COPY.fieldsets.payment}</legend>
      <RadioGroup
        value={value}
        onValueChange={(next) => {
          onChange(next);
        }}
        className="mt-3 gap-2"
      >
        {PAYMENT_METHODS.map((method) => {
          const option = CHECKOUT_COPY.payment[method];
          return (
            <Radio key={method} value={method}>
              <span className="flex flex-col text-left">
                <span className="font-medium">{option.label}</span>
                <span className="text-muted-foreground text-[13px]">{option.description}</span>
              </span>
            </Radio>
          );
        })}
      </RadioGroup>
      <PaymentDetails
        method={value}
        values={values}
        errors={errors}
        onChange={onFieldChange}
        onBlur={onFieldBlur}
      />
    </fieldset>
  );
}
