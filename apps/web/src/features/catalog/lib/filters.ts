import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

import {
  BRANDS,
  CATEGORIES,
  type Brand,
  type Category,
  type Product,
  type SortKey,
} from "../schemas/product";
import type { ProductsSearch } from "../schemas/products-search";
import {
  byBrand,
  byCategory,
  dealsOnly as keepDeals,
  freeShippingOnly as keepFreeShipping,
  inPriceRange,
  minRating as keepMinRating,
  paginate,
  searchProducts,
  sortProducts,
} from "./selectors";

/** Vertical filters the catalog combines with the validated search state. */
export type CatalogFilters = {
  categories: Category[];
  brands: Brand[];
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number;
  freeShippingOnly: boolean;
  dealsOnly: boolean;
  query: string;
  sort: SortKey;
  page: number;
};

/** No facets selected, an open price range and the first page. */
export const DEFAULT_FILTERS: CatalogFilters = {
  categories: [],
  brands: [],
  minPrice: null,
  maxPrice: null,
  minRating: 0,
  freeShippingOnly: false,
  dealsOnly: false,
  query: "",
  sort: "rel",
  page: 1,
};

const CATEGORY_PREFIX = "category:";
const BRAND_PREFIX = "brand:";
const PRICE_KEY = "price";
const RATING_KEY = "rating";
const SHIPPING_KEY = "shipping";
const DEALS_KEY = "deals";

/** Narrows a URL string to a real category. */
function isCategory(value: string): value is Category {
  return CATEGORIES.some((category) => category === value);
}

/** Narrows a URL string to a real brand. */
function isBrand(value: string): value is Brand {
  return BRANDS.some((brand) => brand === value);
}

/** Keeps only real categories, once each, preserving the URL order. */
function toKnownCategories(values: readonly string[] | undefined): Category[] {
  const result: Category[] = [];
  for (const value of values ?? []) {
    if (isCategory(value) && !result.includes(value)) {
      result.push(value);
    }
  }
  return result;
}

/** Keeps only real brands, once each, preserving the URL order. */
function toKnownBrands(values: readonly string[] | undefined): Brand[] {
  const result: Brand[] = [];
  for (const value of values ?? []) {
    if (isBrand(value) && !result.includes(value)) {
      result.push(value);
    }
  }
  return result;
}

/** Turns a raw price bound into a usable one, or `null` when it is negative or not finite. */
function toBound(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

/** Clamps a raw rating threshold into `0..5`, defaulting to no rating filter. */
function toRating(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.min(5, Math.max(0, value));
}

/** Clamps a raw page number to a 1-based integer, defaulting to the first page. */
function toPage(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_FILTERS.page;
  }
  return Math.max(1, Math.trunc(value));
}

/** Converts validated search state into filters, sanitising every value the URL may carry. */
export function readFilters(search: ProductsSearch): CatalogFilters {
  const minPrice = toBound(search.minPrice);
  const maxPrice = toBound(search.maxPrice);
  const reversed = minPrice !== null && maxPrice !== null && minPrice > maxPrice;
  return {
    categories: toKnownCategories(search.cat),
    brands: toKnownBrands(search.brand),
    minPrice: reversed ? null : minPrice,
    maxPrice: reversed ? null : maxPrice,
    minRating: toRating(search.minRating),
    freeShippingOnly: search.freeShipping === true,
    dealsOnly: search.deal === true,
    query: search.q ?? "",
    sort: search.sort ?? DEFAULT_FILTERS.sort,
    page: toPage(search.page),
  };
}

/** Converts filters into search state, omitting every default so the URL stays short. */
export function toSearch(filters: CatalogFilters): ProductsSearch {
  const search: ProductsSearch = {};
  if (filters.categories.length > 0) {
    search.cat = [...filters.categories];
  }
  if (filters.brands.length > 0) {
    search.brand = [...filters.brands];
  }
  if (filters.query.length > 0) {
    search.q = filters.query;
  }
  if (filters.dealsOnly) {
    search.deal = true;
  }
  if (filters.minPrice !== null) {
    search.minPrice = filters.minPrice;
  }
  if (filters.maxPrice !== null) {
    search.maxPrice = filters.maxPrice;
  }
  if (filters.minRating > DEFAULT_FILTERS.minRating) {
    search.minRating = filters.minRating;
  }
  if (filters.freeShippingOnly) {
    search.freeShipping = true;
  }
  if (filters.sort !== DEFAULT_FILTERS.sort) {
    search.sort = filters.sort;
  }
  if (filters.page > DEFAULT_FILTERS.page) {
    search.page = filters.page;
  }
  return search;
}

/** Applies every facet in panel order and sorts last, never mutating the input. */
export function applyFilters(products: readonly Product[], filters: CatalogFilters): Product[] {
  const searched = searchProducts(products, filters.query);
  const byCategories = byCategory(searched, filters.categories);
  const byBrands = byBrand(byCategories, filters.brands);
  const byPrice = inPriceRange(byBrands, filters.minPrice, filters.maxPrice);
  const byRating = keepMinRating(byPrice, filters.minRating);
  const shipped = keepFreeShipping(byRating, filters.freeShippingOnly);
  const deals = keepDeals(shipped, filters.dealsOnly);
  return sortProducts(deals, filters.sort);
}

/** Slices one page of the already-filtered list through the shared pager. */
export function paginateResults(
  products: readonly Product[],
  page: number,
  perPage: number = PRODUCTS_PER_PAGE,
): { items: Product[]; page: number; totalPages: number; total: number; perPage: number } {
  return paginate(products, page, perPage);
}

/** Counts the facets in play; sort, query and page are not facets. */
export function countActiveFilters(filters: CatalogFilters): number {
  const price = filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0;
  const rating = filters.minRating > 0 ? 1 : 0;
  const shipping = filters.freeShippingOnly ? 1 : 0;
  const deals = filters.dealsOnly ? 1 : 0;
  return filters.categories.length + filters.brands.length + price + rating + shipping + deals;
}

/** Returns a new list with the value added or removed, preserving the existing order. */
export function toggleValue<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Formats a rating threshold the Spanish way, e.g. `4,5`. */
function formatRatingThreshold(rating: number): string {
  return rating.toFixed(1).replace(".", ",");
}

/** Builds the Spanish label of the price chip, or `null` when both bounds are open. */
function priceChipLabel(filters: CatalogFilters): string | null {
  const { minPrice, maxPrice } = filters;
  if (maxPrice === null) {
    return minPrice === null ? null : `Desde ${formatMoney(minPrice)}`;
  }
  if (minPrice === null) {
    return `Hasta ${formatMoney(maxPrice)}`;
  }
  return `${formatMoney(minPrice)} - ${formatMoney(maxPrice)}`;
}

/** Lists one removable chip per selected value and per active facet, in panel order. */
export function activeFilterChips(
  filters: CatalogFilters,
): ReadonlyArray<{ key: string; label: string }> {
  const chips: Array<{ key: string; label: string }> = [];
  for (const category of filters.categories) {
    chips.push({ key: `${CATEGORY_PREFIX}${category}`, label: category });
  }
  for (const brand of filters.brands) {
    chips.push({ key: `${BRAND_PREFIX}${brand}`, label: brand });
  }
  const price = priceChipLabel(filters);
  if (price !== null) {
    chips.push({ key: PRICE_KEY, label: price });
  }
  if (filters.minRating > 0) {
    chips.push({ key: RATING_KEY, label: `${formatRatingThreshold(filters.minRating)} o más` });
  }
  if (filters.freeShippingOnly) {
    chips.push({ key: SHIPPING_KEY, label: "Envío gratis" });
  }
  if (filters.dealsOnly) {
    chips.push({ key: DEALS_KEY, label: "Solo ofertas" });
  }
  return chips;
}

/** Removes exactly one chip and returns to the first page; an unknown key changes nothing. */
export function clearChip(filters: CatalogFilters, key: string): CatalogFilters {
  const firstPage = DEFAULT_FILTERS.page;
  if (key.startsWith(CATEGORY_PREFIX)) {
    const value = key.slice(CATEGORY_PREFIX.length);
    const categories = filters.categories.filter((category) => category !== value);
    if (categories.length === filters.categories.length) {
      return filters;
    }
    return { ...filters, categories, page: firstPage };
  }
  if (key.startsWith(BRAND_PREFIX)) {
    const value = key.slice(BRAND_PREFIX.length);
    const brands = filters.brands.filter((brand) => brand !== value);
    if (brands.length === filters.brands.length) {
      return filters;
    }
    return { ...filters, brands, page: firstPage };
  }
  switch (key) {
    case PRICE_KEY:
      return {
        ...filters,
        minPrice: DEFAULT_FILTERS.minPrice,
        maxPrice: DEFAULT_FILTERS.maxPrice,
        page: firstPage,
      };
    case RATING_KEY:
      return { ...filters, minRating: DEFAULT_FILTERS.minRating, page: firstPage };
    case SHIPPING_KEY:
      return { ...filters, freeShippingOnly: DEFAULT_FILTERS.freeShippingOnly, page: firstPage };
    case DEALS_KEY:
      return { ...filters, dealsOnly: DEFAULT_FILTERS.dealsOnly, page: firstPage };
    default:
      return filters;
  }
}

/** Clears every facet and the page, keeping the query and the sort of the header controls. */
export function clearAllFilters(filters: CatalogFilters): CatalogFilters {
  return { ...DEFAULT_FILTERS, query: filters.query, sort: filters.sort };
}
