import { Link } from "@tanstack/react-router";

import { Container } from "@/components/layout/container";
import { CATEGORY_NAV } from "@/features/catalog/data/navigation";

const linkClass =
  "inline-flex min-h-11 items-center whitespace-nowrap border-b-2 border-transparent text-sm font-medium text-muted-foreground transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * The horizontal, scroll-snapping category rail. It only renders inside the
 * home-page header, so no link can be the current page and the rail carries no
 * active state.
 */
export function CategoryNav() {
  return (
    <nav aria-label="Categorías" className="bg-background">
      <Container>
        <ul className="flex gap-6 overflow-x-auto [scroll-snap-type:x_proximity] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORY_NAV.map((item) => (
            <li key={item.label} className="flex-none snap-start">
              <Link to={item.to} search={item.search} className={linkClass}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}
