import { createFileRoute } from "@tanstack/react-router";

// TODO(phase 7): replace the placeholder with the favorites grid, remove and clear actions.
export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [{ title: "Favoritos | Mr. Confetti" }],
  }),
  component: FavoritesComponent,
});

function FavoritesComponent() {
  return (
    <section>
      <h1>Favoritos</h1>
    </section>
  );
}
