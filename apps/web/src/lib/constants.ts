/** Number of catalog products shown on one page of the product grid. */
export const PRODUCTS_PER_PAGE = 12;

/** Maximum quantity of a single product that can be added to the cart. */
export const MAX_QUANTITY = 9;

/** Order subtotal (in GTQ) from which shipping is free. */
export const FREE_SHIPPING_FROM = 50;

/** Price (in GTQ) of the standard shipping option. */
export const STANDARD_SHIPPING_PRICE = 4.95;

/** Price (in GTQ) of the express shipping option. */
export const EXPRESS_SHIPPING_PRICE = 7.95;

/** Price (in GTQ) of the store pickup option. */
export const PICKUP_SHIPPING_PRICE = 2.95;

/** The shipping options the checkout offers. */
export type ShippingMethod = "standard" | "express" | "pickup";

/** Price (in GTQ) of every shipping method, keyed by method. */
export const SHIPPING_METHOD_PRICES: Readonly<Record<ShippingMethod, number>> = {
  standard: STANDARD_SHIPPING_PRICE,
  express: EXPRESS_SHIPPING_PRICE,
  pickup: PICKUP_SHIPPING_PRICE,
};

/** The method selected when the customer makes no explicit choice. */
export const DEFAULT_SHIPPING_METHOD: ShippingMethod = "standard";

/** Minimum discount (in percent) for a product to count as a deal. */
export const DEAL_MIN_DISCOUNT_PERCENT = 30;
