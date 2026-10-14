import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_SHIPPING_METHOD, type ShippingMethod } from "@/lib/constants";

import {
  digitsOnly,
  formatCardNumber,
  formatCvc,
  formatExpiry,
  formatPostalCode,
} from "../lib/masks";
import {
  CHECKOUT_FIELD_ORDER,
  requiredFieldsFor,
  validateCheckout,
  validateField,
  type CheckoutErrors,
  type CheckoutFieldName,
  type CheckoutValues,
  type PaymentMethod,
} from "../lib/validation";

/** How long the stand-in for the missing API latency holds the processing state. */
export const CHECKOUT_PROCESSING_MS = 600;

/** The form values plus the two choices the order needs. */
export type CheckoutSnapshot = {
  values: CheckoutValues;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
};

/** The controlled state and actions the checkout form reads. */
export type CheckoutFormState = {
  values: CheckoutValues;
  errors: CheckoutErrors;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  submitting: boolean;
  /** The errors in {@link CHECKOUT_FIELD_ORDER}, for a deterministic summary. */
  errorList: readonly { field: CheckoutFieldName; code: string }[];
  setField(name: CheckoutFieldName, raw: string): void;
  blurField(name: CheckoutFieldName): void;
  setShippingMethod(method: ShippingMethod): void;
  setPaymentMethod(method: PaymentMethod): void;
  submit(): boolean;
};

/** The payment method selected before the customer makes a choice. */
const INITIAL_PAYMENT_METHOD: PaymentMethod = "card";

/**
 * Applies a field's mask before its value is stored. Card, expiry, CVC and
 * postal code each have their own formatter; the two phone fields keep at most
 * eight digits; every other field stores the raw value unchanged.
 */
function maskField(name: CheckoutFieldName, raw: string): string {
  switch (name) {
    case "cardNumber":
      return formatCardNumber(raw);
    case "cardExpiry":
      return formatExpiry(raw);
    case "cardCvc":
      return formatCvc(raw);
    case "postalCode":
      return formatPostalCode(raw);
    case "phone":
    case "bizumPhone":
      return digitsOnly(raw, 8);
    default:
      return raw;
  }
}

/** Every field blank, in the declared field order. */
function emptyValues(): CheckoutValues {
  return Object.fromEntries(CHECKOUT_FIELD_ORDER.map((name) => [name, ""])) as CheckoutValues;
}

/** Removes `name` from `errors`, returning the same object when it is absent. */
function withoutError(errors: CheckoutErrors, name: CheckoutFieldName): CheckoutErrors {
  if (errors[name] === undefined) {
    return errors;
  }
  const next = { ...errors };
  delete next[name];
  return next;
}

/**
 * The checkout form's controlled state.
 *
 * It holds state, applies masks and calls the tested phase 8a rules; it never
 * owns a validation rule of its own and never reads the clock directly, so both
 * the rules and the current instant are injected.
 */
export function useCheckoutForm(options: {
  now: () => Date;
  onSubmit: (snapshot: CheckoutSnapshot) => void;
}): CheckoutFormState {
  const { now, onSubmit } = options;
  const [values, setValues] = useState<CheckoutValues>(emptyValues);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>(DEFAULT_SHIPPING_METHOD);
  const [paymentMethod, setPaymentMethodState] = useState<PaymentMethod>(INITIAL_PAYMENT_METHOD);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const setField = useCallback((name: CheckoutFieldName, raw: string): void => {
    const masked = maskField(name, raw);
    setValues((previous) => ({ ...previous, [name]: masked }));
    setErrors((previous) => withoutError(previous, name));
  }, []);

  const blurField = useCallback(
    (name: CheckoutFieldName): void => {
      const code = validateField(name, values[name], now());
      setErrors((previous) =>
        code === null ? withoutError(previous, name) : { ...previous, [name]: code },
      );
    },
    [now, values],
  );

  const setPaymentMethod = useCallback((method: PaymentMethod): void => {
    setPaymentMethodState(method);
    const kept = new Set(requiredFieldsFor(method));
    setErrors((previous) => {
      const next: CheckoutErrors = {};
      for (const name of Object.keys(previous) as CheckoutFieldName[]) {
        if (kept.has(name)) {
          next[name] = previous[name];
        }
      }
      return next;
    });
  }, []);

  const submit = useCallback((): boolean => {
    const nextErrors = validateCheckout(values, paymentMethod, now());
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return false;
    }

    setErrors({});
    setSubmitting(true);
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    const snapshot: CheckoutSnapshot = { values, shippingMethod, paymentMethod };
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onSubmit(snapshot);
      setSubmitting(false);
    }, CHECKOUT_PROCESSING_MS);
    return true;
  }, [now, onSubmit, paymentMethod, shippingMethod, values]);

  const errorList = useMemo(
    () =>
      CHECKOUT_FIELD_ORDER.flatMap((field) => {
        const code = errors[field];
        return code === undefined ? [] : [{ field, code }];
      }),
    [errors],
  );

  return {
    values,
    errors,
    shippingMethod,
    paymentMethod,
    submitting,
    errorList,
    setField,
    blurField,
    setShippingMethod,
    setPaymentMethod,
    submit,
  };
}
