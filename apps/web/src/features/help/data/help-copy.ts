import type { TrackingStepId } from "../lib/tracking";
import type { HelpTopic } from "../schemas/help-search";

/** One render block of a static help section. */
export type HelpBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: readonly string[] };

/** The help topics that render as authored static sections. */
export type StaticHelpTopic = Exclude<HelpTopic, "ayuda" | "pedido">;

/**
 * Spanish copy for the help page, kept out of the components so every heading,
 * label, hint, FAQ answer and status message has a single editable home.
 *
 * The design source for this page no longer exists: the copy is authored from
 * the plan's section list, not transcribed. It follows the phase 6/7 copy
 * convention — one frozen typed object built with `as const`, with the strings
 * that depend on an order value exported as small builders. `stepById` is typed
 * against {@link TrackingStepId} and the sections against
 * {@link StaticHelpTopic}, so a new step or section cannot ship without copy.
 *
 * Honesty rules: the contact section publishes only `hola@mrconfetti.example`
 * (RFC 2606 reserves `.example`) and weekday hours, because the demo store has
 * no real channel; privacy and terms state there that they are demo content
 * with no legal value.
 */
export const HELP_COPY = Object.freeze({
  /** Document title set by the route. */
  title: "Ayuda | Mr. Confetti",
  /** Document description set by the route. */
  description:
    "Resuelve tus dudas sobre pedidos, envíos, devoluciones y pagos en el centro de ayuda de Mr. Confetti.",
  /** The page's single `h1`. */
  heading: "Centro de ayuda",
  /** Supporting paragraph under the heading. */
  intro:
    "Encuentra respuestas rápidas sobre envíos, pagos, devoluciones y el seguimiento de tu pedido.",
  /** Accessible name of the table-of-contents navigation. */
  tocLabel: "Secciones de ayuda",
  /** Accessible name of the tracking skeleton with `role="status"`. */
  loading: "Cargando el seguimiento de tu pedido",

  topics: {
    ayuda: "Centro de ayuda",
    pedido: "Seguir pedido",
    devoluciones: "Devoluciones",
    contacto: "Contacto",
    nosotros: "Sobre nosotros",
    privacidad: "Privacidad",
    terminos: "Términos",
  } satisfies Record<HelpTopic, string>,

  faq: {
    heading: "Preguntas frecuentes",
    intro: "Las dudas que más nos llegan, respondidas en una línea.",
    items: [
      {
        question: "¿Cuánto tarda mi pedido en llegar?",
        answer:
          "El envío estándar tarda de 3 a 5 días hábiles y el exprés de 24 a 48 horas. La recogida en tienda está lista el mismo día.",
      },
      {
        question: "¿Cuánto cuesta el envío?",
        answer:
          "El envío estándar cuesta Q.4.95 y es gratis desde Q.50 de subtotal. El exprés cuesta Q.7.95 y la recogida en tienda Q.2.95.",
      },
      {
        question: "¿Qué formas de pago aceptan?",
        answer:
          "Puedes pagar con tarjeta de crédito o débito, Bizum o PayPal. Esta demostración no envía ningún dato de pago fuera de tu navegador.",
      },
      {
        question: "¿Puedo devolver un artículo?",
        answer:
          "Sí. Tienes 30 días naturales desde la entrega para devolver un artículo sin usar y en su empaque original.",
      },
      {
        question: "¿Cómo sigo mi pedido?",
        answer:
          "Escribe tu referencia MC- en la sección de seguimiento. Esta demostración solo conserva tu último pedido en el navegador.",
      },
      {
        question: "¿Qué pasa si un producto está agotado?",
        answer:
          "Los artículos sin existencias no se pueden añadir al carrito. Vuelve a revisar el catálogo en unos días.",
      },
      {
        question: "¿Puedo pedir factura?",
        answer:
          "Esta tienda es una demostración y no emite facturas. En una tienda real escribirías a hola@mrconfetti.example con tu referencia.",
      },
    ],
  },

  tracking: {
    heading: "Seguir pedido",
    description:
      "Escribe la referencia que recibiste al confirmar tu pedido para ver en qué punto va.",
    /** Visible label of the reference field. */
    label: "Referencia del pedido",
    placeholder: "MC-1ABC234",
    hint: "La referencia empieza por MC- y aparece en tu confirmación de compra.",
    submit: "Buscar pedido",
    /** Field error for an empty submission. */
    emptyError: "Escribe la referencia de tu pedido.",
    /** Field error for a reference that does not match the format. */
    malformedError: "La referencia no es válida. Debe empezar por MC-, por ejemplo MC-1ABC.",
    /** Honest limit: only the persisted last order can be found. */
    notFound: (reference: string) =>
      `No encontramos ningún pedido con la referencia ${reference}. Esta demostración solo guarda tu último pedido.`,
    found: (reference: string) => `Estos son los pasos de tu pedido ${reference}.`,
    /** Accessible name of the ordered step list. */
    stepsLabel: "Pasos del pedido",
    dateLabel: (date: string) => `Fecha del pedido: ${date}`,
    totalLabel: (amount: string) => `Total: ${amount}`,
    stepById: {
      confirmed: {
        label: "Pedido confirmado",
        description: "Recibimos tu pedido y registramos el pago.",
      },
      preparing: {
        label: "En preparación",
        description: "Estamos reuniendo y empaquetando tus artículos.",
      },
      shipped: {
        label: "Enviado",
        description: "Tu pedido salió del almacén hacia la dirección de entrega.",
      },
      delivered: {
        label: "Entregado",
        description: "Tu pedido llegó a su destino.",
      },
    } satisfies Record<TrackingStepId, { label: string; description: string }>,
  },

  sections: {
    devoluciones: {
      title: "Devoluciones",
      blocks: [
        {
          kind: "paragraph",
          text: "Queremos que tu fiesta salga bien. Si algo no encaja, puedes devolverlo.",
        },
        {
          kind: "list",
          items: [
            "Tienes 30 días naturales desde la fecha de entrega para solicitar la devolución.",
            "El artículo debe estar sin usar, completo y en su empaque original.",
            "Los artículos personalizados y los globos ya inflados no admiten devolución.",
            "Para empezar, escribe a hola@mrconfetti.example con tu referencia MC- y el motivo.",
          ],
        },
        {
          kind: "paragraph",
          text: "Al aprobar la devolución te confirmamos la dirección de envío y el reembolso se emite al método de pago original.",
        },
      ],
    },
    contacto: {
      title: "Contacto",
      blocks: [
        {
          kind: "paragraph",
          text: "¿Tienes una duda que no está en las preguntas frecuentes? Escríbenos.",
        },
        {
          kind: "list",
          items: [
            "Correo: hola@mrconfetti.example",
            "Horario de atención: de lunes a viernes, de 9 a 18 h",
          ],
        },
        {
          kind: "paragraph",
          text: "Respondemos en un día hábil. Esta tienda es una demostración y no publica teléfono ni dirección.",
        },
      ],
    },
    nosotros: {
      title: "Sobre nosotros",
      blocks: [
        {
          kind: "paragraph",
          text: "Mr. Confetti es una tienda de artículos de fiesta: globos, decoración, dulces y personajes para cada celebración.",
        },
        {
          kind: "paragraph",
          text: "Esta tienda de demostración usa datos de ejemplo y existe para mostrar el escaparate, el carrito y el proceso de compra.",
        },
      ],
    },
    privacidad: {
      title: "Privacidad",
      blocks: [
        {
          kind: "paragraph",
          text: "Este aviso de privacidad es contenido de demostración, sin valor legal.",
        },
        {
          kind: "list",
          items: [
            "Tu carrito, tus favoritos y tu último pedido se guardan solo en el almacenamiento local de tu navegador.",
            "Esta demostración no envía tus datos a ningún servidor ni usa cookies de seguimiento.",
            "Para cualquier consulta sobre tus datos, escribe a hola@mrconfetti.example.",
          ],
        },
      ],
    },
    terminos: {
      title: "Términos",
      blocks: [
        {
          kind: "paragraph",
          text: "Estos términos y condiciones son contenido de demostración, sin valor legal.",
        },
        {
          kind: "list",
          items: [
            "Los precios, el catálogo y la disponibilidad son datos de ejemplo y pueden cambiar.",
            "Las compras de esta demostración no generan ningún pedido real ni ningún cobro.",
            "El uso de la tienda implica aceptar que es un escaparate de práctica.",
          ],
        },
      ],
    },
  } satisfies Record<StaticHelpTopic, { title: string; blocks: readonly HelpBlock[] }>,
} as const);
