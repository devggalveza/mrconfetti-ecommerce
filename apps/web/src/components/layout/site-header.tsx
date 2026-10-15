import { Link } from "@tanstack/react-router";

import { CategoryNav } from "@/components/layout/category-nav";
import { Container } from "@/components/layout/container";
import { HeaderActions } from "@/components/layout/header-actions";
import { SearchBar } from "@/components/layout/search-bar";

/** The storefront header: sticky bar with logo, search, actions and category rail. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background">
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
      <CategoryNav />
    </header>
  );
}
