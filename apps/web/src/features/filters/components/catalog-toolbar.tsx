import { useId } from "react";

import { SlidersHorizontal } from "lucide-react";

import { SORT_OPTIONS, type SortKey } from "@/features/catalog/schemas/product";

type CatalogToolbarProps = {
  total: number;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  onOpenFilters: () => void;
};

/**
 * The count line of the design's render function: `36 productos`, and
 * `1 producto` for a single result.
 */
function countLabel(total: number): string {
  return `${total} ${total === 1 ? "producto" : "productos"}`;
}

/**
 * The catalog page header: title and live count on the left, the native sort
 * pill and the below-1024px filter trigger on the right.
 */
export function CatalogToolbar({ total, sort, onSortChange, onOpenFilters }: CatalogToolbarProps) {
  const sortId = useId();

  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">Todos los productos</h1>
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {countLabel(total)}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenFilters}
          className="hidden min-h-11 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring max-lg:inline-flex"
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Filtros
        </button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <label htmlFor={sortId}>Ordenar por</label>
          <select
            id={sortId}
            value={sort}
            onChange={(event) => {
              const option = SORT_OPTIONS.find((item) => item.value === event.target.value);
              if (option !== undefined) {
                onSortChange(option.value);
              }
            }}
            className="h-11 cursor-pointer rounded-full border border-border bg-background px-4 text-sm text-foreground focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
