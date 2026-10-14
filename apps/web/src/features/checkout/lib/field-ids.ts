import type { CheckoutFieldName } from "./validation";

/**
 * The single source for the checkout form's element ids.
 *
 * The inputs, the error summary anchors and every `aria-describedby` resolve
 * their ids from here, so the three can never disagree about which element owns
 * which field.
 */

/** The id of the input that holds `name`. */
export function checkoutFieldId(name: CheckoutFieldName): string {
  return `checkout-${name}`;
}

/** The id of the error message rendered beneath `name`. */
export function checkoutErrorId(name: CheckoutFieldName): string {
  return `checkout-${name}-error`;
}
