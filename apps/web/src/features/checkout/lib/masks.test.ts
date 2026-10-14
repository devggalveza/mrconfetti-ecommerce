import { describe, expect, it } from "vitest";

import {
  digitsOnly,
  formatCardNumber,
  formatCvc,
  formatExpiry,
  formatPostalCode,
} from "./masks";

describe("digitsOnly", () => {
  it("strips every non-digit character", () => {
    expect(digitsOnly("12a3-4 5/6")).toBe("123456");
  });

  it("keeps only the leading digits up to maxLength", () => {
    expect(digitsOnly("1234567890", 4)).toBe("1234");
  });

  it("does not cap when maxLength is omitted", () => {
    expect(digitsOnly("123456789012345678901234")).toBe("123456789012345678901234");
  });

  it("returns an empty string when there are no digits", () => {
    expect(digitsOnly("abc")).toBe("");
    expect(digitsOnly("", 5)).toBe("");
  });
});

describe("formatCardNumber", () => {
  it("groups the digits in blocks of four", () => {
    expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
  });

  it("caps the digits at nineteen", () => {
    expect(formatCardNumber("41111111111111111111")).toBe("4111 1111 1111 1111 111");
  });

  it("ignores characters that are not digits", () => {
    expect(formatCardNumber("4111-1111 1111_1111")).toBe("4111 1111 1111 1111");
  });

  it("is stable when re-applied to its own output", () => {
    const formatted = formatCardNumber("4111111111111111");
    expect(formatCardNumber(formatted)).toBe(formatted);
  });
});

describe("formatExpiry", () => {
  it("returns an empty string for empty input", () => {
    expect(formatExpiry("")).toBe("");
  });

  it("keeps one digit without a separator", () => {
    expect(formatExpiry("1")).toBe("1");
  });

  it("keeps two digits without a trailing slash", () => {
    expect(formatExpiry("12")).toBe("12");
  });

  it("inserts a single slash after the second digit", () => {
    expect(formatExpiry("123")).toBe("12/3");
    expect(formatExpiry("1228")).toBe("12/28");
  });

  it("caps the digits at four", () => {
    expect(formatExpiry("122899")).toBe("12/28");
  });

  it("tolerates a user typing the separator", () => {
    expect(formatExpiry("12/")).toBe("12");
    expect(formatExpiry("1/2")).toBe("12");
    expect(formatExpiry("12/28")).toBe("12/28");
  });

  it("tolerates a user deleting the separator without doubling it", () => {
    expect(formatExpiry("12//3")).toBe("12/3");
    expect(formatExpiry("1/")).toBe("1");
    expect(formatExpiry("/")).toBe("");
  });

  it("is stable when re-applied to its own output", () => {
    for (const raw of ["", "1", "12", "123", "1228", "12/28", "12//3", "1/"]) {
      const formatted = formatExpiry(raw);
      expect(formatExpiry(formatted)).toBe(formatted);
    }
  });
});

describe("formatCvc", () => {
  it("keeps the digits and caps them at four", () => {
    expect(formatCvc("123")).toBe("123");
    expect(formatCvc("12345")).toBe("1234");
  });

  it("strips non-digits", () => {
    expect(formatCvc("1a2b3c")).toBe("123");
  });
});

describe("formatPostalCode", () => {
  it("keeps the digits and caps them at five", () => {
    expect(formatPostalCode("12345")).toBe("12345");
    expect(formatPostalCode("123456")).toBe("12345");
  });

  it("strips non-digits", () => {
    expect(formatPostalCode("12-345")).toBe("12345");
  });
});
