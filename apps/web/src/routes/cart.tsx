import { createFileRoute } from "@tanstack/react-router";

// TODO(phase 7): replace the placeholder with the cart lines, summary and coupon sections.
export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: "Carrito | Mr. Confetti" }],
  }),
  component: CartComponent,
});

function CartComponent() {
  return (
    <section>
      <h1>Carrito</h1>
    </section>
  );
}
