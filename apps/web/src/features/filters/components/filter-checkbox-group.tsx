import { useId } from "react";

import { FilterOption } from "./filter-option";

export type FilterCheckboxOption<T extends string> = {
  value: T;
  label: string;
  count: number;
};

type FilterCheckboxGroupProps<T extends string> = {
  title: string;
  options: ReadonlyArray<FilterCheckboxOption<T>>;
  selected: readonly T[];
  onToggle: (value: T) => void;
};

/**
 * A titled facet group of checkbox rows. The heading id comes from `useId`, so
 * mounting the panel twice cannot produce duplicate ids.
 */
export function FilterCheckboxGroup<T extends string>({
  title,
  options,
  selected,
  onToggle,
}: FilterCheckboxGroupProps<T>) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="py-3">
      <h3 id={headingId} className="mb-2 text-[15px] font-semibold">
        {title}
      </h3>
      <div>
        {options.map((option) => (
          <FilterOption
            key={option.value}
            id={`${headingId}-${option.value}`}
            label={option.label}
            count={option.count}
            checked={selected.includes(option.value)}
            onCheckedChange={() => {
              onToggle(option.value);
            }}
          />
        ))}
      </div>
    </section>
  );
}
