// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HelpTopic } from "@/features/help/schemas/help-search";

import { useHelpTopic } from "./use-help-topic";

// The reduced-motion preference is flipped per test; the real module has no other
// exports today, but `importOriginal` keeps any future export in place.
const motion = vi.hoisted(() => ({ reduced: false }));

vi.mock("@/hooks/use-prefers-reduced-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-prefers-reduced-motion")>();

  return {
    ...actual,
    usePrefersReducedMotion: (): boolean => motion.reduced,
  };
});

/** The real hook reads the section out of the document, so the node must exist. */
function addSection(id: HelpTopic): void {
  const section = document.createElement("section");
  section.id = id;
  document.body.append(section);
}

let scrollIntoView: ReturnType<typeof vi.fn>;

beforeEach(() => {
  scrollIntoView = vi.fn();
  Element.prototype.scrollIntoView = scrollIntoView as unknown as Element["scrollIntoView"];
  motion.reduced = false;
  document.body.innerHTML = "";
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useHelpTopic", () => {
  it("takes the initial active topic from the deep-linked tema", () => {
    addSection("pedido");

    const { result } = renderHook(() => useHelpTopic("pedido"));

    expect(result.current.activeTopic).toBe("pedido");
  });

  it("scrolls the deep-linked section exactly once on mount, until the next tema", () => {
    addSection("pedido");

    renderHook(() => useHelpTopic("pedido"));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("uses an instant move when reduced motion is preferred", () => {
    motion.reduced = true;
    addSection("pedido");

    renderHook(() => useHelpTopic("pedido"));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });

  it("scrolls nothing when tema is undefined", () => {
    const { result } = renderHook(() => useHelpTopic());

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(result.current.activeTopic).toBeUndefined();
  });

  it("changes the active topic through selectTopic", () => {
    addSection("pedido");

    const { result } = renderHook(() => useHelpTopic("pedido"));

    act(() => {
      result.current.selectTopic("contacto");
    });

    expect(result.current.activeTopic).toBe("contacto");
  });

  it("moves the active topic when a later defined tema arrives", () => {
    addSection("pedido");
    addSection("contacto");

    const { result, rerender } = renderHook(
      ({ tema }: { tema: HelpTopic | undefined }) => useHelpTopic(tema),
      { initialProps: { tema: "pedido" as HelpTopic | undefined } },
    );

    rerender({ tema: "contacto" });

    expect(result.current.activeTopic).toBe("contacto");
  });

  it("keeps the current selection when a rerender drops tema to undefined", () => {
    addSection("pedido");

    const { result, rerender } = renderHook(
      ({ tema }: { tema: HelpTopic | undefined }) => useHelpTopic(tema),
      { initialProps: { tema: "pedido" as HelpTopic | undefined } },
    );

    act(() => {
      result.current.selectTopic("contacto");
    });
    rerender({ tema: undefined });

    expect(result.current.activeTopic).toBe("contacto");
  });
});
