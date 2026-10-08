import { useId, useMemo } from "react";

import { Button } from "@/components/ui/button";
import type { CatalogFilters } from "@/features/catalog/lib/filters";
import {
  BRANDS,
  CATEGORIES,
  type Brand,
  type Category,
} from "@/features/catalog/schemas/product";
import { DEAL_MIN_DISCOUNT_PERCENT } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { brandCounts, categoryCounts } from "../lib/facet-counts";
import { FilterCheckboxGroup } from "./filter-checkbox-group";
import { FilterOption } from "./filter-option";
import { PriceRangeFilter } from "./price-range-filter";
import { RatingFilter } from "./rating-filter";

type CatalogFilterPanelProps = {
  filters: CatalogFilters;
  /** Total results, shown on the drawer-only apply button. */
  total: number;
  onToggleCategory: (value: Category) => void;
  onToggleBrand: (value: Brand) => void;
  onSetPriceRange: (min: number | null, max: number | null) => void;
  onSetMinRating: (value: number) => void;
  onSetFreeShipping: (value: boolean) => void;
  onSetDealsOnly: (value: boolean) => void;
  onClearAll: () => void;
  /** When present, the panel is the mobile drawer and shows its apply button. */
  onApply?: () => void;
};

/**
 * The whole filter sidebar. It is mounted twice (desktop aside and mobile
 * drawer), so every id comes from `useId` and the apply button only renders
 * when the drawer passes `onApply`. No `Separator` is drawn between groups:
 * the heading and spacing carry the rhythm.
 */
export function CatalogFilterPanel({
  filters,
  total,
  onToggleCategory,
  onToggleBrand,
  onSetPriceRange,
  onSetMinRating,
  onSetFreeShipping,
  onSetDealsOnly,
  onClearAll,
  onApply,
}: CatalogFilterPanelProps) {
  const headingId = useId();
  const shippingHeadingId = useId();

  const counts = useMemo(
    () => ({ categories: categoryCounts(filters), brands: brandCounts(filters) }),
    [filters],
  );

  const categoryOptions = CATEGORIES.map((category) => ({
    value: category,
    label: category,
    count: counts.categories.get(category) ?? 0,
  }));
  const brandOptions = BRANDS.map((brand) => ({
    value: brand,
    label: brand,
    count: counts.brands.get(brand) ?? 0,
  }));

  return (
    <section aria-labelledby={headingId}>
      <div
        className={cn(
          "mb-2 flex items-center justify-between gap-2",
          // The drawer's own close button sits over this corner.
          onApply === undefined ? undefined : "pr-12",
        )}
      >
        <h2 id={headingId} className="text-lg font-bold">
          Filtros
        </h2>
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex min-h-11 items-center rounded-sm px-2 text-sm font-semibold text-brand transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Limpiar todo
        </button>
      </div>

      <FilterCheckboxGroup
        title="Categoría"
        options={categoryOptions}
        selected={filters.categories}
        onToggle={onToggleCategory}
      />

      <FilterCheckboxGroup
        title="Marca"
        options={brandOptions}
        selected={filters.brands}
        onToggle={onToggleBrand}
      />

      <PriceRangeFilter
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        onCommit={onSetPriceRange}
      />

      <RatingFilter minRating={filters.minRating} onChange={onSetMinRating} />

      <section aria-labelledby={shippingHeadingId} className="py-3">
        <h3 id={shippingHeadingId} className="mb-2 text-[15px] font-semibold">
          Envío y ofertas
        </h3>
        <FilterOption
          id={`${shippingHeadingId}-shipping`}
          label="Envío gratis"
          checked={filters.freeShippingOnly}
          onCheckedChange={onSetFreeShipping}
        />
        <FilterOption
          id={`${shippingHeadingId}-deals`}
          label={`Solo ofertas (-${DEAL_MIN_DISCOUNT_PERCENT} % o más)`}
          checked={filters.dealsOnly}
          onCheckedChange={onSetDealsOnly}
        />
      </section>

      {onApply === undefined ? null : (
        <Button type="button" size="pill" onClick={onApply} className="mt-3 w-full">
          Ver {total} resultados
        </Button>
      )}
    </section>
  );
}
