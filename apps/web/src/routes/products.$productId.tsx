import { createFileRoute } from "@tanstack/react-router";

// TODO(phase 6): replace the placeholder with the gallery, options and add-to-cart sections.
export const Route = createFileRoute("/products/$productId")({
  head: () => ({
    meta: [{ title: "Detalle del producto | Mr. Confetti" }],
  }),
  component: ProductDetailComponent,
});

function ProductDetailComponent() {
  return (
    <section>
      <h1>Detalle del producto</h1>
    </section>
  );
}
