import { createFileRoute } from "@tanstack/react-router";

// TODO(phase 9): replace the placeholder with the FAQ, tracking and contact sections.
export const Route = createFileRoute("/ayuda")({
  head: () => ({
    meta: [{ title: "Ayuda | Mr. Confetti" }],
  }),
  component: HelpComponent,
});

function HelpComponent() {
  return (
    <section>
      <h1>Ayuda</h1>
    </section>
  );
}
