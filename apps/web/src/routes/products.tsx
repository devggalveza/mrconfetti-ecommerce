import { createFileRoute } from "@tanstack/react-router";

import { productsSearchSchema } from "@/features/catalog/schemas/products-search";

// TODO(phase 5): replace the placeholder with filters, product grid and pagination.
export const Route = createFileRoute("/products")({
  validateSearch: (search: Record<string, unknown>) =>
    productsSearchSchema.catch({}).parse(search),
  head: () => ({
    meta: [{ title: "Todos los productos | Mr. Confetti" }],
  }),
  component: ProductsComponent,
});

function ProductsComponent() {
  return (
    <section>
      <h1>Todos los productos</h1>
    </section>
  );
}
