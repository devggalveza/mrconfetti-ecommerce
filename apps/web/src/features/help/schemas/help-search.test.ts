import { describe, expect, it } from "vitest";

import { HELP_TOPICS, helpSearchSchema, type HelpTopic } from "./help-search";

describe("HELP_TOPICS", () => {
  it("keeps the seven anchored sections in table-of-contents order", () => {
    expect([...HELP_TOPICS]).toEqual([
      "ayuda",
      "pedido",
      "devoluciones",
      "contacto",
      "nosotros",
      "privacidad",
      "terminos",
    ]);
  });
});

describe("helpSearchSchema", () => {
  it("parses each of the seven topics", () => {
    for (const topic of HELP_TOPICS) {
      expect(helpSearchSchema.parse({ tema: topic })).toEqual({ tema: topic });
    }
  });

  it("parses a missing tema as undefined", () => {
    expect(helpSearchSchema.parse({}).tema).toBeUndefined();
  });

  it("strips an unknown tema instead of rejecting it", () => {
    for (const value of ["pizza", "", ["pedido", "contacto"], 42]) {
      expect(helpSearchSchema.parse({ tema: value }).tema).toBeUndefined();
    }
  });

  it("strips extra keys", () => {
    expect(helpSearchSchema.parse({ tema: "pedido", otro: "x" })).toEqual({
      tema: "pedido",
    });
  });

  it("works through the route-level .catch({}) guard", () => {
    expect(helpSearchSchema.catch({}).parse({ tema: "pedido" })).toEqual({
      tema: "pedido",
    });
    expect(helpSearchSchema.catch({}).parse({ tema: "pizza" })).toEqual({});
  });

  it("falls back to an empty search for completely malformed input", () => {
    expect(helpSearchSchema.catch({}).parse(null)).toEqual({});
    expect(helpSearchSchema.catch({}).parse("no soy un objeto")).toEqual({});
  });

  it("keeps the topic union narrow", () => {
    const topic: HelpTopic = "devoluciones";
    expect(HELP_TOPICS).toContain(topic);
  });
});
