// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCarousel } from "@/hooks/use-carousel";

/** A `change` listener registered through the stubbed `matchMedia`. */
type MediaQueryListener = (event: MediaQueryListEvent) => void;

const listeners = new Set<MediaQueryListener>();

/** Replaces `matchMedia` with a stub whose query always reports `matches`. */
function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: MediaQueryListener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: MediaQueryListener) => {
      listeners.delete(listener);
    },
    addListener: (listener: MediaQueryListener) => {
      listeners.add(listener);
    },
    removeListener: (listener: MediaQueryListener) => {
      listeners.delete(listener);
    },
    dispatchEvent: () => false,
  }));
}

afterEach(() => {
  listeners.clear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("useCarousel", () => {
  it("advances the index on every interval, wrapping around", () => {
    vi.useFakeTimers();
    stubMatchMedia(false);
    const { result } = renderHook(() => useCarousel({ count: 3, intervalMs: 5000 }));

    expect(result.current.index).toBe(0);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.index).toBe(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.index).toBe(2);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.index).toBe(0);
  });

  it("stops advancing while paused and resumes on a second toggle", () => {
    vi.useFakeTimers();
    stubMatchMedia(false);
    const { result } = renderHook(() => useCarousel({ count: 3, intervalMs: 5000 }));

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isPlaying).toBe(false);

    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(result.current.index).toBe(0);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.index).toBe(1);
  });

  it("clamps goTo into range", () => {
    vi.useFakeTimers();
    stubMatchMedia(false);
    const { result } = renderHook(() => useCarousel({ count: 3, intervalMs: 5000 }));

    act(() => {
      result.current.goTo(9);
    });
    expect(result.current.index).toBe(2);

    act(() => {
      result.current.goTo(-4);
    });
    expect(result.current.index).toBe(0);
  });

  it("restarts the timer when goTo is called", () => {
    vi.useFakeTimers();
    stubMatchMedia(false);
    const { result } = renderHook(() => useCarousel({ count: 3, intervalMs: 5000 }));

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    act(() => {
      result.current.goTo(0);
    });

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.index).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.index).toBe(1);
  });

  it("never autoplays when prefers-reduced-motion reports reduce", () => {
    vi.useFakeTimers();
    stubMatchMedia(true);
    const { result } = renderHook(() => useCarousel({ count: 3, intervalMs: 5000 }));

    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(result.current.index).toBe(0);
  });

  it("does not autoplay with fewer than two slides", () => {
    vi.useFakeTimers();
    stubMatchMedia(false);
    const { result } = renderHook(() => useCarousel({ count: 1, intervalMs: 5000 }));

    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(result.current.index).toBe(0);
    expect(result.current.isPlaying).toBe(true);
  });

  it("does not autoplay when autoPlay is off", () => {
    vi.useFakeTimers();
    stubMatchMedia(false);
    const { result } = renderHook(() => useCarousel({ count: 3, autoPlay: false }));

    expect(result.current.isPlaying).toBe(false);

    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(result.current.index).toBe(0);
  });
});
