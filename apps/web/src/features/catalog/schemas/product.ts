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

export const productSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    category: z.enum(CATEGORIES),
    brand: z.enum(BRANDS),
    price: z.number().nonnegative(),
    original: z.number().positive(),
    rating: z.number().min(0).max(5),
    reviews: z.number().int().nonnegative(),
    freeShipping: z.boolean(),
    image: z.string().startsWith("/"),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .refine((product) => product.original >= product.price, {
    message: "original must be greater than or equal to price",
    path: ["original"],
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
