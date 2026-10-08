import { createFileRoute } from "@tanstack/react-router";

import { CategoryGrid } from "@/features/home/components/category-grid";
import { HeroCarousel } from "@/features/home/components/hero-carousel";
import { HeroPromoCard } from "@/features/home/components/hero-promo-card";
import { HOME_SECTION_HEADINGS } from "@/features/home/data/home-content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Inicio | Mr. Confetti" }],
  }),
  component: HomeComponent,
});

/**
 * The storefront home page. `__root.tsx` already renders `<main>` and the
 * 1240px `Container`, so this component only assembles the sections.
 */
function HomeComponent() {
  return (
    <>
      <section
        aria-label={HOME_SECTION_HEADINGS.heroPromotions}
        className="mt-4 grid grid-cols-[2fr_1fr] gap-4 max-lg:grid-cols-1"
      >
        <HeroCarousel />
        <HeroPromoCard />
      </section>

      <CategoryGrid />

      {/* TODO(phase 3): product rails */}
      {/* TODO(phase 4): campaigns, brands and season banner */}
    </>
  );
}
