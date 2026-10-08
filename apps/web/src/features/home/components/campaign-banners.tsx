import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { HOME_CAMPAIGNS, HOME_SECTION_HEADINGS } from "@/features/home/data/home-content";
import { toProductsLink } from "@/features/home/lib/products-link";
import { cn } from "@/lib/utils";

/**
 * The three campaign banners: an eyebrow, a wrapping headline, the decorative
 * icon and one CTA. The card itself is not a link, so each card is a single
 * keyboard stop at its button.
 */
export function CampaignBanners() {
  return (
    <section aria-label={HOME_SECTION_HEADINGS.campaigns} className="mt-8">
      <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
        {HOME_CAMPAIGNS.map(({ id, eyebrow, title, ctaLabel, href, gradient, icon: Icon }) => {
          const cta = toProductsLink(href);

          return (
            <article
              key={id}
              className={cn(
                "relative flex min-h-[280px] flex-col justify-between gap-4 overflow-hidden rounded-lg p-6 text-white",
                gradient,
              )}
            >
              <div>
                <p className="text-sm font-semibold">{eyebrow}</p>
                <h3 className="text-[26px] leading-[1.15] font-extrabold">{title}</h3>
              </div>

              <Icon
                aria-hidden="true"
                strokeWidth={1.5}
                className="pointer-events-none absolute -right-[10px] -bottom-[10px] size-40 opacity-28"
              />

              <Button
                variant="inverse"
                size="pill"
                render={<Link to={cta.to} search={cta.search} />}
                className="relative self-start"
              >
                {ctaLabel}
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
