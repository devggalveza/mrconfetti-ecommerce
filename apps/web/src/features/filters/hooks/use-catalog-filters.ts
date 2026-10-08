import { useCallback, useMemo } from "react";

import { useNavigate, useSearch } from "@tanstack/react-router";

import { products } from "@/features/catalog/data/products";
import {
  activeFilterChips,
  applyFilters,
  clearAllFilters,
  clearChip,
  countActiveFilters,
  DEFAULT_FILTERS,
  paginateResults,
  readFilters,
  toSearch,
  toggleValue,
  type CatalogFilters,
} from "@/features/catalog/lib/filters";
import type { Brand, Category, SortKey } from "@/features/catalog/schemas/product";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";

/**
 * The single owner of catalog filter state. The toolbar, the chips, the panel
 * and the results all read this hook, so no component prop-drills filter state
 * and the URL stays the one source of truth.
 */
export function useCatalogFilters() {
  const search = useSearch({ from: "/products" });
  const navigate = useNavigate();

  const filters = useMemo(() => readFilters(search), [search]);

  const paginated = useMemo(
    () => paginateResults(applyFilters(products, filters), filters.page, PRODUCTS_PER_PAGE),
    [filters],
  );

  const commit = useCallback(
    (next: CatalogFilters, replace: boolean): void => {
      void navigate({ to: "/products", search: toSearch(next), replace });
    },
    [navigate],
  );

  /**
   * A facet or sort change replaces the current entry, so pressing Back leaves
   * the catalog instead of replaying every checkbox; every such change also
   * returns to the first page.
   */
  const commitFacets = useCallback(
    (next: CatalogFilters): void => {
      commit({ ...next, page: DEFAULT_FILTERS.page }, true);
    },
    [commit],
  );

  /** A page change pushes a new entry, so Back returns to the previous page. */
  const setPage = useCallback(
    (page: number): void => {
      commit({ ...filters, page }, false);
    },
    [commit, filters],
  );

  const toggleCategory = useCallback(
    (category: Category): void => {
      commitFacets({ ...filters, categories: toggleValue(filters.categories, category) });
    },
    [commitFacets, filters],
  );

  const toggleBrand = useCallback(
    (brand: Brand): void => {
      commitFacets({ ...filters, brands: toggleValue(filters.brands, brand) });
    },
    [commitFacets, filters],
  );

  const setPriceRange = useCallback(
    (minPrice: number | null, maxPrice: number | null): void => {
      commitFacets({ ...filters, minPrice, maxPrice });
    },
    [commitFacets, filters],
  );

  const setMinRating = useCallback(
    (minRating: number): void => {
      commitFacets({ ...filters, minRating });
    },
    [commitFacets, filters],
  );

  const setFreeShipping = useCallback(
    (freeShippingOnly: boolean): void => {
      commitFacets({ ...filters, freeShippingOnly });
    },
    [commitFacets, filters],
  );

  const setDealsOnly = useCallback(
    (dealsOnly: boolean): void => {
      commitFacets({ ...filters, dealsOnly });
    },
    [commitFacets, filters],
  );

  const setSort = useCallback(
    (sort: SortKey): void => {
      commitFacets({ ...filters, sort });
    },
    [commitFacets, filters],
  );

  const removeChip = useCallback(
    (key: string): void => {
      commitFacets(clearChip(filters, key));
    },
    [commitFacets, filters],
  );

  const clearAll = useCallback((): void => {
    commitFacets(clearAllFilters(filters));
  }, [commitFacets, filters]);

  const setFilters = useCallback(
    (next: CatalogFilters): void => {
      commit(next, true);
    },
    [commit],
  );

  return {
    filters,
    results: paginated.items,
    page: paginated.page,
    totalPages: paginated.totalPages,
    total: paginated.total,
    perPage: paginated.perPage,
    activeCount: countActiveFilters(filters),
    chips: activeFilterChips(filters),
    toggleCategory,
    toggleBrand,
    setPriceRange,
    setMinRating,
    setFreeShipping,
    setDealsOnly,
    setSort,
    setPage,
    removeChip,
    clearAll,
    setFilters,
  };
}
