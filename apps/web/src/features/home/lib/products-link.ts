import type { ProductsSearch } from "@/features/catalog/schemas/products-search";

/** TanStack Router options for one of the home content's `/products?...` hrefs. */
export type ProductsLink = {
  to: "/products";
  search: ProductsSearch;
};

/**
 * Converts a `/products?...` href from the home content data into router options,
 * so hero and category links navigate client-side instead of reloading the page.
 * The data keeps plain hrefs (they are what the design's markup publishes); this
 * is the single place that turns them into a typed `Link`.
 */
export function toProductsLink(href: string): ProductsLink {
  const queryStart = href.indexOf("?");
  const params = new URLSearchParams(queryStart === -1 ? "" : href.slice(queryStart + 1));
  const search: ProductsSearch = {};

  const categories = params.getAll("cat");
  if (categories.length > 0) {
    search.cat = categories;
  }
  if (params.get("deal") === "true") {
    search.deal = true;
  }

  return { to: "/products", search };
}
