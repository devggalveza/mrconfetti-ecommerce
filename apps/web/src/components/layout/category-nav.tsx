import { Link, useLocation } from "@tanstack/react-router";

import { Container } from "@/components/layout/container";
import { CATEGORY_NAV, type CategoryNavItem } from "@/features/catalog/data/navigation";
import { productsSearchSchema } from "@/features/catalog/schemas/products-search";
import { cn } from "@/lib/utils";

const linkClass =
  "inline-flex min-h-11 items-center whitespace-nowrap border-b-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * The products route always fills `sort` and `page`, so an exact comparison has
 * to run over the normalised search. This mirrors the legacy `MC.nav` href
 * equality instead of TanStack Router's inclusive subset match.
 */
function normalise(search: unknown): string {
  return JSON.stringify(productsSearchSchema.catch({}).parse(search));
}

/** The horizontal, scroll-snapping category rail below the header bar. */
export function CategoryNav() {
  const location = useLocation();

  function isActive(item: CategoryNavItem): boolean {
    if (location.pathname !== item.to) {
      return false;
    }
    return normalise(location.search) === normalise(item.search ?? {});
  }

  return (
    <nav aria-label="Categorías" className="border-t border-border bg-background">
      <Container>
        <ul className="flex gap-6 overflow-x-auto [scroll-snap-type:x_proximity] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORY_NAV.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.label} className="flex-none snap-start">
                <Link
                  to={item.to}
                  search={item.search}
                  // `exact` turns off the inclusive subset match, so the Link
                  // never claims an active state the exact comparison rejects;
                  // `aria-current` is set from that comparison instead.
                  activeOptions={{ exact: true, includeSearch: true }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    linkClass,
                    active
                      ? "border-brand text-brand"
                      : "border-transparent text-muted-foreground hover:border-brand hover:text-brand",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </nav>
  );
}
