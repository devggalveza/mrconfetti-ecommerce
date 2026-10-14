/**
 * Spanish copy for the cart page, kept out of the components so every heading,
 * label, hint and status message has a single editable home.
 *
 * The module follows the phase 6 copy convention: one frozen typed object built
 * with `as const`, with the values that depend on the cart (a product name, a
 * remaining amount, a coupon label) exported as small builders instead of
 * literals. Components import this object and never inline a user-facing string.
 */

/** Where the "remainder" free-shipping line and the summary point the shopper. */
export const CART_COPY = Object.freeze({
  /** Document title set by the route. */
  title: "Carrito | Mr. Confetti",
  /** Document description set by the route. */
  description:
    "Revisa los artículos de tu carrito, aplica tu cupón y comprueba el envío y el total antes de finalizar la compra.",
  /** The page's single `h1`. */
  heading: "Tu carrito",
  /** Breadcrumb trail labels. */
  breadcrumbRoot: "Inicio",
  breadcrumbCurrent: "Carrito",
  /** Accessible name of the list that holds the cart lines. */
  lineListLabel: "Artículos en el carrito",
  /** Heading of the recommended-products rail. */
  recommendedHeading: "Recomendados para ti",
  /** Accessible name of the loading status that stands in for persisted sections. */
  loading: "Cargando tu carrito",

  freeShipping: {
    /** Accessible name of the `role="progressbar"` meter. */
    progressLabel: "Progreso hacia el envío gratis",
    /** Announced while the cart is short of the free-shipping threshold. */
    remaining: (amount: string) => `Te faltan ${amount} para el envío gratis.`,
    /** Announced once the cart ships free, whether by subtotal or because every item does. */
    reached: "¡Felicidades! Tu pedido tiene envío gratis.",
  },

  line: {
    /** Visible label above the unit price, e.g. `Precio unitario: Q.35`. */
    unitPriceLabel: "Precio unitario",
    /** Accessible name of the icon-only remove control. */
    removeLabel: (productName: string) => `Quitar ${productName} del carrito`,
    /** Visible label of the save-for-later action. */
    save: "Guardar para después",
    /** Accessible name of the save-for-later action, which repeats the visible label. */
    saveLabel: (productName: string) => `Guardar para después: ${productName}`,
    /** `alt` text of the line thumbnail. */
    thumbnailAlt: (productName: string) => `Imagen de ${productName}`,
  },

  saved: {
    heading: "Guardados para después",
    /** Visible label of the move-to-cart action. */
    moveToCart: "Mover al carrito",
    /** Accessible name of the move-to-cart action. */
    moveToCartLabel: (productName: string) => `Mover ${productName} al carrito`,
    /** Accessible name of the icon-only remove-from-saved control. */
    removeLabel: (productName: string) => `Quitar ${productName} de guardados`,
  },

  coupon: {
    heading: "¿Tienes un cupón?",
    label: "Código de cupón",
    placeholder: "Escribe tu código",
    submitLabel: "Aplicar",
    clearLabel: "Quitar cupón",
    emptyMessage: "Escribe un código para aplicarlo.",
    /** Success message naming the coupon label from the shared table. */
    applied: (label: string) => `Cupón aplicado: ${label}.`,
    /** Failure message; the previously applied coupon stays untouched. */
    rejected: "El código no es válido. Inténtalo de nuevo.",
    /** Announced after the clear action removes the applied coupon. */
    cleared: "Cupón quitado.",
  },

  summary: {
    heading: "Resumen del pedido",
    subtotal: "Subtotal",
    discount: "Descuento",
    shipping: "Envío",
    /** Shown instead of an amount when the cart ships free. */
    freeShipping: "Gratis",
    total: "Total",
    /** Visible label of the checkout link. */
    checkout: "Finalizar compra",
    /** Visible label of the clear-all trigger. */
    clearCart: "Vaciar carrito",
  },

  empty: {
    heading: "Tu carrito está vacío",
    message: "Explora el catálogo y añade tus artículos de fiesta favoritos.",
    cta: "Explorar el catálogo",
  },

  clearDialog: {
    title: "¿Vaciar el carrito?",
    description: "Se quitarán todos los artículos del carrito. Esta acción no se puede deshacer.",
    confirm: "Sí, vaciar el carrito",
    cancel: "Cancelar",
  },

  confirmation: {
    title: "¡Gracias por tu compra!",
    description: (reference: string) => `Tu pedido ${reference} quedó confirmado.`,
    totalLabel: "Total pagado",
    close: "Cerrar",
  },
} as const);
