// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { QuantityStepper } from "@/features/catalog/components/quantity-stepper";
import { products } from "@/features/catalog/data/products";
import { quantityLimit } from "@/features/catalog/lib/product-detail";
import type { Product } from "@/features/catalog/schemas/product";
import { MAX_QUANTITY } from "@/lib/constants";

/** A row with more stock than the per-order ceiling, so the ceiling is `MAX_QUANTITY`. */
const bigStockProduct = products[0];

/** A row whose stock is below the per-order ceiling, so the ceiling is its stock. */
const smallStockProduct = products.find((product) => product.stock < MAX_QUANTITY);

/** The catalogue has no zero-stock row, so the unbuyable case is a fixture. */
const unbuyableProduct: Product = { ...products[0], id: 9001, stock: 0 };

if (smallStockProduct === undefined) {
  throw new Error("test fixture expects a product with stock below the per-order ceiling");
}

const SMALL_STOCK_LIMIT = quantityLimit(smallStockProduct);

afterEach(() => {
  cleanup();
});

describe("QuantityStepper", () => {
  it("disables the decrease control at the floor of one", () => {
    render(<QuantityStepper product={bigStockProduct} value={1} onChange={vi.fn()} />);

    const decrease = screen.getByRole("button", { name: "Reducir cantidad" });
    expect((decrease as HTMLButtonElement).disabled).toBe(true);
  });

  it("emits the next value when the increase control is used", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<QuantityStepper product={bigStockProduct} value={2} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Aumentar cantidad" }));

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("disables the increase control at the per-order ceiling", () => {
    render(
      <QuantityStepper product={bigStockProduct} value={quantityLimit(bigStockProduct)} onChange={vi.fn()} />,
    );

    const increase = screen.getByRole("button", { name: "Aumentar cantidad" });
    expect((increase as HTMLButtonElement).disabled).toBe(true);
  });

  it("takes the ceiling from the stock when the stock is below the per-order ceiling", () => {
    render(<QuantityStepper product={smallStockProduct} value={SMALL_STOCK_LIMIT} onChange={vi.fn()} />);

    expect(screen.getByText(String(SMALL_STOCK_LIMIT))).toBeTruthy();
    const increase = screen.getByRole("button", { name: "Aumentar cantidad" });
    expect((increase as HTMLButtonElement).disabled).toBe(true);
  });

  it("leaves both controls unusable when the ceiling is zero", () => {
    render(<QuantityStepper product={unbuyableProduct} value={1} onChange={vi.fn()} />);

    expect((screen.getByRole("button", { name: "Reducir cantidad" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(
      (screen.getByRole("button", { name: "Aumentar cantidad" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
