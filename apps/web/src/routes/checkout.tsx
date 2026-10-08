import { createFileRoute } from "@tanstack/react-router";

// TODO(phase 8): replace the placeholder with the checkout steps, address and payment forms.
export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "Finalizar compra | Mr. Confetti" }],
  }),
  component: CheckoutComponent,
});

function CheckoutComponent() {
  return (
    <section>
      <h1>Finalizar compra</h1>
    </section>
  );
}
