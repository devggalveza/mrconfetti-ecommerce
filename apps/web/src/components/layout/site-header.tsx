import { Link, useRouterState } from "@tanstack/react-router";

import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { CategoryNav } from "@/components/layout/category-nav";
import { Container } from "@/components/layout/container";
import { HeaderActions } from "@/components/layout/header-actions";
import { SearchBar } from "@/components/layout/search-bar";

/**
 * The storefront header: a sticky bar with the logo, search and actions on
 * every route, preceded by the non-sticky announcement strip. The category rail
 * is a home-page affordance, so it renders only when the current path is `/`;
 * every other route keeps the bare bar.
 */
export function SiteHeader() {
  // Read the path from the router's own state so the server render agrees with
  // the client one instead of waiting for hydration.
  const isHome = useRouterState({ select: (state) => state.location.pathname === "/" });

  return (
    <>
      {/* Outside the sticky header on purpose: it scrolls away, the bar stays. */}
      <AnnouncementBar />
      {/* Chrome sits above the page content's floating controls: see the stacking
          scale in DESIGN_SYSTEM.md. */}
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <Container>
          <div className="flex h-20 items-center gap-6 max-md:h-auto max-md:flex-wrap max-md:gap-2 max-md:py-4">
            <Link
              to="/"
              aria-label="Inicio Mr. Confetti"
              className="shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <img
                src="/mrconfetti-logo.webp"
                alt="Mr. Confetti"
                width={48}
                height={48}
                className="size-12 rounded-lg"
              />
            </Link>
            <SearchBar />
            <HeaderActions />
          </div>
        </Container>
        {isHome ? <CategoryNav /> : null}
      </header>
    </>
  );
}
