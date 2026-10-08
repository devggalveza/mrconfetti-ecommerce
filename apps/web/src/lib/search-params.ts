/**
 * Query-string codec for the router.
 *
 * TanStack Router's default codec runs every value through `JSON.stringify`, so a
 * filter list such as `{ cat: ["Globos"] }` is emitted as `?cat=%5B%22Globos%22%5D`.
 * That is unreadable, unshareable and nothing like the URLs the storefront design
 * publishes (`/products?cat=Globos`).
 *
 * These two functions replace the default codec: lists become repeated keys and
 * scalars stay as they are, so the query string keeps the shape a person would
 * type by hand.
 */

/** Parses a query string into a plain object, collapsing single values and collecting repeats. */
export function parseSearchParams(searchStr: string): Record<string, unknown> {
  const params = new URLSearchParams(
    searchStr.startsWith("?") ? searchStr.slice(1) : searchStr,
  );
  const result: Record<string, unknown> = {};

  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }

  return result;
}

/** Serialises search state into a query string, expanding arrays into repeated keys. */
export function stringifySearchParams(search: Record<string, unknown>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== "") {
          params.append(key, String(item));
        }
      }
      continue;
    }

    params.append(key, String(value));
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}
