import { describe, expect, it } from "vitest";

import { productsSearchSchema } from "./products-search";

describe("productsSearchSchema", () => {
  it("round-trips valid input and normalises a single string to an array", () => {
    expect(
      productsSearchSchema.parse({
        cat: "Globos",
        brand: ["Mr. Confetti"],
        q: "globo",
        deal: "1",
        sort: "pd",
        page: "2",
      }),
    ).toEqual({
      cat: ["Globos"],
      brand: ["Mr. Confetti"],
      q: "globo",
      deal: true,
      sort: "pd",
      page: 2,
    });
  });

  it("accepts a true boolean and \"true\" for deal", () => {
    expect(productsSearchSchema.parse({ deal: true }).deal).toBe(true);
    expect(productsSearchSchema.parse({ deal: "true" }).deal).toBe(true);
  });

  it("defaults sort and page when absent", () => {
    const parsed = productsSearchSchema.parse({});
    expect(parsed.sort).toBe("rel");
    expect(parsed.page).toBe(1);
  });

  it("falls back to the defaults for garbage input instead of throwing", () => {
    const parsed = productsSearchSchema.catch({}).parse({
      cat: 42,
      sort: "nope",
      page: "-3",
      deal: "yes",
    });
    expect(parsed.cat).toBeUndefined();
    expect(parsed.sort).toBe("rel");
    expect(parsed.page).toBe(1);
    expect(parsed.deal).toBeUndefined();
  });

  it("clamps a page below one", () => {
    expect(productsSearchSchema.parse({ page: "-3" }).page).toBe(1);
  });
});
