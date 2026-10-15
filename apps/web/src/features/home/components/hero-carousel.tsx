import { Link } from "@tanstack/react-router";
import { Pause, Play } from "lucide-react";

import { HERO_SLIDES, HOME_SECTION_HEADINGS } from "@/features/home/data/home-content";
import { toProductsLink } from "@/features/home/lib/products-link";
import { useCarousel } from "@/hooks/use-carousel";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * The hero slider: one cross-fading banner per `HERO_SLIDES` entry, its dots and
 * the pause/play control the design adds so content can be stopped (WCAG 2.2.2).
 */
export function HeroCarousel() {
  const slideCount = HERO_SLIDES.length;
  const { index, goTo, isPlaying, toggle } = useCarousel({ count: slideCount });
  const prefersReducedMotion = usePrefersReducedMotion();
  // The control reflects whether the slides are actually advancing: autoplay is
  // suspended under reduced motion, even when the user has not paused it.
  const isAutoPlaying = isPlaying && !prefersReducedMotion;
  const hasMultipleSlides = slideCount > 1;

  return (
    <div
      aria-label={HOME_SECTION_HEADINGS.heroCarousel}
      aria-roledescription="carrusel"
      role="region"
      className="relative mt-4 min-h-[300px] lg:min-h-[460px] overflow-hidden rounded-lg bg-surface"
    >
      {HERO_SLIDES.map((slide, slideIndex) => {
        const isActive = slideIndex === index;
        const target = toProductsLink(slide.href);

        return (
          <div
            key={slide.id}
            aria-label={`${slideIndex + 1} de ${slideCount}`}
            aria-roledescription="diapositiva"
            aria-hidden={!isActive}
            role="group"
            className={cn(
              "absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none",
              isActive ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <Link
              to={target.to}
              search={target.search}
              tabIndex={isActive ? undefined : -1}
              className="block h-full w-full focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring"
            >
              <img
                src={slide.image}
                alt={slide.alt}
                width={slide.width}
                height={slide.height}
                loading={slideIndex === 0 ? "eager" : "lazy"}
                className="h-full w-full object-cover"
              />
            </Link>
          </div>
        );
      })}

      {hasMultipleSlides ? (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
          <div className="flex items-center">
            {HERO_SLIDES.map((slide, slideIndex) => {
              const isActive = slideIndex === index;

              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => {
                    goTo(slideIndex);
                  }}
                  aria-label={`Ir a la diapositiva ${slideIndex + 1}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn("grid size-6 place-items-center rounded-full", focusRing)}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "block h-2 rounded-full transition-[width,background-color] motion-reduce:transition-none",
                      isActive ? "w-5 bg-brand" : "w-2 bg-muted-foreground/60",
                    )}
                  />
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={isAutoPlaying ? "Pausar el carrusel" : "Reanudar el carrusel"}
            className={cn(
              "grid size-11 place-items-center rounded-full bg-background/80 text-foreground hover:text-brand",
              focusRing,
            )}
          >
            {isAutoPlaying ? (
              <Pause aria-hidden="true" className="size-4" strokeWidth={2} />
            ) : (
              <Play aria-hidden="true" className="size-4" strokeWidth={2} />
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
