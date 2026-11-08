// The id a location hash names, percent-decoded; null for no hash or one that doesn't decode.
export function hashTarget(hash: string): string | null {
  if (hash.length <= 1) return null
  try {
    return decodeURIComponent(hash.slice(1))
  } catch {
    return null
  }
}
