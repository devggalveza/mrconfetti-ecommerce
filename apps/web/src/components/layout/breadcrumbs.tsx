import { Link } from "@tanstack/react-router";

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

/** Ordered breadcrumb trail; the last item is the current page, not a link. */
export function Breadcrumbs({ items }: { items: ReadonlyArray<BreadcrumbItem> }) {
  return (
    <nav aria-label="Ruta de navegación">
      <ol className="flex flex-wrap items-center gap-2 py-4 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">›</span> : null}
              {isLast || item.to === undefined ? (
                <span aria-current="page" className="inline-flex min-h-11 items-center">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="inline-flex min-h-11 items-center font-medium text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
