import type { BreadcrumbItem } from "@/components/layout/breadcrumbs";
import type { Category } from "@/features/catalog/schemas/product";

const HOME: BreadcrumbItem = { label: "Inicio", to: "/" };
const ALL_PRODUCTS: BreadcrumbItem = { label: "Todos los productos" };

/**
 * The catalog trail: Inicio › Todos los productos, appending the active
 * category only when exactly one is selected.
 */
export function catalogBreadcrumbs(
  categories: readonly Category[],
): ReadonlyArray<BreadcrumbItem> {
  const [activeCategory] = categories;

  if (categories.length !== 1 || activeCategory === undefined) {
    return [HOME, ALL_PRODUCTS];
  }

  return [HOME, { label: ALL_PRODUCTS.label, to: "/products" }, { label: activeCategory }];
}
