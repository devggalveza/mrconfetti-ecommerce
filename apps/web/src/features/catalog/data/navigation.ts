import { CATEGORIES } from "@/features/catalog/schemas/product";
import type { ProductsSearch } from "@/features/catalog/schemas/products-search";

export type CategoryNavItem = {
  label: string;
  to: "/products";
  search?: ProductsSearch;
};

/**
 * The seven catalog categories, derived from `CATEGORIES` so the nav can never
 * drift into a dead filter link. The order matches the design's nav rail.
 */
const categoryItems: CategoryNavItem[] = CATEGORIES.map(
  (category): CategoryNavItem => ({
    label: category,
    to: "/products",
    search: { cat: [category] },
  }),
);

/** The nine entries of the legacy `MC.NAV` table, in their original order. */
export const CATEGORY_NAV: ReadonlyArray<CategoryNavItem> = [
  { label: "Todas las categorías", to: "/products" },
  ...categoryItems,
  { label: "Ofertas", to: "/products", search: { deal: true } },
];
