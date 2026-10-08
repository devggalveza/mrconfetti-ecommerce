import type { Brand, Category, Product, SortKey } from "../schemas/product";

/** Rounds the relative discount of a product to a whole percentage. */
export function discountPercent(product: Product): number {
  return Math.round((1 - product.price / product.original) * 100);
}

/** Filters by category, preserving input order; an empty selection means no filter. */
export function byCategory(list: readonly Product[], categories: readonly Category[]): Product[] {
  if (categories.length === 0) {
    return [...list];
  }
  return list.filter((product) => categories.includes(product.category));
}

/** Filters by brand, preserving input order; an empty selection means no filter. */
export function byBrand(list: readonly Product[], brands: readonly Brand[]): Product[] {
  if (brands.length === 0) {
    return [...list];
  }
  return list.filter((product) => brands.includes(product.brand));
}

/** Filters by price range; null bounds are open. */
export function inPriceRange(
  list: readonly Product[],
  min: number | null,
  max: number | null,
): Product[] {
  return list.filter(
    (product) =>
      (min === null || product.price >= min) && (max === null || product.price <= max),
  );
}

/** Keeps products whose rating is at least the given minimum. */
export function minRating(list: readonly Product[], minimum: number): Product[] {
  return list.filter((product) => product.rating >= minimum);
}

/** Keeps only free-shipping products when enabled, otherwise returns the list. */
export function freeShippingOnly(list: readonly Product[], enabled: boolean): Product[] {
  if (!enabled) {
    return [...list];
  }
  return list.filter((product) => product.freeShipping);
}

/** Keeps products at or above a discount threshold when enabled, otherwise returns the list. */
export function dealsOnly(
  list: readonly Product[],
  enabled: boolean,
  minimumDiscount = 30,
): Product[] {
  if (!enabled) {
    return [...list];
  }
  return list.filter((product) => discountPercent(product) >= minimumDiscount);
}

function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Case- and accent-insensitive search across name, category and brand. */
export function searchProducts(list: readonly Product[], query: string): Product[] {
  const needle = normalizeText(query.trim());
  if (needle.length === 0) {
    return [...list];
  }
  return list.filter((product) =>
    normalizeText(`${product.name} ${product.category} ${product.brand}`).includes(needle),
  );
}

/** Sorts by discount descending, breaking ties by id ascending; never mutates the input. */
export function dealsByDiscount(list: readonly Product[]): Product[] {
  return [...list].sort((a, b) => {
    const byDiscount = discountPercent(b) - discountPercent(a);
    return byDiscount !== 0 ? byDiscount : a.id - b.id;
  });
}

/** Sorts a copy of the list by the given key, breaking ties by id ascending. */
export function sortProducts(list: readonly Product[], sort: SortKey): Product[] {
  const copy = [...list];
  switch (sort) {
    case "rel":
      return copy;
    case "pa":
      return copy.sort((a, b) => a.price - b.price || a.id - b.id);
    case "pd":
      return copy.sort((a, b) => b.price - a.price || a.id - b.id);
    case "dto":
      return copy.sort(
        (a, b) => discountPercent(b) - discountPercent(a) || a.id - b.id,
      );
    case "val":
      return copy.sort((a, b) => b.rating - a.rating || a.id - b.id);
  }
}

/** Slices a 1-based page, clamping the page into `1..totalPages`; an empty list yields one page. */
export function paginate<T>(
  list: readonly T[],
  page: number,
  perPage: number,
): { items: T[]; page: number; totalPages: number; total: number; perPage: number } {
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const clampedPage = Math.min(Math.max(1, Math.trunc(page)), totalPages);
  const start = (clampedPage - 1) * perPage;
  return {
    items: list.slice(start, start + perPage),
    page: clampedPage,
    totalPages,
    total,
    perPage,
  };
}
