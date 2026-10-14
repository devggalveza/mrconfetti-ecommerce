import type { HelpBlock, StaticHelpTopic } from "../data/help-copy";

export type HelpSectionProps = {
  id: StaticHelpTopic;
  title: string;
  blocks: readonly HelpBlock[];
};

/**
 * One authored help section. It is purely presentational: the block model is the
 * only input, so there is no lookup, no string sniffing and no
 * `dangerouslySetInnerHTML`. The contact email stays plain text inside its list
 * item because the block model has no link kind.
 */
export function HelpSection({ id, title, blocks }: HelpSectionProps) {
  return (
    <section id={id} className="scroll-mt-30">
      <h2 className="text-xl font-bold">{title}</h2>

      {blocks.map((block, index) =>
        block.kind === "paragraph" ? (
          <p key={`paragraph-${index}`} className="text-muted-foreground mt-2 text-sm">
            {block.text}
          </p>
        ) : (
          <ul
            key={`list-${index}`}
            className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm"
          >
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ),
      )}
    </section>
  );
}
