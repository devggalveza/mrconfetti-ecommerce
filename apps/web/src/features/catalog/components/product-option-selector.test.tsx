// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductOptionSelector } from "@/features/catalog/components/product-option-selector";
import { PRODUCT_OPTION_COPY } from "@/features/catalog/data/product-detail-content";
import { products } from "@/features/catalog/data/products";

/** A row with more than one swatch and a paid pack, so both groups have a choice. */
const product = products[0];
const [firstColor, secondColor] = product.colors;
const [basePack] = product.packs;
const paidPack = product.packs.find((pack) => pack.extra !== 0);

if (firstColor === undefined || secondColor === undefined || basePack === undefined) {
  throw new Error("test fixture expects at least two colours and one pack");
}

if (paidPack === undefined) {
  throw new Error("test fixture expects a pack with a surcharge");
}

afterEach(() => {
  cleanup();
});

describe("ProductOptionSelector", () => {
  it("starts on the first swatch and the base pack", () => {
    render(<ProductOptionSelector product={product} />);

    const colors = screen.getByRole("radiogroup", { name: /^Color/ });
    expect(
      within(colors).getByRole("radio", { name: firstColor.name }).getAttribute("aria-checked"),
    ).toBe("true");

    const packs = screen.getByRole("radiogroup", { name: PRODUCT_OPTION_COPY.packLabel });
    expect(
      within(packs).getByRole("radio", { name: basePack.name }).getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("switches the colour on selection", async () => {
    const user = userEvent.setup();
    render(<ProductOptionSelector product={product} />);

    const colors = screen.getByRole("radiogroup", { name: /^Color/ });
    await user.click(within(colors).getByRole("radio", { name: secondColor.name }));

    expect(
      within(colors).getByRole("radio", { name: secondColor.name }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      within(colors).getByRole("radio", { name: firstColor.name }).getAttribute("aria-checked"),
    ).toBe("false");
    expect(
      screen.getByRole("heading", {
        name: `${PRODUCT_OPTION_COPY.colorLabel}: ${secondColor.name}`,
      }),
    ).toBeTruthy();
  });

  it("renders the pack name with its surcharge and reports the selection upwards", async () => {
    const user = userEvent.setup();
    const onPackChange = vi.fn();
    render(<ProductOptionSelector product={product} onPackChange={onPackChange} />);

    const packs = screen.getByRole("radiogroup", { name: PRODUCT_OPTION_COPY.packLabel });
    const paidOptionName = `${paidPack.name} ${PRODUCT_OPTION_COPY.packSurcharge(paidPack.extra)}`;

    expect(within(packs).getByRole("radio", { name: paidOptionName })).toBeTruthy();

    await user.click(within(packs).getByRole("radio", { name: paidOptionName }));

    expect(
      within(packs).getByRole("radio", { name: paidOptionName }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(onPackChange).toHaveBeenCalledWith(paidPack);
  });
});
