export type HelpFaqProps = {
  heading: string;
  intro?: string;
  items: readonly { question: string; answer: string }[];
};

/**
 * The FAQ list. Native `<details>` / `<summary>` is the disclosure primitive: the
 * plan forbids vendoring an accordion and the native element brings the keyboard
 * behaviour and the disclosure marker for free. The marker is deliberately left
 * visible — it is the affordance.
 *
 * The rows are separated the way the cart line list separates its rows.
 */
export function HelpFaq({ heading, intro, items }: HelpFaqProps) {
  return (
    <>
      <h2 className="text-xl font-bold">{heading}</h2>
      {intro === undefined ? null : (
        <p className="text-muted-foreground mt-2 text-sm">{intro}</p>
      )}

      <ul className="border-border divide-border mt-4 divide-y border-y">
        {items.map((item) => (
          <li key={item.question}>
            <details>
              <summary className="flex min-h-11 cursor-pointer items-center font-medium">
                {item.question}
              </summary>
              <p className="text-muted-foreground pb-3 text-sm">{item.answer}</p>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}
