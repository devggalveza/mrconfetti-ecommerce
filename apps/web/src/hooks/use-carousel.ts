import { useCallback, useEffect, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/** Autoplay cadence, matching the 5s slider of the storefront design. */
const DEFAULT_INTERVAL_MS = 5000;

/** The index after `current`, wrapping to `0` at the end. `count <= 0` returns `0`. */
export function nextIndex(current: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  return (current + 1) % count;
}

/** The index before `current`, wrapping to the last one. `count <= 0` returns `0`. */
export function previousIndex(current: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  return (current - 1 + count) % count;
}

/** Clamps `index` into `0..count-1`, returning `0` for a non-positive `count`. */
export function clampIndex(index: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  return Math.min(Math.max(index, 0), count - 1);
}

export type UseCarouselOptions = {
  count: number;
  intervalMs?: number;
  autoPlay?: boolean;
};

export type Carousel = {
  index: number;
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
  isPlaying: boolean;
  toggle: () => void;
};

/**
 * Drives a cross-fading carousel: the active index, its manual controls and the
 * autoplay timer. Autoplay never runs under `prefers-reduced-motion: reduce` and
 * stays off for a single slide; `toggle` is the pause/play mechanism WCAG 2.2.2
 * requires for content that advances on its own.
 */
export function useCarousel({
  count,
  intervalMs = DEFAULT_INTERVAL_MS,
  autoPlay = true,
}: UseCarouselOptions): Carousel {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  // Bumped by `goTo` so re-selecting the current slide still restarts the timer,
  // mirroring the source's `restart()` after a dot click.
  const [restartToken, setRestartToken] = useState(0);

  const shouldAutoPlay = autoPlay && isPlaying && !prefersReducedMotion && count > 1;

  useEffect(() => {
    if (!shouldAutoPlay) {
      return;
    }

    const timer = setInterval(() => {
      setIndex(nextIndex(index, count));
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [shouldAutoPlay, intervalMs, count, index, restartToken]);

  const next = useCallback(() => {
    setIndex((current) => nextIndex(current, count));
  }, [count]);

  const previous = useCallback(() => {
    setIndex((current) => previousIndex(current, count));
  }, [count]);

  const goTo = useCallback(
    (nextSlide: number) => {
      setIndex(clampIndex(nextSlide, count));
      setRestartToken((token) => token + 1);
    },
    [count],
  );

  const toggle = useCallback(() => {
    setIsPlaying((playing) => !playing);
  }, []);

  return { index, next, previous, goTo, isPlaying, toggle };
}
