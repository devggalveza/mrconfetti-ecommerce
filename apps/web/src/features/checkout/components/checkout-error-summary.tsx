import type { RefObject } from "react";

import { CHECKOUT_COPY, checkoutErrorMessage } from "../data/checkout-copy";
import { checkoutFieldId } from "../lib/field-ids";
import type { CheckoutFieldName } from "../lib/validation";

export type CheckoutErrorSummaryProps = {
  /** The form's errors, already ordered by `CHECKOUT_FIELD_ORDER`. */
  errors: readonly { field: CheckoutFieldName; code: string }[];
  /** The container the form focuses after a failed submit. */
  containerRef?: RefObject<HTMLDivElement | null>;
};

/**
 * The focusable summary of the form's errors.
 *
 * It renders nothing when the form is valid. Otherwise it names every error in
 * the order it was handed and links each entry to the field's own id, so
 * activating a link moves focus to the input that needs fixing.
 */
export function CheckoutErrorSummary({ errors, containerRef }: CheckoutErrorSummaryProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      role="alert"
      tabIndex={-1}
      className="bg-destructive/10 focus-visible:outline-ring rounded-lg p-4 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <h2 className="text-destructive text-sm font-bold">{CHECKOUT_COPY.errorSummary.title}</h2>
      <ul className="mt-2 flex flex-col gap-1 text-sm">
        {errors.map(({ field, code }) => (
          <li key={field}>
            <a
              href={`#${checkoutFieldId(field)}`}
              className="text-destructive underline underline-offset-4"
            >
              {CHECKOUT_COPY.fields[field].label}: {checkoutErrorMessage(code)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
