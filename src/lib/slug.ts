/** Lowercase hyphenated id from a display name. */
export function slugifyName(name: string, fallback = "item"): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || fallback;
}

/** Unique slug among an existing set (appends -2, -3, …). */
export function uniqueSlug(
  name: string,
  used: Set<string>,
  fallback = "item"
): string {
  let id = slugifyName(name, fallback);
  if (!used.has(id)) return id;
  let n = 2;
  while (used.has(`${id}-${n}`)) n += 1;
  return `${id}-${n}`;
}
