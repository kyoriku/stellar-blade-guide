import { describe, it, expect } from 'vitest'
import { stripLinks, descriptionPlainText, plainText } from './descriptionText'

// Characters kept out of the source as literals.
const EN = String.fromCharCode(0x2013)
const EM = String.fromCharCode(0x2014)
const LS = String.fromCharCode(0x2028)

describe('stripLinks', () => {
  it('turns a link into its label', () => {
    expect(stripLinks('From the [[collectibles/camps#statue-camp|Statue Camp]], go left.'))
      .toBe('From the Statue Camp, go left.')
  })

  it('handles several links in one text', () => {
    expect(stripLinks('After [[walkthroughs/side-quests/oblivion|Oblivion]], see [[levels/xion|Xion]].'))
      .toBe('After Oblivion, see Xion.')
  })

  it('leaves brackets that are not a link alone, as the server does', () => {
    expect(stripLinks('No link [[here]] or [[there|]].')).toBe('No link [[here]] or [[there|]].')
  })
})

describe('descriptionPlainText', () => {
  it('strips links from a text description', () => {
    expect(descriptionPlainText({ type: 'text', content: 'By the [[levels/eidos-7|Eidos 7 page]].' }))
      .toBe('By the Eidos 7 page.')
  })

  it('joins a list description', () => {
    expect(descriptionPlainText({ type: 'list', items: ['Step one', '[[levels/xion|Xion]]'] })).toBe('Step one, Xion')
  })

  it('is undefined when there is nothing to say', () => {
    expect(descriptionPlainText(undefined)).toBeUndefined()
    expect(descriptionPlainText({ type: 'text', content: '' })).toBeUndefined()
  })

  it('reads a list as one line, with its links as labels', () => {
    expect(descriptionPlainText({ type: 'text', content: WEAPON_CORE })).toBe(
      'Available to purchase from D1G-g2r. Costs 2 Damaged Weapon Cores each, with 2 in stock. ' +
      'Damaged Weapon Cores are dropped by certain side quest and overworld bosses: Corrupter in Wasteland Basin, ' +
      'Gigas at Oil Storage Facility (Urgent Information), Brute in Forbidden Area (Life of the Scavengers), ' +
      'Stalker at Solar Tower in the Great Desert (Reboot!!!), ' +
      'Abaddon in Buried Ruins (An Eye for an Eye, a Tooth for a Tooth), ' +
      'Behemoth in Northern Great Desert (Encounter)')
  })

  it('leaves text without a list as it was', () => {
    expect(descriptionPlainText({ type: 'text', content: 'First [[levels/xion|Xion]].\n\nSecond.' }))
      .toBe('First Xion.\n\nSecond.')
    expect(descriptionPlainText({ type: 'text', content: '\n\n' })).toBe('\n\n')
  })
})

// The same cases, in the same order, as textBlocks.test.ts and text_blocks' and
// plain_text's in server/tests/test_search_text.py.
const CASES: [string, string, string][] = [
  ['no newline', 'Buy them.', 'Buy them.'],
  ['empty', '', ''],
  ['blank lines only', '\n\n', '\n\n'],
  ['two paragraphs', 'First.\n\nSecond.', 'First.\n\nSecond.'],
  ['an intro and a list', 'Bosses:\n\n- a\n- b', 'Bosses: a, b'],
  ['only a list', '- a\n- b', 'a, b'],
  ['a list, then text', 'Intro:\n\n- a\n- b\n\nThen.', 'Intro: a, b Then.'],
  ['a single "- " line', 'Intro\n\n- a', 'Intro\n\n- a'],
  ['a hyphen mid-line', 'left - right\nup - down', 'left - right\nup - down'],
  ['"-" with no space', '-a\n-b', '-a\n-b'],
  ['a list after a single newline', 'Intro:\n- a\n- b', 'Intro:\n- a\n- b'],
  ['a newline after the last item', '- a\n- b\n', '- a\n- b\n'],
  ['a blank line holding a space', 'Intro\n \n- a\n- b', 'Intro\n \n- a\n- b'],
  ['en and em dash lines', `${EN} a\n${EM} b`, `${EN} a\n${EM} b`],
  ['a nested list', '- a\n  - b', '- a\n  - b'],
  ['three newlines before a list', 'Intro\n\n\n- a\n- b', 'Intro\n\n\n- a\n- b'],
  ['trailing spaces', '- a  \n- b ', 'a  , b '],
  ['an empty item', '- \n- b', ', b'],
  ['a carriage return', '- a\r\n- b', 'a\r, b'],
  ['a Unicode line separator', `- a${LS}- b`, `- a${LS}- b`],
  ['a link in an item', '- [[levels/xion|Xion]]\n- b', '[[levels/xion|Xion]], b'],
  ['a paragraph with its own newline beside a list', 'One\ntwo\n\n- a\n- b', 'One two a, b'],
]

// Weapon Core [856], the entry lists were shared for.
const WEAPON_CORE = 'Available to purchase from D1G-g2r. Costs 2 Damaged Weapon Cores each, with 2 in stock. ' +
  'Damaged Weapon Cores are dropped by certain side quest and overworld bosses:\n\n' +
  '- Corrupter in Wasteland Basin\n' +
  '- Gigas at Oil Storage Facility ([[walkthroughs/side-quests/urgent-information|Urgent Information]])\n' +
  '- Brute in Forbidden Area ([[walkthroughs/side-quests/life-of-the-scavengers|Life of the Scavengers]])\n' +
  '- Stalker at Solar Tower in the Great Desert ([[walkthroughs/side-quests/reboot-great-desert|Reboot!!!]])\n' +
  '- Abaddon in Buried Ruins ([[walkthroughs/side-quests/an-eye-for-an-eye-a-tooth-for-a-tooth|An Eye for an Eye, a Tooth for a Tooth]])\n' +
  '- Behemoth in Northern Great Desert ([[walkthroughs/side-quests/encounter|Encounter]])'

describe('plainText', () => {
  it.each(CASES)('%s', (_name, text, plain) => {
    expect(plainText(text)).toBe(plain)
  })
})
