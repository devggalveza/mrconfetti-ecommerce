import { describe, expect, it } from "vitest";

import { parseSearchParams, stringifySearchParams } from "./search-params";

describe("stringifySearchParams", () => {
  it("keeps a single-element list as a repeated key instead of JSON", () => {
    expect(stringifySearchParams({ cat: ["Globos"] })).toBe("?cat=Globos");
  });

  it("expands a multi-value list into repeated keys", () => {
    expect(stringifySearchParams({ cat: ["Globos", "Personajes"] })).toBe(
      "?cat=Globos&cat=Personajes",
    );
  });

  it("encodes accents and spaces", () => {
    expect(stringifySearchParams({ cat: ["Revelación de género"] })).toBe(
      "?cat=Revelaci%C3%B3n+de+g%C3%A9nero",
    );
  });

  it("writes booleans and numbers as scalars", () => {
    expect(stringifySearchParams({ deal: true, page: 2 })).toBe("?deal=true&page=2");
  });

  it("drops empty values and returns an empty string when nothing is left", () => {
    expect(stringifySearchParams({ q: "", cat: [], brand: undefined })).toBe("");
  });
});

describe("parseSearchParams", () => {
  it("collapses a single repeated key to a string", () => {
    expect(parseSearchParams("?cat=Globos")).toEqual({ cat: "Globos" });
  });

  it("collects a repeated key into an array", () => {
    expect(parseSearchParams("?cat=Globos&cat=Personajes")).toEqual({
      cat: ["Globos", "Personajes"],
    });
  });

  it("accepts a search string without the leading question mark", () => {
    expect(parseSearchParams("page=3")).toEqual({ page: "3" });
  });

  it("returns an empty object for an empty query", () => {
    expect(parseSearchParams("")).toEqual({});
  });
});

describe("round trip", () => {
  it("survives a list through stringify then parse", () => {
    const search = { cat: ["Graduación", "Globos"] };
    expect(parseSearchParams(stringifySearchParams(search))).toEqual(search);
  });

  it("returns scalars as strings, leaving coercion to validateSearch", () => {
    expect(parseSearchParams(stringifySearchParams({ deal: true, page: 2 }))).toEqual({
      deal: "true",
      page: "2",
    });
  });
});
