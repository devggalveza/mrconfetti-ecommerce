import { Link } from "@tanstack/react-router";
import { PartyPopper } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HERO_PROMO } from "@/features/home/data/home-content";
import { toProductsLink } from "@/features/home/lib/products-link";

/**
 * The tinted panel beside the hero slider: eyebrow, the sale percentage, its
 * description, the decorative icon and the CTA into the deals filter.
 */
export function HeroPromoCard() {
  const cta = toProductsLink(HERO_PROMO.href);

  return (
    <div className="flex min-h-[300px] flex-col justify-between gap-4 rounded-lg bg-linear-to-br from-brand/10 to-brand/25 p-6">
      <div>
        <p className="text-sm font-bold tracking-[0.1em] text-brand">{HERO_PROMO.eyebrow}</p>
        <p className="text-[64px] leading-none font-extrabold">
          {HERO_PROMO.percent}
          <sup className="text-[22px]">%</sup>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{HERO_PROMO.description}</p>
      </div>

      {/* Decorative art: the design hides it once the panel stacks under the slider. */}
      <PartyPopper
        aria-hidden="true"
        strokeWidth={1.3}
        className="h-40 w-full max-w-[300px] self-center text-brand/28 max-md:hidden"
      />

      <Button
        size="pill"
        render={<Link to={cta.to} search={cta.search} />}
        className="self-start"
      >
        {HERO_PROMO.ctaLabel}
      </Button>
    </div>
  );
}
