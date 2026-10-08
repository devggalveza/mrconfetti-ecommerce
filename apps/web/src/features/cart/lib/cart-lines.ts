import { MAX_QUANTITY } from "@/lib/constants";

export type CartLine = { id: number; quantity: number };

/** Clamps any quantity into the valid `1..MAX_QUANTITY` range. */
function clampQuantity(quantity: number): number {
  const truncated = Math.trunc(quantity);
  if (!Number.isFinite(truncated)) {
    return 1;
  }
  return Math.min(MAX_QUANTITY, Math.max(1, truncated));
}

/** Appends a new line or increases an existing one, keeping its position. */
export function addLine(lines: readonly CartLine[], id: number, quantity = 1): CartLine[] {
  const index = lines.findIndex((line) => line.id === id);
  if (index === -1) {
    return [...lines, { id, quantity: clampQuantity(quantity) }];
  }
  return lines.map((line, position) =>
    position === index ? { ...line, quantity: clampQuantity(line.quantity + quantity) } : line,
  );
}

/** Sets a line quantity, clamped to `1..MAX_QUANTITY`; absent ids are left alone. */
export function setLineQuantity(
  lines: readonly CartLine[],
  id: number,
  quantity: number,
): CartLine[] {
  return lines.map((line) =>
    line.id === id ? { ...line, quantity: clampQuantity(quantity) } : line,
  );
}

/** Removes the line with the given id. */
export function removeLine(lines: readonly CartLine[], id: number): CartLine[] {
  return lines.filter((line) => line.id !== id);
}

/** Returns an empty line list. */
export function clearLines(): CartLine[] {
  return [];
}

/** Sums the quantities of every line. */
export function countUnits(lines: readonly CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

/** Reports whether the cart contains a line for the given id. */
export function hasLine(lines: readonly CartLine[], id: number): boolean {
  return lines.some((line) => line.id === id);
}

/** Drops lines whose id is no longer part of the known catalog. */
export function pruneUnknownIds(
  lines: readonly CartLine[],
  knownIds: ReadonlySet<number>,
): CartLine[] {
  return lines.filter((line) => knownIds.has(line.id));
}
