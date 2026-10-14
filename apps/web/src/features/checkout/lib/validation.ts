/** The payment options the checkout offers. */
export type PaymentMethod = "card" | "bizum" | "paypal";

/** Every field the checkout form can validate. */
export type CheckoutFieldName =
  | "email"
  | "firstName"
  | "lastName"
  | "phone"
  | "address"
  | "city"
  | "postalCode"
  | "cardNumber"
  | "cardName"
  | "cardExpiry"
  | "cardCvc"
  | "bizumPhone"
  | "paypalEmail";

export type CheckoutValues = Record<CheckoutFieldName, string>;
export type CheckoutErrors = Partial<Record<CheckoutFieldName, string>>;

/**
 * The order the error summary walks, so the first invalid field is
 * deterministic and matches the visual field order.
 */
export const CHECKOUT_FIELD_ORDER: readonly CheckoutFieldName[] = [
  "email",
  "firstName",
  "lastName",
  "phone",
  "address",
  "city",
  "postalCode",
  "cardNumber",
  "cardName",
  "cardExpiry",
  "cardCvc",
  "bizumPhone",
  "paypalEmail",
];

/** Fields every checkout requires, whichever payment method is selected. */
const CONTACT_AND_ADDRESS_FIELDS: readonly CheckoutFieldName[] = [
  "email",
  "firstName",
  "lastName",
  "phone",
  "address",
  "city",
  "postalCode",
];

/** Payment-specific fields, each required only for its own method. */
const METHOD_FIELDS: Readonly<Record<PaymentMethod, readonly CheckoutFieldName[]>> = {
  card: ["cardNumber", "cardName", "cardExpiry", "cardCvc"],
  bizum: ["bizumPhone"],
  paypal: ["paypalEmail"],
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function orderFields(fields: Iterable<CheckoutFieldName>): CheckoutFieldName[] {
  const present = new Set(fields);
  return CHECKOUT_FIELD_ORDER.filter((name) => present.has(name));
}

/** The fields required for a method, in {@link CHECKOUT_FIELD_ORDER} order. */
export function requiredFieldsFor(method: PaymentMethod): readonly CheckoutFieldName[] {
  return orderFields([...CONTACT_AND_ADDRESS_FIELDS, ...METHOD_FIELDS[method]]);
}

/** Standard Luhn checksum over a digit-only string. */
function passesLuhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let value = digits.charCodeAt(index) - 48;
    if (double) {
      value *= 2;
      if (value > 9) {
        value -= 9;
      }
    }
    sum += value;
    double = !double;
  }
  return sum % 10 === 0;
}

/**
 * Validates one field and returns an error code, or `null` when acceptable.
 * The copy module owns the human wording, so no message is produced here.
 */
export function validateField(
  name: CheckoutFieldName,
  value: string,
  now: Date,
): string | null {
  if (value.trim().length === 0) {
    return "required";
  }

  switch (name) {
    case "email":
    case "paypalEmail":
      return EMAIL_PATTERN.test(value.trim()) ? null : "email";

    case "phone":
    case "bizumPhone": {
      const digits = value.replace(/[\s-]/g, "");
      return /^\d{8}$/.test(digits) ? null : "phone";
    }

    case "postalCode":
      return /^\d{5}$/.test(value.trim()) ? null : "postalCode";

    case "cardNumber": {
      const digits = value.replace(/\s/g, "");
      if (!/^\d{13,19}$/.test(digits)) {
        return "cardNumber";
      }
      return passesLuhn(digits) ? null : "cardNumberChecksum";
    }

    case "cardExpiry": {
      const match = /^(\d{2})\/(\d{2})$/.exec(value.trim());
      if (match === null) {
        return "cardExpiry";
      }
      const month = Number(match[1]);
      if (month < 1 || month > 12) {
        return "cardExpiry";
      }
      // A card is valid through the last day of its expiry month, so the
      // current month still passes.
      const year = 2000 + Number(match[2]);
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return "cardExpired";
      }
      return null;
    }

    case "cardCvc":
      return /^\d{3,4}$/.test(value.trim()) ? null : "cardCvc";

    default:
      // Name-shaped fields only have the required rule.
      return null;
  }
}

/** Validates only the fields the method requires, keyed by field name. */
export function validateCheckout(
  values: CheckoutValues,
  method: PaymentMethod,
  now: Date,
): CheckoutErrors {
  const errors: CheckoutErrors = {};
  for (const name of requiredFieldsFor(method)) {
    const error = validateField(name, values[name], now);
    if (error !== null) {
      errors[name] = error;
    }
  }
  return errors;
}

/** The first errored field in {@link CHECKOUT_FIELD_ORDER}, or `null`. */
export function firstErrorField(errors: CheckoutErrors): CheckoutFieldName | null {
  for (const name of CHECKOUT_FIELD_ORDER) {
    if (errors[name] !== undefined) {
      return name;
    }
  }
  return null;
}
