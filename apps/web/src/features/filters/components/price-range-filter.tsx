import { useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { toAmount } from "@/features/catalog/schemas/products-search";

type PriceRangeFilterProps = {
  minPrice: number | null;
  maxPrice: number | null;
  onCommit: (min: number | null, max: number | null) => void;
};

type PriceDraft = { min: string; max: string };

function toText(value: number | null): string {
  return value === null ? "" : String(value);
}

/**
 * The three-column price row. What the visitor types stays local until blur or
 * Enter, so a half-typed number never triggers a navigation; a committed value
 * flows back in through the props and an external clear is reflected at once.
 */
export function PriceRangeFilter({ minPrice, maxPrice, onCommit }: PriceRangeFilterProps) {
  const headingId = useId();
  const minId = useId();
  const maxId = useId();
  const [draft, setDraft] = useState<PriceDraft | null>(null);

  const minText = draft?.min ?? toText(minPrice);
  const maxText = draft?.max ?? toText(maxPrice);

  function commitDraft(): void {
    if (draft === null) {
      return;
    }
    onCommit(toAmount(draft.min.trim()) ?? null, toAmount(draft.max.trim()) ?? null);
    setDraft(null);
  }

  return (
    <section aria-labelledby={headingId} className="py-3">
      <h3 id={headingId} className="mb-2 text-[15px] font-semibold">
        Precio (Q.)
      </h3>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <label htmlFor={minId} className="text-xs text-muted-foreground">
            Mínimo
          </label>
          <Input
            id={minId}
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="0"
            value={minText}
            onChange={(event) => {
              setDraft({ min: event.target.value, max: maxText });
            }}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitDraft();
              }
            }}
            className="h-11 rounded-sm px-3 text-sm"
          />
        </div>

        <span aria-hidden="true" className="pt-5 text-muted-foreground">
          –
        </span>

        <div className="flex flex-col gap-0.5">
          <label htmlFor={maxId} className="text-xs text-muted-foreground">
            Máximo
          </label>
          <Input
            id={maxId}
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="600"
            value={maxText}
            onChange={(event) => {
              setDraft({ min: minText, max: event.target.value });
            }}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitDraft();
              }
            }}
            className="h-11 rounded-sm px-3 text-sm"
          />
        </div>
      </div>
    </section>
  );
}
