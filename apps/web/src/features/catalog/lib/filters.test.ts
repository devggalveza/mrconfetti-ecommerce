import { describe, expect, it } from "vitest";

import { PRODUCTS_PER_PAGE } from "@/lib/constants";

import { products } from "../data/products";
import {
  activeFilterChips,
  applyFilters,
  clearAllFilters,
  clearChip,
  countActiveFilters,
  DEFAULT_FILTERS,
  paginateResults,
  readFilters,
  toSearch,
  toggleValue,
  type CatalogFilters,
} from "./filters";

const fullyPopulated: CatalogFilters = {
  categories: ["Globos", "Personajes"],
  brands: ["Mr. Confetti"],
  minPrice: 100,
  maxPrice: 200,
  minRating: 4.5,
  freeShippingOnly: true,
  dealsOnly: true,
  query: "globo",
  sort: "pd",
  page: 3,
};

describe("DEFAULT_FILTERS", () => {
  it("starts with no facets, an open price range and the first page", () => {
    expect(DEFAULT_FILTERS).toEqual({
      categories: [],
      brands: [],
      minPrice: null,
      maxPrice: null,
      minRating: 0,
      freeShippingOnly: false,
      dealsOnly: false,
      query: "",
      sort: "rel",
      page: 1,
    });
  });
});

describe("readFilters", () => {
  it("drops an unknown category and brand while keeping the known ones", () => {
    const filters = readFilters({
      cat: ["Globos", "No existe"],
      brand: ["Fiesta Pro", "Marca Fantasma"],
    });

    expect(filters.categories).toEqual(["Globos"]);
    expect(filters.brands).toEqual(["Fiesta Pro"]);
  });

  it("keeps a repeated value only once", () => {
    expect(readFilters({ cat: ["Globos", "Globos"] }).categories).toEqual(["Globos"]);
  });

  it("clamps minRating into 0..5 and page to at least 1", () => {
    expect(readFilters({ minRating: 7 }).minRating).toBe(5);
    expect(readFilters({ minRating: -3 }).minRating).toBe(0);
    expect(readFilters({ minRating: Number.NaN }).minRating).toBe(0);
    expect(readFilters({ page: 0 }).page).toBe(1);
    expect(readFilters({ page: -4 }).page).toBe(1);
  });

  it("drops a negative or non-finite price bound", () => {
    expect(readFilters({ minPrice: -10 }).minPrice).toBeNull();
    expect(readFilters({ minPrice: Number.NaN }).minPrice).toBeNull();
    expect(readFilters({ maxPrice: Number.POSITIVE_INFINITY }).maxPrice).toBeNull();
  });

  it("ignores a reversed price range instead of building an empty one", () => {
    const filters = readFilters({ minPrice: 300, maxPrice: 100 });

    expect(filters.minPrice).toBeNull();
    expect(filters.maxPrice).toBeNull();
  });

  it("reads a valid one-sided range", () => {
    expect(readFilters({ maxPrice: 200 })).toMatchObject({ minPrice: null, maxPrice: 200 });
    expect(readFilters({ minPrice: 100 })).toMatchObject({ minPrice: 100, maxPrice: null });
  });

  it("defaults every facet for an empty search object", () => {
    expect(readFilters({})).toEqual(DEFAULT_FILTERS);
  });

  it("carries every valid facet through", () => {
    expect(
      readFilters({
        cat: ["Globos"],
        brand: ["Mr. Confetti"],
        minPrice: 100,
        maxPrice: 200,
        minRating: 4.5,
        freeShipping: true,
        deal: true,
        q: "globo",
        sort: "pa",
        page: 2,
      }),
    ).toEqual({ ...fullyPopulated, categories: ["Globos"], sort: "pa", page: 2 });
  });
});

describe("toSearch", () => {
  const urlFilters: CatalogFilters = {
    ...DEFAULT_FILTERS,
    categories: ["Globos", "Personajes"],
    brands: ["Mr. Confetti"],
    minPrice: 100,
    maxPrice: 300,
    minRating: 4.5,
    freeShippingOnly: true,
    query: "globo",
    dealsOnly: true,
    sort: "pd",
    page: 3,
  };

  it("round-trips a fully-populated URL filter set through readFilters unchanged", () => {
    expect(readFilters(toSearch(urlFilters))).toEqual(urlFilters);
  });

  it("omits the defaults so a filtered URL stays short and readable", () => {
    expect(toSearch(DEFAULT_FILTERS)).toEqual({});
  });

  it("writes only the values that differ from the defaults", () => {
    expect(toSearch({ ...DEFAULT_FILTERS, page: 2, sort: "val" })).toEqual({
      sort: "val",
      page: 2,
    });
  });

  it("mirrors every facet into the products search contract", () => {
    expect(toSearch(fullyPopulated)).toEqual({
      cat: ["Globos", "Personajes"],
      brand: ["Mr. Confetti"],
      q: "globo",
      deal: true,
      sort: "pd",
      page: 3,
      minPrice: 100,
      maxPrice: 200,
      minRating: 4.5,
      freeShipping: true,
    });
  });
});

describe("applyFilters", () => {
  it("returns all 36 products in input order for the defaults", () => {
    const result = applyFilters(products, DEFAULT_FILTERS);

    expect(result).toHaveLength(36);
    expect(result.map((product) => product.id)).toEqual(products.map((product) => product.id));
  });

  it("narrows to the products of one category", () => {
    const result = applyFilters(products, { ...DEFAULT_FILTERS, categories: ["Globos"] });

    expect(result).toHaveLength(6);
    expect(result.every((product) => product.category === "Globos")).toBe(true);
  });

  it("combines category, brand, price, rating, shipping and deals", () => {
    const result = applyFilters(products, {
      ...DEFAULT_FILTERS,
      categories: ["Globos"],
      brands: ["Mr. Confetti"],
      minPrice: 100,
      maxPrice: 150,
      minRating: 4.5,
      freeShippingOnly: true,
      dealsOnly: true,
    });

    expect(result.map((product) => product.id)).toEqual([12, 24, 36]);
  });

  it("still applies the query", () => {
    const result = applyFilters(products, { ...DEFAULT_FILTERS, query: "graduacion" });

    expect(result).toHaveLength(9);
    expect(result.every((product) => product.category === "Graduación")).toBe(true);
  });

  it("applies the sort last", () => {
    const result = applyFilters(products, {
      ...DEFAULT_FILTERS,
      categories: ["Globos"],
      sort: "pd",
    });

    expect(result.map((product) => product.id)).toEqual([22, 24, 10, 12, 34, 36]);
  });

  it("does not mutate the input array", () => {
    const before = products.map((product) => product.id);

    applyFilters(products, { ...fullyPopulated, sort: "pa" });

    expect(products.map((product) => product.id)).toEqual(before);
  });
});

describe("paginateResults", () => {
  it("returns the first page with the shared page size", () => {
    const first = paginateResults(products, 1);

    expect(first.perPage).toBe(PRODUCTS_PER_PAGE);
    expect(first.items).toHaveLength(12);
    expect(first.page).toBe(1);
    expect(first.total).toBe(36);
    expect(first.totalPages).toBe(3);
  });

  it("clamps an out-of-range page", () => {
    expect(paginateResults(products, 99).page).toBe(3);
    expect(paginateResults(products, 0).page).toBe(1);
  });

  it("accepts an explicit page size", () => {
    expect(paginateResults(products, 1, 5).items).toHaveLength(5);
  });
});

describe("countActiveFilters", () => {
  it("is zero for the defaults", () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
  });

  it("ignores sort, query and page", () => {
    expect(
      countActiveFilters({ ...DEFAULT_FILTERS, sort: "val", query: "globo", page: 4 }),
    ).toBe(0);
  });

  it("counts a chip per selected value and per active facet", () => {
    expect(countActiveFilters(fullyPopulated)).toBe(7);
    expect(countActiveFilters({ ...DEFAULT_FILTERS, minPrice: 100 })).toBe(1);
  });
});

describe("toggleValue", () => {
  const list: readonly string[] = ["a", "b"];

  it("appends a missing value", () => {
    expect(toggleValue(list, "c")).toEqual(["a", "b", "c"]);
  });

  it("removes a present value and preserves order", () => {
    expect(toggleValue(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("never mutates the input", () => {
    const result = toggleValue(list, "c");

    expect(result).not.toBe(list);
    expect(list).toEqual(["a", "b"]);
  });
});

describe("activeFilterChips", () => {
  it("is empty for the defaults", () => {
    expect(activeFilterChips(DEFAULT_FILTERS)).toEqual([]);
  });

  it("lists one chip per selected value and per active facet, in Spanish", () => {
    expect(activeFilterChips(fullyPopulated)).toEqual([
      { key: "category:Globos", label: "Globos" },
      { key: "category:Personajes", label: "Personajes" },
      { key: "brand:Mr. Confetti", label: "Mr. Confetti" },
      { key: "price", label: "Q.100 - Q.200" },
      { key: "rating", label: "4,5 o más" },
      { key: "shipping", label: "Envío gratis" },
      { key: "deals", label: "Solo ofertas" },
    ]);
  });

  it("labels an open price range from the bound that is set", () => {
    expect(activeFilterChips({ ...DEFAULT_FILTERS, maxPrice: 200 })).toEqual([
      { key: "price", label: "Hasta Q.200" },
    ]);
    expect(activeFilterChips({ ...DEFAULT_FILTERS, minPrice: 100 })).toEqual([
      { key: "price", label: "Desde Q.100" },
    ]);
  });
});

describe("clearChip", () => {
  it("removes exactly one chip and resets the page", () => {
    const cleared = clearChip(fullyPopulated, "category:Globos");

    expect(cleared.categories).toEqual(["Personajes"]);
    expect(cleared.page).toBe(1);
    expect(cleared.brands).toEqual(["Mr. Confetti"]);
    expect(cleared.minPrice).toBe(100);
  });

  it("clears each facet key", () => {
    expect(clearChip(fullyPopulated, "brand:Mr. Confetti").brands).toEqual([]);
    expect(clearChip(fullyPopulated, "price")).toMatchObject({ minPrice: null, maxPrice: null });
    expect(clearChip(fullyPopulated, "rating").minRating).toBe(0);
    expect(clearChip(fullyPopulated, "shipping").freeShippingOnly).toBe(false);
    expect(clearChip(fullyPopulated, "deals").dealsOnly).toBe(false);
  });

  it("is a no-op for an unknown key", () => {
    expect(clearChip(fullyPopulated, "no-existe")).toEqual(fullyPopulated);
  });
});

describe("clearAllFilters", () => {
  it("resets every facet and the page but keeps the query and the sort", () => {
    expect(clearAllFilters({ ...fullyPopulated, page: 5 })).toEqual({
      ...DEFAULT_FILTERS,
      query: fullyPopulated.query,
      sort: fullyPopulated.sort,
    });
  });
});
