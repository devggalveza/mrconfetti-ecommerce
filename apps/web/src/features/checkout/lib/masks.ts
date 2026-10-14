/**
 * Pure input formatters for the checkout form. Each one is total and idempotent:
 * feeding a formatter its own output returns that output unchanged.
 */

/** Strips every non-digit character, keeping at most `maxLength` digits. */
export function digitsOnly(value: string, maxLength?: number): string {
  const digits = value.replace(/\D/g, "");
  return maxLength === undefined ? digits : digits.slice(0, maxLength);
}

/** Formats a card number as groups of four digits, capped at 19 digits. */
export function formatCardNumber(value: string): string {
  return digitsOnly(value, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

/**
 * Formats an expiry as `MM/AA`. The separator is inserted only once the third
 * digit arrives, so the mask never ends on or doubles the slash.
 */
export function formatExpiry(value: string): string {
  const digits = digitsOnly(value, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** Formats a card security code, capped at four digits. */
export function formatCvc(value: string): string {
  return digitsOnly(value, 4);
}

/** Formats a postal code, capped at five digits. */
export function formatPostalCode(value: string): string {
  return digitsOnly(value, 5);
}
