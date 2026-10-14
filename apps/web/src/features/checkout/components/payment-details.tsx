import type {
  CheckoutErrors,
  CheckoutFieldName,
  CheckoutValues,
  PaymentMethod,
} from "../lib/validation";

import { CheckoutField } from "./checkout-field";

/** The card fields, in the order the customer fills them. */
const CARD_FIELDS: readonly CheckoutFieldName[] = [
  "cardNumber",
  "cardName",
  "cardExpiry",
  "cardCvc",
];

/** The fields that suit a numeric keypad. */
const NUMERIC_FIELDS: ReadonlySet<CheckoutFieldName> = new Set<CheckoutFieldName>([
  "cardNumber",
  "cardExpiry",
  "cardCvc",
  "bizumPhone",
]);

export type PaymentDetailsProps = {
  method: PaymentMethod;
  values: CheckoutValues;
  errors: CheckoutErrors;
  onChange: (name: CheckoutFieldName, raw: string) => void;
  onBlur: (name: CheckoutFieldName) => void;
};

/** The fields of the selected payment method, with the address panel's wiring. */
export function PaymentDetails({
  method,
  values,
  errors,
  onChange,
  onBlur,
}: PaymentDetailsProps) {
  const fields: readonly CheckoutFieldName[] =
    method === "card"
      ? CARD_FIELDS
      : method === "bizum"
        ? ["bizumPhone"]
        : ["paypalEmail"];

  return (
    <div className="mt-3 grid gap-4 sm:grid-cols-2">
      {fields.map((name) => (
        <CheckoutField
          key={name}
          name={name}
          value={values[name]}
          error={errors[name]}
          inputMode={NUMERIC_FIELDS.has(name) ? "numeric" : undefined}
          onChange={onChange}
          onBlur={onBlur}
        />
      ))}
    </div>
  );
}
