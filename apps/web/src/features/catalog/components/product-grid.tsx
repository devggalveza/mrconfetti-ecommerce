import type { Product } from "@/features/catalog/schemas/product";

import { ProductCard } from "./product-card";

type ProductGridProps = {
  products: readonly Product[];
};

/**
 * The catalog results grid: 2 columns with a 12px gap on small screens, 3 from
 * 480px and 4 from 1200px, with a 24px row gap. The first four cards load
 * eagerly so the first row is never lazy-loaded.
 */
export function ProductGrid({ products }: ProductGridProps) {
  return (
    <ul className="grid list-none grid-cols-2 gap-3 min-[480px]:grid-cols-3 min-[480px]:gap-x-4 min-[480px]:gap-y-6 min-[1200px]:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id} className="min-w-0">
          <ProductCard product={product} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}
