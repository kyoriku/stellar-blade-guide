import { describe, it, expect } from 'vitest'
import { lowercasePagePath } from './lowercasePath'

// Row for row with test_lowercase_page_path_matches_the_client in
// server/tests/test_seo_head.py, whose paths come already decoded.

// The Kelvin sign, which toLowerCase() turns into k.
const KELVIN = '%E2%84%AA'

describe('lowercasePagePath', () => {
  it('lowercases a page path holding a capital, without its trailing slash', () => {
    for (const [path, lower] of [
      ['/UPGRADES/weapon-cores', '/upgrades/weapon-cores'],
      ['/upgrades/WEAPON-CORES', '/upgrades/weapon-cores'],
      ['/Levels/Eidos-7', '/levels/eidos-7'],
      ['/LEVELS/', '/levels'],
      ['/LEVELS//', '/levels'],
      ['/APIS/x', '/apis/x'],
    ]) {
      expect(lowercasePagePath(path), path).toBe(lower)
    }
  })

  it('reads the path decoded, as the server does', () => {
    expect(lowercasePagePath('/levels/%45idos-7')).toBe('/levels/eidos-7')
    expect(lowercasePagePath('/LEVELS%2Feidos-7')).toBe('/levels/eidos-7')
  })

  it('leaves a lowercase path alone, a trailing slash included', () => {
    for (const path of ['/levels/eidos-7', '/levels/eidos-7/', '/']) {
      expect(lowercasePagePath(path), path).toBeNull()
    }
  })

  it('never rewrites an address into the API', () => {
    for (const path of ['/API/levels', '/Api']) {
      expect(lowercasePagePath(path), path).toBeNull()
    }
  })

  it('leaves anything but letters, digits, hyphens and single slashes as it is', () => {
    for (const path of [
      '/ROBOTS.TXT', '/Levels/Eidos_7', '//LEVELS', '/LEVELS//eidos-7',
      `/walkthroughs/ni${KELVIN}${KELVIN}e-dlc`, `/Walkthroughs/ni${KELVIN}${KELVIN}e-dlc`,
      '/Levels/%',
    ]) {
      expect(lowercasePagePath(path), path).toBeNull()
    }
  })
})
