import { z } from "zod";

import { SORT_OPTIONS, type SortKey } from "@/features/catalog/schemas/product";

export type ProductsSearch = {
  cat?: string[];
  brand?: string[];
  q?: string;
  deal?: boolean;
  sort?: SortKey;
  page?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  freeShipping?: boolean;
};

const SORT_KEYS = SORT_OPTIONS.map((option) => option.value);
const DEFAULT_SORT: SortKey = "rel";
const DEFAULT_PAGE = 1;
const MAX_RATING = 5;

/** Accepts a single string or a string array and keeps only non-empty entries. */
function toTextList(value: unknown): string[] | undefined {
  if (typeof value === "string") {
    return value.trim().length > 0 ? [value] : undefined;
  }
  if (Array.isArray(value)) {
    const items = value.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
    return items.length > 0 ? items : undefined;
  }
  return undefined;
}

/** Accepts the truthy/falsy forms used in query strings. */
function toFlag(value: unknown): boolean | undefined {
  if (value === true || value === "true" || value === "1") {
    return true;
  }
  if (value === false || value === "false" || value === "0") {
    return false;
  }
  return undefined;
}

/** Coerces a page number from a string and clamps it to `>= 1`. */
export function toPage(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return Math.max(DEFAULT_PAGE, Math.trunc(parsed));
}

/** Coerces a finite, non-negative amount, so a negative price bound is dropped. */
export function toAmount(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

/** Coerces a rating threshold and clamps it into `0..5`. */
export function toRating(value: unknown): number | undefined {
  const parsed = toAmount(value);
  return parsed === undefined ? undefined : Math.min(MAX_RATING, parsed);
}

export const productsSearchSchema: z.ZodType<ProductsSearch> = z
  .object({
    cat: z.preprocess(toTextList, z.array(z.string()).optional()),
    brand: z.preprocess(toTextList, z.array(z.string()).optional()),
    q: z.string().optional().catch(undefined),
    deal: z.preprocess(toFlag, z.boolean().optional()),
    sort: z.enum(SORT_KEYS).catch(DEFAULT_SORT).optional(),
    page: z
      .preprocess(toPage, z.number().int().min(DEFAULT_PAGE).catch(DEFAULT_PAGE))
      .optional(),
    minPrice: z.preprocess(toAmount, z.number().optional()),
    maxPrice: z.preprocess(toAmount, z.number().optional()),
    minRating: z.preprocess(toRating, z.number().optional()),
    freeShipping: z.preprocess(toFlag, z.boolean().optional()),
  })
  .transform((value) => ({
    cat: value.cat,
    brand: value.brand,
    q: value.q,
    deal: value.deal,
    sort: value.sort ?? DEFAULT_SORT,
    page: value.page ?? DEFAULT_PAGE,
    minPrice: value.minPrice,
    maxPrice: value.maxPrice,
    minRating: value.minRating,
    freeShipping: value.freeShipping,
  }));
