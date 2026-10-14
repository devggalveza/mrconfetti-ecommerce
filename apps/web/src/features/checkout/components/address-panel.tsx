import { CHECKOUT_COPY } from "../data/checkout-copy";
import type { CheckoutErrors, CheckoutFieldName, CheckoutValues } from "../lib/validation";

import { CheckoutField } from "./checkout-field";

/** The fields the address panel renders, in the order the customer fills them. */
const CONTACT_AND_ADDRESS_FIELDS: readonly CheckoutFieldName[] = [
  "email",
  "firstName",
  "lastName",
  "phone",
  "address",
  "city",
  "postalCode",
];

export type AddressPanelProps = {
  values: CheckoutValues;
  errors: CheckoutErrors;
  onChange: (name: CheckoutFieldName, raw: string) => void;
  onBlur: (name: CheckoutFieldName) => void;
};

/** The contact and shipping-address inputs of the checkout form. */
export function AddressPanel({ values, errors, onChange, onBlur }: AddressPanelProps) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="text-base font-bold">{CHECKOUT_COPY.fieldsets.contactAndAddress}</legend>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {CONTACT_AND_ADDRESS_FIELDS.map((name) => (
          <CheckoutField
            key={name}
            name={name}
            value={values[name]}
            error={errors[name]}
            onChange={onChange}
            onBlur={onBlur}
          />
        ))}
      </div>
    </fieldset>
  );
}
