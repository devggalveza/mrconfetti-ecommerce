import { cn } from "@/lib/utils";

import { HELP_COPY } from "../data/help-copy";
import type { HelpTopic } from "../schemas/help-search";

export type HelpTocProps = {
  topics: readonly HelpTopic[];
  activeTopic: HelpTopic | undefined;
  onSelect: (topic: HelpTopic) => void;
};

const entryClass =
  "inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * The help table of contents: one list, rendered as a horizontal chip rail below
 * `md` and a sticky vertical column from `md` up. The mobile view reuses the same
 * list rather than a second copy, so no duplicate link pollutes the accessibility
 * tree.
 *
 * Entries are real anchors. A click only records the active topic; the browser
 * performs the fragment navigation, so keyboard, no-JS and stale-bookmark deep
 * links all keep working.
 */
export function HelpToc({ topics, activeTopic, onSelect }: HelpTocProps) {
  return (
    // The sticky box is the grid item itself, matching `/products`: an element
    // that is exactly as tall as its parent has no travel to stick with.
    <nav aria-label={HELP_COPY.tocLabel} className="md:sticky md:top-30">
      <ul className="flex gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-col md:overflow-visible">
        {topics.map((topic) => {
          const active = activeTopic === topic;
          return (
            <li key={topic} className="flex-none">
              <a
                href={`#${topic}`}
                onClick={() => {
                  onSelect(topic);
                }}
                // `location`, not `page` like `category-nav`: these entries point
                // at sections of the current document, not at other pages.
                aria-current={active ? "location" : undefined}
                className={cn(
                  entryClass,
                  active
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border text-muted-foreground hover:border-brand hover:text-brand",
                )}
              >
                {HELP_COPY.topics[topic]}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
