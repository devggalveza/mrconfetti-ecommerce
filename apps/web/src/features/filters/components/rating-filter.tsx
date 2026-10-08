import { useId } from "react";

import { Radio, RadioGroup } from "@/components/ui/radio-group";

type RatingFilterProps = {
  minRating: number;
  onChange: (rating: number) => void;
};

/** The three rating thresholds of the design, with their star cluster size. */
const RATING_OPTIONS = [
  { value: 0, label: "Todas", stars: 0 },
  { value: 4.5, label: "4,5 o más", stars: 5 },
  { value: 4, label: "4 o más", stars: 4 },
] as const;

/** The minimum-rating facet, built on the shared radio primitive. */
export function RatingFilter({ minRating, onChange }: RatingFilterProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="py-3">
      <h3 id={headingId} className="mb-2 text-[15px] font-semibold">
        Valoración
      </h3>
      <RadioGroup value={minRating} onValueChange={onChange} className="gap-2">
        {RATING_OPTIONS.map((option) => (
          <Radio key={option.value} value={option.value} className="min-h-11">
            {option.stars > 0 ? (
              <span aria-hidden="true" className="text-warning">
                {"★".repeat(option.stars)}
              </span>
            ) : null}
            {option.label}
          </Radio>
        ))}
      </RadioGroup>
    </section>
  );
}
