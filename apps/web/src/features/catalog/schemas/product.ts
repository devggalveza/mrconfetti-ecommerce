import { z } from "zod";

export const CATEGORIES = [
  "Graduación",
  "Globos",
  "Personajes",
  "Cumpleaños",
  "Revelación de género",
  "Dulces y piñata",
  "Decoración",
] as const;

export const BRANDS = ["Mr. Confetti", "Fiesta Pro", "Dulces Selectos"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Brand = (typeof BRANDS)[number];

/** A single row of the detail page's specifications table. */
export const productSpecSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

/** A selectable colour swatch, with its brand hex value. */
export const productColorSchema = z.object({
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9a-f]{6}$/i),
});

/** A purchase option; `extra` is the surcharge in GTQ (0 for the base option). */
export const productPackSchema = z.object({
  name: z.string().min(1),
  extra: z.number().nonnegative(),
});

/** One featured review rendered in the detail page's reviews tab. */
export const productCustomerReviewSchema = z.object({
  author: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  body: z.string().min(1),
});

export type ProductSpec = z.infer<typeof productSpecSchema>;
export type ProductColor = z.infer<typeof productColorSchema>;
export type ProductPack = z.infer<typeof productPackSchema>;
export type ProductCustomerReview = z.infer<typeof productCustomerReviewSchema>;

export const productSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    /** Spanish sales copy shown in the detail page's description tab. */
    description: z.string().min(1),
    /**
     * Short benefit bullets rendered under `description`, each one a complete
     * sentence. They expand on the `specs` rows instead of repeating them.
     */
    highlights: z.array(z.string().min(1)).min(1),
    category: z.enum(CATEGORIES),
    brand: z.enum(BRANDS),
    price: z.number().nonnegative(),
    original: z.number().positive(),
    rating: z.number().min(0).max(5),
    /** Aggregate number of ratings; the UI renders it as `Reseñas (128)`. */
    reviews: z.number().int().nonnegative(),
    freeShipping: z.boolean(),
    image: z.string().startsWith("/"),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    /**
     * Units available. The detail page's quantity stepper clamps to the smaller of
     * this value and the per-order ceiling (`MAX_QUANTITY` in `lib/constants.ts`).
     */
    stock: z.number().int().nonnegative(),
    /** Detail page specification rows. */
    specs: z.array(productSpecSchema).min(1),
    /** Selectable colour swatches. */
    colors: z.array(productColorSchema).min(1),
    /**
     * Purchase options, the base one first. Read-only because every product
     * aliases the one frozen {@link PRODUCT_PACKS} table.
     */
    packs: z.array(productPackSchema).min(1).readonly(),
    /**
     * The few reviews featured in the detail page's reviews tab. Distinct from
     * {@link reviews}, which is the aggregate count shown as `Reseñas (128)`;
     * the featured list is a highlight set, so it is normally far shorter than
     * the total (e.g. 2 featured entries behind a count of 128).
     */
    customerReviews: z.array(productCustomerReviewSchema).min(1),
  })
  .refine((product) => product.original >= product.price, {
    message: "original must be greater than or equal to price",
    path: ["original"],
  })
  .refine((product) => product.customerReviews.length <= product.reviews, {
    message: "customerReviews must not outnumber the aggregate reviews count",
    path: ["customerReviews"],
  });

export type Product = z.infer<typeof productSchema>;

export const productsSchema = z.array(productSchema);

export type SortKey = "rel" | "pa" | "pd" | "dto" | "val";

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "rel", label: "Más relevantes" },
  { value: "pa", label: "Precio: menor a mayor" },
  { value: "pd", label: "Precio: mayor a menor" },
  { value: "dto", label: "Mayor descuento" },
  { value: "val", label: "Mejor valorados" },
];
