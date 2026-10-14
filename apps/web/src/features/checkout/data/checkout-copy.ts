import type { ShippingMethod } from "@/lib/constants";

import type { CheckoutFieldName, PaymentMethod } from "../lib/validation";

/** Every error code the phase 8a rules can emit. */
export type CheckoutErrorCode =
  | "required"
  | "email"
  | "phone"
  | "postalCode"
  | "cardNumber"
  | "cardNumberChecksum"
  | "cardExpiry"
  | "cardExpired"
  | "cardCvc";

/** The label, placeholder and autocomplete hint of one checkout field. */
export type CheckoutFieldHint = {
  label: string;
  placeholder: string;
  autoComplete: string;
};

/** The label and short description of one shipping or payment option. */
export type CheckoutMethodOption = {
  label: string;
  description: string;
};

/**
 * Spanish copy for the checkout page, kept out of the components so every
 * heading, label, hint, price wording and error message has a single editable
 * home.
 *
 * It follows the phase 6/7 copy convention: one frozen typed object built with
 * `as const`. The error map is typed against {@link CheckoutErrorCode} so a new
 * code from the rules module cannot ship without its Spanish wording.
 */
export const CHECKOUT_COPY = Object.freeze({
  /** Document title set by the route. */
  title: "Pago | Mr. Confetti",
  /** Document description set by the route. */
  description:
    "Completa tus datos de contacto, envío y pago para confirmar tu pedido en Mr. Confetti.",
  /** Heading of the checkout form. */
  heading: "Finalizar compra",
  /** Supporting line under the heading. */
  formDescription: "Completa tus datos y elige cómo quieres recibir tu pedido.",

  fieldsets: {
    contactAndAddress: "Contacto y envío",
    shipping: "Método de envío",
    payment: "Método de pago",
  },

  fields: {
    email: {
      label: "Correo electrónico",
      placeholder: "tu@correo.com",
      autoComplete: "email",
    },
    firstName: { label: "Nombre", placeholder: "Ana", autoComplete: "given-name" },
    lastName: { label: "Apellidos", placeholder: "López", autoComplete: "family-name" },
    phone: { label: "Teléfono", placeholder: "12345678", autoComplete: "tel" },
    address: {
      label: "Dirección",
      placeholder: "Calle, número y zona",
      autoComplete: "street-address",
    },
    city: { label: "Ciudad", placeholder: "Guatemala", autoComplete: "address-level2" },
    postalCode: { label: "Código postal", placeholder: "01001", autoComplete: "postal-code" },
    cardNumber: {
      label: "Número de tarjeta",
      placeholder: "4111 1111 1111 1111",
      autoComplete: "cc-number",
    },
    cardName: {
      label: "Titular de la tarjeta",
      placeholder: "Como aparece en la tarjeta",
      autoComplete: "cc-name",
    },
    cardExpiry: { label: "Fecha de caducidad", placeholder: "MM/AA", autoComplete: "cc-exp" },
    cardCvc: { label: "CVC", placeholder: "123", autoComplete: "cc-csc" },
    bizumPhone: { label: "Teléfono de Bizum", placeholder: "12345678", autoComplete: "tel" },
    paypalEmail: {
      label: "Correo de PayPal",
      placeholder: "tu@correo.com",
      autoComplete: "email",
    },
  } satisfies Record<CheckoutFieldName, CheckoutFieldHint>,

  shipping: {
    standard: {
      label: "Envío estándar",
      description: "Entrega en 3 a 5 días hábiles.",
    },
    express: {
      label: "Envío exprés",
      description: "Entrega en 24 a 48 horas.",
    },
    pickup: {
      label: "Recogida en tienda",
      description: "Recoge tu pedido en nuestra tienda.",
    },
  } satisfies Record<ShippingMethod, CheckoutMethodOption>,
  /** Shown instead of a price when the standard method is waived. */
  shippingFree: "Gratis",

  payment: {
    card: {
      label: "Tarjeta",
      description: "Paga con tarjeta de crédito o débito.",
    },
    bizum: {
      label: "Bizum",
      description: "Paga desde tu teléfono con Bizum.",
    },
    paypal: {
      label: "PayPal",
      description: "Paga con tu cuenta de PayPal.",
    },
  } satisfies Record<PaymentMethod, CheckoutMethodOption>,

  errorSummary: {
    title: "Revisa los datos del formulario",
  },

  /** Heading of the amount block beside the form. */
  summaryHeading: "Resumen del pedido",
  /** Label of the enabled submit button. */
  submit: "Confirmar pedido",
  /** Label of the submit button while the order is being processed. */
  processing: "Procesando…",

  success: {
    heading: "¡Gracias por tu compra!",
    reference: (reference: string) => `Tu pedido ${reference} quedó confirmado.`,
    totalLabel: "Total pagado",
    emailLabel: "Te enviamos la confirmación a",
    backToCatalog: "Seguir comprando",
  },

  errors: {
    required: "Este campo es obligatorio.",
    email: "Escribe un correo electrónico válido.",
    phone: "Escribe un teléfono de 8 dígitos.",
    postalCode: "Escribe un código postal de 5 dígitos.",
    cardNumber: "Escribe un número de tarjeta válido.",
    cardNumberChecksum: "El número de tarjeta no es válido.",
    cardExpiry: "Usa el formato MM/AA.",
    cardExpired: "La tarjeta está caducada.",
    cardCvc: "Escribe un CVC de 3 o 4 dígitos.",
  } satisfies Record<CheckoutErrorCode, string>,
} as const);

/** The error map as a lookup that tolerates an unexpected code. */
const ERROR_MESSAGES: Readonly<Record<string, string | undefined>> = CHECKOUT_COPY.errors;

/**
 * Resolves an error code to its Spanish message. A code the copy module does
 * not know falls back to the generic required message, so a component never
 * renders an empty error line.
 */
export function checkoutErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? CHECKOUT_COPY.errors.required;
}
