import { useId, useState } from "react";

import { Radio, RadioGroup } from "@/components/ui/radio-group";
import { PRODUCT_OPTION_COPY } from "@/features/catalog/data/product-detail-content";
import type { Product, ProductPack } from "@/features/catalog/schemas/product";

/** Hides the vendored radio indicator: the pill's own border and fill carry the state. */
const OPTION_CLASS = "[&_[data-slot=radio-indicator]]:hidden rounded-full px-4";

type ProductOptionSelectorProps = {
  product: Product;
  /**
   * Reports the selected pack so the caller can price the order. The selection
   * itself is local component state, never URL state.
   */
  onPackChange?: (pack: ProductPack) => void;
};

/**
 * The colour and pack radiogroups of the buy box.
 *
 * Both selections live in component state: the colour starts on the first swatch
 * and the pack on the base option (`packs[0]`). The pack is reported upwards
 * through `onPackChange` because the buy box's price and the sticky bar both
 * depend on its surcharge.
 */
export function ProductOptionSelector({ product, onPackChange }: ProductOptionSelectorProps) {
  const [colorIndex, setColorIndex] = useState(0);
  const [packIndex, setPackIndex] = useState(0);
  const colorLabelId = useId();
  const packLabelId = useId();

  const selectedColor = product.colors[colorIndex] ?? product.colors[0];

  return (
    <>
      <div className="mt-6">
        <h2 id={colorLabelId} className="mb-2 text-sm font-semibold">
          {PRODUCT_OPTION_COPY.colorLabel}:{" "}
          <span className="text-muted-foreground font-normal">{selectedColor.name}</span>
        </h2>
        <RadioGroup
          aria-labelledby={colorLabelId}
          value={colorIndex}
          onValueChange={(next) => {
            setColorIndex(next);
          }}
          className="flex-row flex-wrap gap-2"
        >
          {product.colors.map((color, index) => (
            <Radio key={color.name} value={index} className={OPTION_CLASS}>
              <span
                aria-hidden="true"
                style={{ backgroundColor: color.hex }}
                className="border-border block size-[18px] rounded-full border"
              />
              {color.name}
            </Radio>
          ))}
        </RadioGroup>
      </div>

      <div className="mt-6">
        <h2 id={packLabelId} className="mb-2 text-sm font-semibold">
          {PRODUCT_OPTION_COPY.packLabel}
        </h2>
        <RadioGroup
          aria-labelledby={packLabelId}
          value={packIndex}
          onValueChange={(next) => {
            setPackIndex(next);
            onPackChange?.(product.packs[next] ?? product.packs[0]);
          }}
          className="flex-row flex-wrap gap-2"
        >
          {product.packs.map((pack, index) => (
            <Radio key={pack.name} value={index} className={OPTION_CLASS}>
              {pack.name}
              {pack.extra !== 0 ? ` ${PRODUCT_OPTION_COPY.packSurcharge(pack.extra)}` : ""}
            </Radio>
          ))}
        </RadioGroup>
      </div>
    </>
  );
}
