import { Link } from "@tanstack/react-router";

import { SectionHeading } from "@/features/home/components/section-heading";
import { HOME_CATEGORIES, HOME_SECTION_HEADINGS } from "@/features/home/data/home-content";
import { toProductsLink } from "@/features/home/lib/products-link";

const CATEGORY_HEADING_ID = "home-popular-categories";

/**
 * The popular-categories row: the seven catalog categories as circular icon
 * shortcuts into their own filtered listing.
 */
export function CategoryGrid() {
  return (
    <section aria-labelledby={CATEGORY_HEADING_ID} className="mt-8">
      <SectionHeading
        title={HOME_SECTION_HEADINGS.popularCategories}
        headingId={CATEGORY_HEADING_ID}
        actionHref="/products"
      />

      <ul className="grid grid-cols-7 gap-4 max-lg:grid-cols-4 max-lg:gap-y-6 max-md:grid-cols-3">
        {HOME_CATEGORIES.map(({ category, icon: Icon, href }) => {
          const target = toProductsLink(href);

          return (
            <li key={category}>
              <Link
                to={target.to}
                search={target.search}
                className="group flex min-h-11 flex-col items-center gap-2 px-1 py-2 text-center text-base font-medium text-muted-foreground transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="grid size-24 place-items-center rounded-full bg-surface text-foreground transition-colors group-hover:bg-brand-soft group-hover:text-brand max-[480px]:size-[72px]">
                  <Icon aria-hidden="true" strokeWidth={1.5} className="size-[38px]" />
                </span>
                {category}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
