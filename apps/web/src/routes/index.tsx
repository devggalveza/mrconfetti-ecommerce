import { createFileRoute } from "@tanstack/react-router";

import { ProductRail } from "@/features/catalog/components/product-rail";
import { BrandsShowcase } from "@/features/home/components/brands-showcase";
import { CampaignBanners } from "@/features/home/components/campaign-banners";
import { CategoryGrid } from "@/features/home/components/category-grid";
import { HeroCarousel } from "@/features/home/components/hero-carousel";
import { SeasonBanner } from "@/features/home/components/season-banner";
import { HOME_RAILS } from "@/features/home/data/home-rails";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Inicio | Mr. Confetti" }],
  }),
  component: HomeComponent,
});

/**
 * Looks a rail up by id rather than by position, so reordering `HOME_RAILS`
 * cannot silently shuffle the page and a renamed rail fails loudly.
 */
function RailSection({ id }: { id: string }) {
  const rail = HOME_RAILS.find((entry) => entry.id === id);

  if (rail === undefined) {
    throw new Error(`HOME_RAILS is missing the "${id}" rail`);
  }

  return (
    <ProductRail
      products={rail.products}
      title={rail.title}
      headingId={rail.headingId}
      actionHref={rail.actionHref}
    />
  );
}

/**
 * The storefront home page. `__root.tsx` already renders `<main>` and the
 * 1240px `Container`, so this component only assembles the sections.
 */
function HomeComponent() {
  return (
    <>
      <HeroCarousel />

      <CategoryGrid />

      <RailSection id="deals" />

      <CampaignBanners />

      <BrandsShowcase />

      <RailSection id="graduacion" />
      <RailSection id="globos-foil" />

      <SeasonBanner />

      <RailSection id="cumpleanos" />
      <RailSection id="decoracion" />
    </>
  );
}
