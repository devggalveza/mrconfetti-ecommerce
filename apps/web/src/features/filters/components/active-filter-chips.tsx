import { X } from "lucide-react";

type ActiveFilterChipsProps = {
  chips: ReadonlyArray<{ key: string; label: string }>;
  onRemove: (key: string) => void;
};

/**
 * The wrapping row of removable chips. It renders nothing when no facet is
 * active, and each chip's remove control expands its 44px touch target with a
 * pseudo-element so the pill can stay compact.
 */
export function ActiveFilterChips({ chips, onRemove }: ActiveFilterChipsProps) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand-soft pr-1.5 pl-3.5 text-[13px] font-semibold text-brand"
        >
          {chip.label}
          <button
            type="button"
            aria-label={`Quitar filtro ${chip.label}`}
            onClick={() => {
              onRemove(chip.key);
            }}
            className="relative grid size-7 place-items-center rounded-full transition-colors after:absolute after:-inset-x-2 after:-inset-y-2 hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        </span>
      ))}
    </div>
  );
}
