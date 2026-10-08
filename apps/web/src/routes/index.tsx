import { createFileRoute } from "@tanstack/react-router";

// TODO(phase 4): replace the placeholder with the home sections (hero, rails, campaigns).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Inicio | Mr. Confetti" }],
  }),
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <section>
      <h1>Inicio</h1>
    </section>
  );
}
