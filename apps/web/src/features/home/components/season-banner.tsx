import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { SEASON_BANNER } from "@/features/home/data/home-content";
import { toProductsLink } from "@/features/home/lib/products-link";

const SEASON_HEADING_ID = "home-season";

/**
 * The green season band: the heading, its description and the highlight CTA.
 * Below 768px it stacks into a start-aligned column.
 */
export function SeasonBanner() {
  const cta = toProductsLink(SEASON_BANNER.href);

  return (
    <section
      aria-labelledby={SEASON_HEADING_ID}
      className="mt-6 flex items-center justify-between gap-6 overflow-hidden rounded-lg bg-linear-120 from-success to-success/80 p-8 text-white max-md:flex-col max-md:items-start"
    >
      <div>
        <h2
          id={SEASON_HEADING_ID}
          className="text-[28px] leading-[1.3] font-bold max-md:text-[22px]"
        >
          {SEASON_BANNER.title}
        </h2>
        <p className="mt-1 text-[15px]">{SEASON_BANNER.description}</p>
      </div>

      <Button
        size="pill"
        render={<Link to={cta.to} search={cta.search} />}
        className="bg-highlight text-highlight-foreground hover:bg-highlight/90"
      >
        {SEASON_BANNER.ctaLabel}
      </Button>
    </section>
  );
}
