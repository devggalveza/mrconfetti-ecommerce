/** Reports whether the given id is in the favorites list. */
export function isFavorite(ids: readonly number[], id: number): boolean {
  return ids.includes(id);
}

/** Appends an absent id, removes a present one, preserving order. */
export function toggleFavorite(ids: readonly number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

/** Removes the given id from the favorites list. */
export function removeFavorite(ids: readonly number[], id: number): number[] {
  return ids.filter((value) => value !== id);
}

/** Returns an empty favorites list. */
export function clearFavorites(): number[] {
  return [];
}

/** Drops ids that are no longer part of the known catalog. */
export function pruneUnknownIds(ids: readonly number[], knownIds: ReadonlySet<number>): number[] {
  return ids.filter((id) => knownIds.has(id));
}
