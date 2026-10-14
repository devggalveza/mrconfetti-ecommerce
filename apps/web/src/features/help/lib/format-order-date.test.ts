import { describe, expect, it } from "vitest";

import { formatOrderDate } from "./format-order-date";

const ISO_DATE = "2026-01-15T10:00:00.000Z";

describe("formatOrderDate", () => {
  it("formats an ISO date with the same Spanish long formatter", () => {
    // The expectation is computed with the same formatter construction rather than
    // hardcoding a locale string, so the test cannot drift from the ICU data.
    const expected = new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(
      new Date(ISO_DATE),
    );

    expect(formatOrderDate(ISO_DATE)).toBe(expected);
  });

  it("returns an unparsable value unchanged", () => {
    expect(formatOrderDate("no es una fecha")).toBe("no es una fecha");
    expect(formatOrderDate("")).toBe("");
  });
});
