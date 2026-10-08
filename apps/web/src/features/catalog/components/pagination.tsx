import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

type PageItem = number | "ellipsis";

/**
 * The first page, the last page and a window of one around the current one,
 * with an ellipsis where the numbers are skipped.
 */
function buildPageItems(page: number, totalPages: number): PageItem[] {
  const visible = new Set<number>([1, totalPages]);
  for (let candidate = page - 1; candidate <= page + 1; candidate += 1) {
    if (candidate >= 1 && candidate <= totalPages) {
      visible.add(candidate);
    }
  }

  const sorted = [...visible].sort((a, b) => a - b);
  const items: PageItem[] = [];
  let previous = 0;

  for (const item of sorted) {
    if (item - previous > 1) {
      items.push("ellipsis");
    }
    items.push(item);
    previous = item;
  }

  return items;
}

const PAGE_BUTTON =
  "grid size-11 place-items-center rounded-full border border-border text-sm font-semibold transition-colors enabled:hover:border-brand enabled:hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40";

/** The centred pager; hidden while the catalogue fits on a single page. */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const items = buildPageItems(page, totalPages);

  return (
    <nav aria-label="Paginación" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => {
          onPageChange(page - 1);
        }}
        className={PAGE_BUTTON}
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </button>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} aria-hidden="true" className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            aria-label={`Página ${item}`}
            onClick={() => {
              onPageChange(item);
            }}
            className={cn(PAGE_BUTTON, item === page && "border-brand bg-brand text-primary-foreground")}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        aria-label="Página siguiente"
        disabled={page >= totalPages}
        onClick={() => {
          onPageChange(page + 1);
        }}
        className={PAGE_BUTTON}
      >
        <ChevronRight aria-hidden="true" className="size-5" />
      </button>
    </nav>
  );
}
