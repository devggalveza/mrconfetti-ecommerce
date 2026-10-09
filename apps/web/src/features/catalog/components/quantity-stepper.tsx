import { PRODUCT_QUANTITY_COPY } from "@/features/catalog/data/product-detail-content";
import { quantityLimit } from "@/features/catalog/lib/product-detail";
import type { Product } from "@/features/catalog/schemas/product";

type QuantityStepperProps = {
  /** The product whose stock sets the ceiling. */
  product: Product;
  /** Current quantity, owned by the caller. */
  value: number;
  /** Emits the next quantity; the caller keeps the value, so this stays presentational. */
  onChange: (next: number) => void;
};

/**
 * The quantity group: a labelled `role="group"`, a live value display and the two
 * buttons.
 *
 * The floor is 1 and the ceiling is `quantityLimit(product)`, so the decrease
 * control is disabled at the floor and the increase control at the ceiling. A
 * product with no stock yields a ceiling of `0`, which leaves both controls
 * disabled because the quantity can be neither raised nor lowered.
 */
export function QuantityStepper({ product, value, onChange }: QuantityStepperProps) {
  const limit = quantityLimit(product);
  const canDecrease = value > 1;
  const canIncrease = value < limit;

  return (
    <div
      role="group"
      aria-label={PRODUCT_QUANTITY_COPY.groupLabel}
      className="border-border flex h-12 items-center rounded-full border"
    >
      <button
        type="button"
        aria-label={PRODUCT_QUANTITY_COPY.decreaseLabel}
        disabled={!canDecrease}
        onClick={() => {
          onChange(Math.max(1, value - 1));
        }}
        className="hover:bg-brand-soft focus-visible:outline-ring grid size-11 place-items-center rounded-full text-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>

      <output aria-live="polite" className="min-w-8 text-center font-bold">
        {value}
      </output>

      <button
        type="button"
        aria-label={PRODUCT_QUANTITY_COPY.increaseLabel}
        disabled={!canIncrease}
        onClick={() => {
          onChange(Math.min(limit, value + 1));
        }}
        className="hover:bg-brand-soft focus-visible:outline-ring grid size-11 place-items-center rounded-full text-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
