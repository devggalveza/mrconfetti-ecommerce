import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { PRODUCT_TABS_COPY } from "@/features/catalog/data/product-detail-content";
import type { Product } from "@/features/catalog/schemas/product";

import { ProductReviews } from "./product-reviews";

/** Stable values of the three detail tabs, in render order. */
export const PRODUCT_TAB_VALUES = {
  description: "description",
  specs: "specs",
  reviews: "reviews",
} as const;

/** One of the detail tabs; `description` is the default the caller starts on. */
export type ProductTabValue = (typeof PRODUCT_TAB_VALUES)[keyof typeof PRODUCT_TAB_VALUES];

type ProductDetailTabsProps = {
  product: Product;
  /** Active tab, owned by the caller so the rating row can jump to the reviews. */
  value: ProductTabValue;
  onValueChange: (value: ProductTabValue) => void;
};

/**
 * The detail tabs below the buy box: description, specifications and reviews.
 *
 * The tab value is controlled, which lets the buy box's review-count link select
 * the reviews tab. The first tab is the default the caller starts on, and the
 * reviews label interpolates the product's aggregate count. The list itself carries
 * the section's own name, so it is a named landmark in its own right and needs no
 * invented label.
 */
export function ProductDetailTabs({ product, value, onValueChange }: ProductDetailTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        onValueChange(next as ProductTabValue);
      }}
    >
      <TabsList aria-label={PRODUCT_TABS_COPY.sectionLabel}>
        <TabsTab value={PRODUCT_TAB_VALUES.description}>{PRODUCT_TABS_COPY.description}</TabsTab>
        <TabsTab value={PRODUCT_TAB_VALUES.specs}>{PRODUCT_TABS_COPY.specs}</TabsTab>
        <TabsTab value={PRODUCT_TAB_VALUES.reviews}>
          {PRODUCT_TABS_COPY.reviews(product.reviews)}
        </TabsTab>
      </TabsList>

      <TabsPanel value={PRODUCT_TAB_VALUES.description} className="max-w-[820px] py-6">
        <p className="text-muted-foreground mb-4">{product.description}</p>
        <ul className="text-muted-foreground ml-6 grid list-disc gap-2">
          {product.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </TabsPanel>

      <TabsPanel value={PRODUCT_TAB_VALUES.specs} className="max-w-[820px] py-6">
        <table className="border-border w-full border-collapse text-sm">
          <tbody>
            {product.specs.map((spec) => (
              <tr key={spec.label} className="border-border border-b">
                <th
                  scope="row"
                  className="text-muted-foreground w-2/5 px-4 py-3 text-left font-medium"
                >
                  {spec.label}
                </th>
                <td className="px-4 py-3 text-left">{spec.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TabsPanel>

      <TabsPanel value={PRODUCT_TAB_VALUES.reviews} className="max-w-[820px] py-6">
        <ProductReviews product={product} />
      </TabsPanel>
    </Tabs>
  );
}
