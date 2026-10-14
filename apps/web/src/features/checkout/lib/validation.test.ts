import { describe, expect, it } from "vitest";

import {
  CHECKOUT_FIELD_ORDER,
  type CheckoutErrors,
  type CheckoutFieldName,
  type CheckoutValues,
  firstErrorField,
  requiredFieldsFor,
  validateCheckout,
  validateField,
} from "./validation";

/** A Guatemala-local date so the month boundary does not depend on the CI time zone. */
const now = new Date(2026, 0, 15);

const baseValues: CheckoutValues = {
  email: "ana@example.com",
  firstName: "Ana",
  lastName: "López",
  phone: "12345678",
  address: "Zona 1",
  city: "Guatemala",
  postalCode: "01001",
  cardNumber: "4242424242424242",
  cardName: "Ana López",
  cardExpiry: "01/27",
  cardCvc: "123",
  bizumPhone: "87654321",
  paypalEmail: "ana@example.com",
};

describe("validateField", () => {
  it("returns required for an empty value", () => {
    expect(validateField("email", "", now)).toBe("required");
    expect(validateField("firstName", "   ", now)).toBe("required");
    expect(validateField("cardCvc", "", now)).toBe("required");
  });

  it("accepts a pragmatic e-mail shape", () => {
    expect(validateField("email", "ana@example.com", now)).toBeNull();
    expect(validateField("paypalEmail", "ana@example.com", now)).toBeNull();
    expect(validateField("email", "ana@example", now)).toBe("email");
    expect(validateField("email", "ana example.com", now)).toBe("email");
  });

  it("requires exactly eight digits after stripping spaces and dashes", () => {
    expect(validateField("phone", "1234 5678", now)).toBeNull();
    expect(validateField("phone", "1234-5678", now)).toBeNull();
    expect(validateField("bizumPhone", "1234 5678", now)).toBeNull();
    expect(validateField("phone", "1234567", now)).toBe("phone");
    expect(validateField("phone", "123456789", now)).toBe("phone");
    expect(validateField("phone", "1234567a", now)).toBe("phone");
  });

  it("requires exactly five digits for the postal code", () => {
    expect(validateField("postalCode", "01001", now)).toBeNull();
    expect(validateField("postalCode", "1234", now)).toBe("postalCode");
    expect(validateField("postalCode", "123456", now)).toBe("postalCode");
    expect(validateField("postalCode", "1234a", now)).toBe("postalCode");
  });

  it("requires thirteen to nineteen digits for the card number", () => {
    expect(validateField("cardNumber", "4242 4242 4242 4242", now)).toBeNull();
    expect(validateField("cardNumber", "4242424242424", now)).toBe("cardNumberChecksum");
    expect(validateField("cardNumber", "424242424242", now)).toBe("cardNumber");
    expect(validateField("cardNumber", "41111111111111111111", now)).toBe("cardNumber");
    expect(validateField("cardNumber", "4242 4242 4242 424a", now)).toBe("cardNumber");
  });

  it("rejects a card number that fails the Luhn checksum", () => {
    expect(validateField("cardNumber", "4242424242424241", now)).toBe("cardNumberChecksum");
  });

  it("accepts the other mainstream card lengths", () => {
    expect(validateField("cardNumber", "378282246310005", now)).toBeNull();
    expect(validateField("cardNumber", "5555555555554444", now)).toBeNull();
  });

  it("requires MM/AA with a month from 01 to 12", () => {
    expect(validateField("cardExpiry", "01/27", now)).toBeNull();
    expect(validateField("cardExpiry", "12/26", now)).toBeNull();
    expect(validateField("cardExpiry", "13/26", now)).toBe("cardExpiry");
    expect(validateField("cardExpiry", "00/26", now)).toBe("cardExpiry");
    expect(validateField("cardExpiry", "1/26", now)).toBe("cardExpiry");
    expect(validateField("cardExpiry", "1226", now)).toBe("cardExpiry");
  });

  it("treats the current month as still valid", () => {
    expect(validateField("cardExpiry", "01/26", now)).toBeNull();
    expect(validateField("cardExpiry", "12/25", now)).toBe("cardExpired");
  });

  it("requires three or four digits for the CVC", () => {
    expect(validateField("cardCvc", "123", now)).toBeNull();
    expect(validateField("cardCvc", "1234", now)).toBeNull();
    expect(validateField("cardCvc", "12", now)).toBe("cardCvc");
    expect(validateField("cardCvc", "12345", now)).toBe("cardCvc");
    expect(validateField("cardCvc", "12a", now)).toBe("cardCvc");
  });

  it("only checks the required rule for a name-shaped field", () => {
    expect(validateField("firstName", "Ana", now)).toBeNull();
    expect(validateField("address", "Zona 1", now)).toBeNull();
    expect(validateField("cardName", "Ana López", now)).toBeNull();
  });
});

describe("requiredFieldsFor", () => {
  it("always requires the contact and address fields, in the declared order", () => {
    expect(requiredFieldsFor("paypal")).toEqual([
      "email",
      "firstName",
      "lastName",
      "phone",
      "address",
      "city",
      "postalCode",
      "paypalEmail",
    ]);
  });

  it("adds the card fields only for card payments", () => {
    expect(requiredFieldsFor("card")).toEqual([
      "email",
      "firstName",
      "lastName",
      "phone",
      "address",
      "city",
      "postalCode",
      "cardNumber",
      "cardName",
      "cardExpiry",
      "cardCvc",
    ]);
  });

  it("adds bizumPhone only for bizum payments", () => {
    expect(requiredFieldsFor("bizum")).toContain("bizumPhone");
    expect(requiredFieldsFor("bizum")).not.toContain("cardNumber");
    expect(requiredFieldsFor("bizum")).not.toContain("paypalEmail");
  });
});

describe("validateCheckout", () => {
  it("returns no errors for a complete, valid card checkout", () => {
    expect(validateCheckout(baseValues, "card", now)).toEqual({});
  });

  it("only validates the fields the method requires", () => {
    const errors = validateCheckout(baseValues, "paypal", now);
    expect(errors).toEqual({});
    expect(errors).not.toHaveProperty("cardNumber");
    expect(errors).not.toHaveProperty("bizumPhone");
  });

  it("flags every empty required field of the method", () => {
    const empty: CheckoutValues = {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      cardNumber: "",
      cardName: "",
      cardExpiry: "",
      cardCvc: "",
      bizumPhone: "",
      paypalEmail: "",
    };
    const errors = validateCheckout(empty, "card", now);
    expect(Object.keys(errors).sort()).toEqual(
      [
        "address",
        "cardCvc",
        "cardExpiry",
        "cardName",
        "cardNumber",
        "city",
        "email",
        "firstName",
        "lastName",
        "phone",
        "postalCode",
      ].sort(),
    );
    expect(errors.email).toBe("required");
  });

  it("keeps a shape error for an invalid but present field", () => {
    const errors = validateCheckout({ ...baseValues, cardCvc: "12" }, "card", now);
    expect(errors.cardCvc).toBe("cardCvc");
  });

  it("does not validate a field the method does not require", () => {
    const errors = validateCheckout({ ...baseValues, cardNumber: "nope" }, "bizum", now);
    expect(errors).toEqual({});
  });
});

describe("firstErrorField", () => {
  it("returns null when there are no errors", () => {
    expect(firstErrorField({})).toBeNull();
  });

  it("walks the declared field order, not the insertion order", () => {
    const errors: CheckoutErrors = { cardCvc: "cardCvc", email: "email", city: "required" };
    expect(firstErrorField(errors)).toBe("email");
  });

  it("returns the earliest field of the whole order", () => {
    const errors: CheckoutErrors = { paypalEmail: "email", postalCode: "postalCode" };
    expect(firstErrorField(errors)).toBe("postalCode");
  });

  it("uses an order that covers every field exactly once", () => {
    expect([...CHECKOUT_FIELD_ORDER].sort()).toEqual(
      (
        [
          "email",
          "firstName",
          "lastName",
          "phone",
          "address",
          "city",
          "postalCode",
          "cardNumber",
          "cardName",
          "cardExpiry",
          "cardCvc",
          "bizumPhone",
          "paypalEmail",
        ] satisfies CheckoutFieldName[]
      ).sort(),
    );
    expect(new Set(CHECKOUT_FIELD_ORDER).size).toBe(CHECKOUT_FIELD_ORDER.length);
  });
});
