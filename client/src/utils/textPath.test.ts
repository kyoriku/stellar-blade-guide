import { describe, it, expect } from 'vitest'
import { isTextPath } from './textPath'

// Row for row with the path tests in server/tests/test_unprintable_segments.py, whose values
// come already decoded.

describe('isTextPath', () => {
  it('passes printable text, whatever the script', () => {
    for (const path of ['/levels/eidos-7', '/', '/Jos%C3%A9', '/%E4%BD%A0%E5%A5%BD', '/a%20b', '/%EF%BF%BD']) {
      expect(isTextPath(path), path).toBe(true)
    }
  })

  it('refuses a control character or line break anywhere in the path', () => {
    for (const escape of ['%0A', '%0D', '%0D%0A', '%09', '%0B', '%0C', '%1C', '%1D', '%1E', '%1F', '%00', '%7F',
      '%C2%85', '%E2%80%A8', '%E2%80%A9']) {
      for (const path of [`/levels${escape}`, `/lev${escape}els`, `/${escape}`, `/levels/eidos-7${escape}`]) {
        expect(isTextPath(path), path).toBe(false)
      }
    }
  })

  it('refuses the invisible characters printable text never holds', () => {
    // A no-break space, a zero-width space, a soft hyphen, a byte order mark (alone too).
    for (const path of ['/a%C2%A0b', '/a%E2%80%8Bb', '/a%C2%ADb', '/a%EF%BB%BFb', '/%EF%BB%BF']) {
      expect(isTextPath(path), path).toBe(false)
    }
  })

  it('passes an escape that does not decode, read as the server reads it', () => {
    // Bytes that don't form UTF-8 read as U+FFFD, and a % that starts no escape stays as it is.
    for (const path of ['/levels/%E2%80', '/100%', '/%', '/levels/%E0%A4%A']) {
      expect(isTextPath(path), path).toBe(true)
    }
  })

  it('refuses a line break beside an escape that does not decode', () => {
    expect(isTextPath('/lev%0Aels%')).toBe(false)
  })
})
