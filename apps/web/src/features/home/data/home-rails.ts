import { products } from "@/features/catalog/data/products";
import { byCategory, dealsByDiscount } from "@/features/catalog/lib/selectors";
import type { Category, Product } from "@/features/catalog/schemas/product";

export type HomeRail = {
  id: string;
  title: string;
  headingId: string;
  /** The `/products?...` filter behind the rail's `Ver todo` link. */
  actionHref: string;
  products: readonly Product[];
};

/** Builds a category rail from one category list, so its filter and its contents cannot drift. */
function categoryRail(categories: readonly Category[]): Pick<HomeRail, "actionHref" | "products"> {
  return {
    actionHref: `/products?${categories.map((category) => `cat=${category}`).join("&")}`,
    products: byCategory(products, categories),
  };
}

/**
 * The five home rails in the order the design shows them. Every rail is derived
 * from the catalog through the selectors; nothing is hand-listed by product id.
 */
export const HOME_RAILS: ReadonlyArray<HomeRail> = [
  {
    id: "deals",
    title: "¡Las mejores ofertas de hoy para ti!",
    headingId: "home-rail-deals",
    actionHref: "/products?deal=true",
    products: dealsByDiscount(products),
  },
  {
    id: "graduacion",
    title: "Arcos de globos para graduación",
    headingId: "home-rail-graduacion",
    ...categoryRail(["Graduación"]),
  },
  {
    id: "globos-foil",
    title: "Globos foil y personajes",
    headingId: "home-rail-globos-foil",
    ...categoryRail(["Personajes", "Globos"]),
  },
  {
    id: "cumpleanos",
    title: "Cumpleaños, revelaciones y dulces",
    headingId: "home-rail-cumpleanos",
    ...categoryRail(["Cumpleaños", "Revelación de género", "Dulces y piñata"]),
  },
  {
    id: "decoracion",
    title: "Decoración para tu fiesta",
    headingId: "home-rail-decoracion",
    ...categoryRail(["Decoración", "Dulces y piñata", "Globos"]),
  },
];
