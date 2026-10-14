const orderDateFormatter = new Intl.DateTimeFormat("es-ES", { dateStyle: "long" });

/** Formats the persisted ISO order date as a Spanish long date; falls back to the raw value when unparsable. */
export function formatOrderDate(isoDate: string): string {
  const parsed = Date.parse(isoDate);
  return Number.isNaN(parsed) ? isoDate : orderDateFormatter.format(parsed);
}
