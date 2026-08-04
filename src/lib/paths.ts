/** Reserved first-path segments that must not collide with dealer board URLs. */
export const RESERVED_PATH_SLUGS = new Set([
  "login",
  "register",
  "admin",
  "dashboard",
  "demo",
  "terms",
  "api",
  "favicon.ico",
]);

/** Board URL for a dealership slug, e.g. `/sunrise-honda`. */
export function boardPath(organizationSlug: string): string {
  const slug = organizationSlug.trim().replace(/^\/+|\/+$/g, "");
  if (!slug) return "/dashboard";
  return `/${slug}`;
}

export function isReservedPathSlug(slug: string): boolean {
  return RESERVED_PATH_SLUGS.has(slug.trim().toLowerCase());
}
