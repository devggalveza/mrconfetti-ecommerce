import { useCallback, useEffect, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

import type { HelpTopic } from "../schemas/help-search";

/**
 * Owns the active help topic. A defined `?tema=` deep link always wins over the
 * current selection, so a footer link that only changes the query string still
 * moves the marker; an `undefined` `tema` (bare `/ayuda`, or a stripped unknown
 * value) leaves the selection alone, so a TOC click is not undone by a re-render.
 * `selectTopic` only changes the active entry, because a click on the table of
 * contents is a plain `<a href="#…">` and the browser performs the move.
 *
 * A deep-linked `tema` scrolls its section into view once, through the shared
 * reduced-motion preference so the move is never smooth for a user who asked for
 * less motion.
 */
export function useHelpTopic(tema?: HelpTopic): {
  activeTopic: HelpTopic | undefined;
  selectTopic: (topic: HelpTopic) => void;
} {
  const [activeTopic, setActiveTopic] = useState<HelpTopic | undefined>(tema);
  // Adjusting state during render is React's documented pattern for reacting to a
  // prop change without a second effect: remember the last prop and, when it
  // changes, follow it during this render. A defined value always wins; an
  // undefined one never clears the current selection.
  const [previousTema, setPreviousTema] = useState<HelpTopic | undefined>(tema);
  if (tema !== previousTema) {
    setPreviousTema(tema);
    if (tema !== undefined) {
      setActiveTopic(tema);
    }
  }
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (tema === undefined || typeof document === "undefined") {
      return;
    }

    const section = document.getElementById(tema);
    section?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    // Keyed on the deep-linked topic only, so a preference change never scrolls
    // the page a second time.
  }, [tema]);

  const selectTopic = useCallback((topic: HelpTopic): void => {
    setActiveTopic(topic);
  }, []);

  return { activeTopic, selectTopic };
}
