import { products } from "@/features/catalog/data/products";
import { applyFilters, type CatalogFilters } from "@/features/catalog/lib/filters";
import { BRANDS, CATEGORIES, type Brand, type Category } from "@/features/catalog/schemas/product";

/**
 * Counts, for every option of one facet, how many products the catalogue would
 * leave while every OTHER active facet stays in place. A count therefore never
 * promises results the current filter set cannot deliver.
 */
function countOptions<T extends string>(
  filters: CatalogFilters,
  values: readonly T[],
  select: (base: CatalogFilters, value: T) => CatalogFilters,
): Map<T, number> {
  const base: CatalogFilters = { ...filters, page: 1 };
  const counts = new Map<T, number>();

  for (const value of values) {
    counts.set(value, applyFilters(products, select(base, value)).length);
  }

  return counts;
}

/** Per-category counts, each computed with the category facet fixed to that option. */
export function categoryCounts(filters: CatalogFilters): Map<Category, number> {
  return countOptions(filters, CATEGORIES, (base, category) => ({
    ...base,
    categories: [category],
  }));
}

/** Per-brand counts, each computed with the brand facet fixed to that option. */
export function brandCounts(filters: CatalogFilters): Map<Brand, number> {
  return countOptions(filters, BRANDS, (base, brand) => ({ ...base, brands: [brand] }));
}
