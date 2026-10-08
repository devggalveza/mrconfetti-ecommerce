import { Link } from "@tanstack/react-router";

import { SectionHeading } from "@/features/home/components/section-heading";
import {
  HOME_BRANDS,
  HOME_SECTION_HEADINGS,
  HOME_TRUST_CARDS,
} from "@/features/home/data/home-content";
import { cn } from "@/lib/utils";

const BRANDS_HEADING_ID = "home-brands";

/**
 * The official-store row and the three trust cards under it. The brand row is a
 * two-column grid on mobile and three columns from the small breakpoint up,
 * because the catalogue ships three brands rather than the design's eight.
 */
export function BrandsShowcase() {
  return (
    <section aria-labelledby={BRANDS_HEADING_ID} className="mt-8">
      <SectionHeading title={HOME_SECTION_HEADINGS.brands} headingId={BRANDS_HEADING_ID} />

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {HOME_BRANDS.map((brand) => (
          <li key={brand.name}>
            <Link
              to="/products"
              search={{ brand: [brand.name] }}
              className="grid min-h-[52px] place-items-center rounded-sm bg-surface px-2 text-center text-[13px] font-bold text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {brand.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-3 gap-4 max-md:grid-cols-1">
        {HOME_TRUST_CARDS.map((card) => (
          <div
            key={card.id}
            className={cn(
              "flex min-h-[110px] flex-col justify-center rounded-lg p-4 text-[17px] leading-[1.2] font-bold",
              card.tone,
            )}
          >
            {card.title}
            <span className="mt-1 text-[13px] font-medium text-muted-foreground">
              {card.detail}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
