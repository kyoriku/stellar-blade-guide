// No page is named with a character that isn't printable text, so an address whose path holds
// one is the 404 page whatever else it says. Twin of is_text_segment in
// server/app/core/segments.py, which the server's path guard applies first to the path decoded
// the same way; their test tables match row for row.

// Python's str.isprintable(): no character in the Unicode categories Other or Separator but
// the space.
const UNPRINTABLE = /(?! )[\p{C}\p{Z}]/u
const HEX_PAIR = /^[0-9A-Fa-f]{2}$/
const UTF8_ENCODER = new TextEncoder()
const UTF8_DECODER = new TextDecoder('utf-8', { ignoreBOM: true })

// The path as uvicorn decodes it (Python's unquote): each %XX escape a byte, bytes that don't
// form UTF-8 as U+FFFD, and a % that starts no escape left as it is. Never throws.
function decodePath(pathname: string): string {
  const raw = UTF8_ENCODER.encode(pathname)
  const bytes = new Uint8Array(raw.length)
  let length = 0
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === 0x25 && HEX_PAIR.test(String.fromCharCode(raw[i + 1] ?? 0, raw[i + 2] ?? 0))) {
      bytes[length++] = parseInt(String.fromCharCode(raw[i + 1], raw[i + 2]), 16)
      i += 2
    } else {
      bytes[length++] = raw[i]
    }
  }
  return UTF8_DECODER.decode(bytes.subarray(0, length))
}

/** Whether an address's path, decoded as the server decodes it, is printable text. */
export function isTextPath(pathname: string): boolean {
  return !UNPRINTABLE.test(decodePath(pathname))
}
