import { STANDARD_SHIPPING_PRICE } from "@/lib/constants";
import { COUPONS } from "@/lib/coupons";
import { formatMoney } from "@/lib/format";

/**
 * Spanish copy for the product detail page, kept out of the components so every
 * label, hint and status message has a single editable home.
 *
 * The design sample was written around one row and one coupon, so the values that
 * depend on the product or on the coupon table are exported as small builders
 * instead of literals: the catalogue's own stock figures and per-order ceiling
 * replace the demo's single `12 unidades` line, and `lib/coupons.ts` holds two
 * codes, not one.
 */

/** The coupon codes a retry hint may suggest, in table order. */
const COUPON_CODES: readonly string[] = Object.keys(COUPONS);

/** First coupon code, used as the input's example. */
const EXAMPLE_COUPON_CODE = COUPON_CODES[0] ?? "";

/** Codes joined for the invalid-code hint, e.g. `EMOX10 o BIENVENIDO`. */
const COUPON_CODE_HINT = COUPON_CODES.length > 0 ? COUPON_CODES.join(" o ") : "tu código";

/** Screen-reader action names of the gallery stage button, one per zoom state. */
const ZOOM_IN_ACTION = "Ampliar imagen";
const ZOOM_OUT_ACTION = "Reducir imagen";

/**
 * Gallery zoom hints, the thumbnail list's accessible name and the stage button's
 * accessible name. `stageLabel` leads with the action the next press performs and
 * ends with the product, so the name states both and never changes by accident when
 * the badge disappears; the visible hint keeps the resting-state wording.
 */
export const PRODUCT_GALLERY_COPY = {
  zoomIn: "Toca para ampliar",
  zoomOut: "Toca para reducir",
  thumbnailsLabel: "Imágenes del producto",
  stageLabel: (productName: string, zoomed: boolean) =>
    `${zoomed ? ZOOM_OUT_ACTION : ZOOM_IN_ACTION} · ${productName}`,
} as const;

/**
 * The stock line under the buy controls. `inStock` drops the plural for a single
 * unit, and `outOfStock` is there for a product that runs out.
 */
export const PRODUCT_STOCK_COPY = {
  inStock: (units: number) =>
    units === 1 ? "En stock · queda 1 unidad" : `En stock · quedan ${units} unidades`,
  outOfStock: "Agotado por ahora",
} as const;

/** Instalment plan the product page advertises. */
const INSTALMENT_PLAN_COUNT = 3;

/**
 * Instalments line under the price. `line` takes the already-formatted amount of
 * one instalment, and the plan size stays here so the route only has to divide the
 * price it is showing.
 */
export const PRODUCT_INSTALMENTS_COPY = {
  planCount: INSTALMENT_PLAN_COUNT,
  line: (amount: string) => `o ${INSTALMENT_PLAN_COUNT} pagos de ${amount} sin intereses`,
} as const;

/** Labels of the colour and pack groups, plus the surcharge format of a paid pack. */
export const PRODUCT_OPTION_COPY = {
  colorLabel: "Color",
  packLabel: "Paquete",
  packSurcharge: (extra: number) => `+${formatMoney(extra)}`,
} as const;

/** Accessible name of the quantity group and of its two stepper buttons. */
export const PRODUCT_QUANTITY_COPY = {
  groupLabel: "Cantidad",
  decreaseLabel: "Reducir cantidad",
  increaseLabel: "Aumentar cantidad",
} as const;

/**
 * The three states of the buy button while a product is being added to the cart,
 * the toast the cart store's confirmation shows, and the hidden companion of the
 * button's visible label.
 */
export const PRODUCT_ADD_TO_CART_COPY = {
  idle: "Añadir al carrito",
  pending: "Añadiendo…",
  added: "Añadido",
  toast: "Añadido al carrito",
  /**
   * Visually hidden tail of the buy button's accessible name: the product it adds.
   * It repeats none of the visible label, so the name reads as the label plus the
   * product and the rail's identical labels stop being indistinguishable from it.
   */
  productName: (name: string) => name,
} as const;

/**
 * Bold and detail lines of the perks block. The shipping perk swaps its title when
 * the product does not qualify for free shipping; its detail line is not stored
 * here because the component builds it with `deliveryEstimate`.
 */
export const PRODUCT_PERKS_COPY = {
  shippingFreeTitle: "Envío gratis en 24–48 h",
  shippingPaidTitle: `Envío estándar por ${formatMoney(STANDARD_SHIPPING_PRICE)}`,
  returnsTitle: "30 días para devolverlo",
  returnsDetail: "Devolución gratuita, sin preguntas",
  warrantyTitle: "2 años de garantía",
  warrantyDetail: "Soporte técnico incluido",
} as const;

/**
 * Coupon block copy. The placeholder and the retry hint are derived from the
 * `COUPONS` table, so adding a code updates them together, and the applied
 * message names whichever code the shopper resolved.
 */
export const PRODUCT_COUPON_COPY = {
  label: "¿Tienes un cupón?",
  placeholder: `Código, p. ej. ${EXAMPLE_COUPON_CODE}`,
  submitLabel: "Aplicar",
  emptyMessage: "Escribe un código para aplicarlo.",
  appliedMessage: (code: string) => `Cupón ${code} aplicado.`,
  invalidMessage: `El código no es válido. Prueba con ${COUPON_CODE_HINT}.`,
} as const;

/**
 * Detail tab labels, plus the accessible name of the section that holds them. The
 * reviews tab interpolates the product's aggregate count.
 */
export const PRODUCT_TABS_COPY = {
  sectionLabel: "Detalles del producto",
  description: "Descripción",
  specs: "Especificaciones",
  reviews: (count: number) => `Reseñas (${count})`,
} as const;

/**
 * Reviews tab labels. `starRowLabel` names one bar of the distribution,
 * `percentLabel` renders that bar's share, and `aggregateLabel` wraps the
 * product's already-formatted average rating.
 */
export const PRODUCT_REVIEWS_COPY = {
  barsLabel: "Distribución de valoraciones",
  starRowLabel: (stars: number) => `${stars} de 5`,
  percentLabel: (value: number) => `${value} %`,
  aggregateLabel: (formattedRating: string) => `${formattedRating} de 5`,
  verifiedBadge: "Compra verificada",
} as const;

/** Heading of the related-products rail. */
export const PRODUCT_RELATED_COPY = {
  heading: "Quienes vieron esto también miraron",
} as const;

/** Sticky mobile add-to-cart bar, whose accessible name includes the product. */
export const PRODUCT_STICKY_BAR_COPY = {
  addLabel: "Añadir al carrito",
  addAriaLabel: (productName: string) => `Añadir ${productName} al carrito`,
} as const;

/** Fallback state when the route receives an id that matches no product. */
export const PRODUCT_NOT_FOUND_COPY = {
  heading: "No encontramos este producto",
  message:
    "El artículo que buscas ya no está disponible o el enlace cambió. Explora el catálogo para encontrar una alternativa.",
  backLabel: "Volver al catálogo",
} as const;

/** Breadcrumb root label; the category and product crumbs come from the product. */
export const PRODUCT_BREADCRUMB_COPY = {
  rootLabel: "Inicio",
} as const;

/** Shop name the document titles are suffixed with. */
const SHOP_NAME = "Mr. Confetti";

/** Document titles this page sets, so the title is copy like every other string. */
export const PRODUCT_TITLE_COPY = {
  forProduct: (productName: string) => `${productName} | ${SHOP_NAME}`,
  notFound: `${PRODUCT_NOT_FOUND_COPY.heading} | ${SHOP_NAME}`,
} as const;
