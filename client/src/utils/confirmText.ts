// The typed confirmation in ConfirmModal (the admin page's Delete dialog): the text
// must be typed exactly, case included. NFC first, so an accented name typed as a
// letter plus a combining mark matches the precomposed one, and the ends trimmed,
// since a phone keyboard can add a space after a word.
export function confirmTextMatches(input: string, expected: string): boolean {
  const want = expected.normalize('NFC').trim()
  return want !== '' && input.normalize('NFC').trim() === want
}
