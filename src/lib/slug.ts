// Zero-flag regex utility: lowercase, alphanumeric, single-hyphen separators,
// no leading/trailing hyphens. Appends SKU for uniqueness.
export function toSeoSlug(name: string, sku: string): string {
  const base = `${name} ${sku}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return base;
}
