import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { CHECKOUT_COPY, checkoutErrorMessage } from "../data/checkout-copy";
import { checkoutErrorId, checkoutFieldId } from "../lib/field-ids";
import type { CheckoutFieldName } from "../lib/validation";

export type CheckoutFieldProps = {
  name: CheckoutFieldName;
  value: string;
  /** The field's error code, or `undefined` when it is acceptable. */
  error?: string;
  inputMode?: ComponentProps<"input">["inputMode"];
  onChange: (name: CheckoutFieldName, raw: string) => void;
  onBlur: (name: CheckoutFieldName) => void;
};

/**
 * One labelled checkout input with its error wiring.
 *
 * The field owns no copy and no rule: the label, placeholder and autocomplete
 * hint come from the copy module, and the message is resolved from the error
 * code the rules module emitted. The `id`, the `aria-describedby` target and the
 * message's own `id` all come from `field-ids`, so they cannot disagree.
 *
 * It is shared by the address panel and the payment details, so the whole form
 * has one implementation of the wiring.
 */
export function CheckoutField({
  name,
  value,
  error,
  inputMode,
  onChange,
  onBlur,
}: CheckoutFieldProps) {
  const meta = CHECKOUT_COPY.fields[name];
  const inputId = checkoutFieldId(name);
  const errorId = checkoutErrorId(name);
  const hasError = error !== undefined;

  return (
    <div>
      <Label htmlFor={inputId} className="text-foreground mb-1.5 text-sm font-medium">
        {meta.label}
      </Label>
      <Input
        id={inputId}
        name={name}
        value={value}
        placeholder={meta.placeholder}
        autoComplete={meta.autoComplete}
        inputMode={inputMode}
        aria-invalid={hasError ? true : undefined}
        aria-describedby={hasError ? errorId : undefined}
        onChange={(event) => {
          onChange(name, event.target.value);
        }}
        onBlur={() => {
          onBlur(name);
        }}
        className="border-border h-11 rounded-lg px-3 text-sm"
      />
      {hasError ? (
        <p id={errorId} className="text-destructive mt-1 text-[13px]">
          {checkoutErrorMessage(error)}
        </p>
      ) : null}
    </div>
  );
}
