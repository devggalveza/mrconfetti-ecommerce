// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ANNOUNCEMENT_MESSAGES, AnnouncementBar } from "@/components/layout/announcement-bar";

const ROTATE_MS = 5000;

/** jsdom ships no `matchMedia`, so every case installs the exact answer it needs. */
function stubMatchMedia(reducedMotion: boolean) {
  const list = (query: string) => ({
    matches: reducedMotion,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
  window.matchMedia = list as unknown as typeof window.matchMedia;
}

/** The messages the bar is actually showing, read from the opacity class it toggles. */
function visibleMessages() {
  return ANNOUNCEMENT_MESSAGES.filter((message) =>
    screen.getByText(message).className.includes("opacity-100"),
  );
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("announcement bar", () => {
  it("keeps every message in the DOM and shows only the first one first", () => {
    render(<AnnouncementBar />);

    for (const message of ANNOUNCEMENT_MESSAGES) {
      expect(screen.getByText(message)).toBeTruthy();
    }
    expect(visibleMessages()).toEqual([ANNOUNCEMENT_MESSAGES[0]]);
  });

  it("advances one message every five seconds and wraps back to the first", () => {
    vi.useFakeTimers();
    render(<AnnouncementBar />);

    act(() => {
      vi.advanceTimersByTime(ROTATE_MS);
    });
    expect(visibleMessages()).toEqual([ANNOUNCEMENT_MESSAGES[1]]);

    act(() => {
      vi.advanceTimersByTime(ROTATE_MS * 2);
    });
    expect(visibleMessages()).toEqual([ANNOUNCEMENT_MESSAGES[0]]);
  });

  it("stops on the first message when the user prefers reduced motion", () => {
    stubMatchMedia(true);
    vi.useFakeTimers();
    render(<AnnouncementBar />);

    act(() => {
      vi.advanceTimersByTime(ROTATE_MS * 4);
    });
    expect(visibleMessages()).toEqual([ANNOUNCEMENT_MESSAGES[0]]);
  });

  it("names the strip for assistive technology", () => {
    render(<AnnouncementBar />);

    const bar = screen.getByRole("complementary", { name: "Anuncios" });
    expect(visibleMessages()).toEqual([ANNOUNCEMENT_MESSAGES[0]]);
    expect(bar.contains(screen.getByText(ANNOUNCEMENT_MESSAGES[0]))).toBe(true);
  });
});
