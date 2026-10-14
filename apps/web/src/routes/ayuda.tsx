import { createFileRoute, useSearch } from "@tanstack/react-router";

import { HelpFaq } from "@/features/help/components/help-faq";
import { HelpSection } from "@/features/help/components/help-section";
import { HelpToc } from "@/features/help/components/help-toc";
import { HelpTracking } from "@/features/help/components/help-tracking";
import { HELP_COPY, type StaticHelpTopic } from "@/features/help/data/help-copy";
import { useHelpTopic } from "@/features/help/hooks/use-help-topic";
import { HELP_TOPICS, helpSearchSchema, type HelpTopic } from "@/features/help/schemas/help-search";

export const Route = createFileRoute("/ayuda")({
  validateSearch: (search: Record<string, unknown>) => helpSearchSchema.catch({}).parse(search),
  head: () => ({
    meta: [
      { title: HELP_COPY.title },
      { name: "description", content: HELP_COPY.description },
    ],
  }),
  component: HelpComponent,
});

/** Narrows the ordered topic tuple to the five authored static sections. */
function isStaticTopic(topic: HelpTopic): topic is StaticHelpTopic {
  return topic !== "ayuda" && topic !== "pedido";
}

/** The static sections, derived so their anchors and the table of contents cannot drift. */
const STATIC_TOPICS: readonly StaticHelpTopic[] = HELP_TOPICS.filter(isStaticTopic);

/**
 * The `/ayuda` page: one document with seven anchored sections and a table of
 * contents that is a sticky column on desktop and a chip rail on mobile.
 *
 * The `h1` and every static section render on the server; only the tracking panel
 * reads persisted state and sits behind its own loading status. The active topic
 * comes from the typed `?tema=` search param, so deep links keep working.
 */
function HelpComponent() {
  const { tema } = useSearch({ from: "/ayuda" });
  const { activeTopic, selectTopic } = useHelpTopic(tema);

  return (
    <div className="grid items-start gap-8 md:grid-cols-[14rem_minmax(0,1fr)]">
      <HelpToc topics={HELP_TOPICS} activeTopic={activeTopic} onSelect={selectTopic} />

      <div className="flex min-w-0 flex-col gap-10">
        <section id="ayuda" className="scroll-mt-30">
          <h1 className="text-2xl font-bold">{HELP_COPY.heading}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{HELP_COPY.intro}</p>

          <div className="mt-8">
            <HelpFaq
              heading={HELP_COPY.faq.heading}
              intro={HELP_COPY.faq.intro}
              items={HELP_COPY.faq.items}
            />
          </div>
        </section>

        <HelpTracking />

        {STATIC_TOPICS.map((topic) => (
          <HelpSection
            key={topic}
            id={topic}
            title={HELP_COPY.sections[topic].title}
            blocks={HELP_COPY.sections[topic].blocks}
          />
        ))}
      </div>
    </div>
  );
}
