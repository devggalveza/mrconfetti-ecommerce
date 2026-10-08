import { Checkbox } from "@/components/ui/checkbox";

type FilterOptionProps = {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Optional right-aligned result count; omitted for boolean rows. */
  count?: number;
};

/** One 44px filter row: a checkbox, its label and an optional muted count. */
export function FilterOption({ id, label, checked, onCheckedChange, count }: FilterOptionProps) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="size-[18px]"
      />
      <span>{label}</span>
      {count === undefined ? null : (
        <span className="ml-auto text-[13px] text-muted-foreground">{count}</span>
      )}
    </label>
  );
}
