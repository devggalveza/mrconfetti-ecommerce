import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { EmptyState } from "@/features/catalog/components/empty-state";
import { Pagination } from "@/features/catalog/components/pagination";
import { ProductGrid } from "@/features/catalog/components/product-grid";
import { productsSearchSchema } from "@/features/catalog/schemas/products-search";
import { ActiveFilterChips } from "@/features/filters/components/active-filter-chips";
import { CatalogFilterPanel } from "@/features/filters/components/catalog-filter-panel";
import { CatalogToolbar } from "@/features/filters/components/catalog-toolbar";
import { useCatalogFilters } from "@/features/filters/hooks/use-catalog-filters";
import { catalogBreadcrumbs } from "@/features/filters/lib/catalog-breadcrumbs";

export const Route = createFileRoute("/products")({
  validateSearch: (search: Record<string, unknown>) =>
    productsSearchSchema.catch({}).parse(search),
  head: () => ({
    meta: [
      { title: "Todos los productos | Mr. Confetti" },
      {
        name: "description",
        content:
          "Explora globos, decoración y dulces para tu fiesta. Filtra por categoría, marca, precio y valoración. Envío a toda Guatemala.",
      },
    ],
  }),
  component: ProductsComponent,
});

/** The `/products` catalog: toolbar, filters, chips, grid and pager. */
function ProductsComponent() {
  const {
    filters,
    results,
    page,
    totalPages,
    total,
    chips,
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
  } = useCatalogFilters();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const panelProps = {
    filters,
    total,
    onToggleCategory: toggleCategory,
    onToggleBrand: toggleBrand,
    onSetPriceRange: setPriceRange,
    onSetMinRating: setMinRating,
    onSetFreeShipping: setFreeShipping,
    onSetDealsOnly: setDealsOnly,
    onClearAll: clearAll,
  };

  return (
    <>
      <Breadcrumbs items={catalogBreadcrumbs(filters.categories)} />

      <CatalogToolbar
        total={total}
        sort={filters.sort}
        onSortChange={setSort}
        onOpenFilters={() => {
          setDrawerOpen(true);
        }}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:sticky lg:top-30 lg:block lg:max-h-[calc(100vh-8.5rem)] lg:overflow-y-auto lg:pr-2">
          <CatalogFilterPanel {...panelProps} />
        </aside>

        <section aria-label="Resultados">
          <ActiveFilterChips chips={chips} onRemove={removeChip} />
          {results.length > 0 ? (
            <ProductGrid products={results} />
          ) : (
            <EmptyState onReset={clearAll} />
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </section>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="left"
          aria-label="Filtros de productos"
          className="w-[min(340px,88vw)] duration-[250ms]"
        >
          <CatalogFilterPanel
            {...panelProps}
            onApply={() => {
              setDrawerOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
