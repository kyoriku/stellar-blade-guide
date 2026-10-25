import { describe, it, expect } from 'vitest'
import { textBlocks, type TextBlock } from './textBlocks'

// Characters kept out of the source as literals.
const EN = String.fromCharCode(0x2013)
const EM = String.fromCharCode(0x2014)
const LS = String.fromCharCode(0x2028)

const p = (text: string): TextBlock => ({ kind: 'paragraph', text })
const list = (...items: string[]): TextBlock => ({ kind: 'list', items })

// The same cases, in the same order, as plainText's in descriptionText.test.ts and
// text_blocks' and plain_text's in server/tests/test_search_text.py.
const CASES: [string, string, TextBlock[]][] = [
  ['no newline', 'Buy them.', [p('Buy them.')]],
  ['empty', '', [p('')]],
  ['blank lines only', '\n\n', [p(''), p('')]],
  ['two paragraphs', 'First.\n\nSecond.', [p('First.'), p('Second.')]],
  ['an intro and a list', 'Bosses:\n\n- a\n- b', [p('Bosses:'), list('a', 'b')]],
  ['only a list', '- a\n- b', [list('a', 'b')]],
  ['a list, then text', 'Intro:\n\n- a\n- b\n\nThen.', [p('Intro:'), list('a', 'b'), p('Then.')]],
  ['a single "- " line', 'Intro\n\n- a', [p('Intro'), p('- a')]],
  ['a hyphen mid-line', 'left - right\nup - down', [p('left - right\nup - down')]],
  ['"-" with no space', '-a\n-b', [p('-a\n-b')]],
  ['a list after a single newline', 'Intro:\n- a\n- b', [p('Intro:\n- a\n- b')]],
  ['a newline after the last item', '- a\n- b\n', [p('- a\n- b\n')]],
  ['a blank line holding a space', 'Intro\n \n- a\n- b', [p('Intro\n \n- a\n- b')]],
  ['en and em dash lines', `${EN} a\n${EM} b`, [p(`${EN} a\n${EM} b`)]],
  ['a nested list', '- a\n  - b', [p('- a\n  - b')]],
  ['three newlines before a list', 'Intro\n\n\n- a\n- b', [p('Intro'), p('\n- a\n- b')]],
  ['trailing spaces', '- a  \n- b ', [list('a  ', 'b ')]],
  ['an empty item', '- \n- b', [list('', 'b')]],
  ['a carriage return', '- a\r\n- b', [list('a\r', 'b')]],
  ['a Unicode line separator', `- a${LS}- b`, [p(`- a${LS}- b`)]],
  ['a link in an item', '- [[levels/xion|Xion]]\n- b', [list('[[levels/xion|Xion]]', 'b')]],
  ['a paragraph with its own newline beside a list', 'One\ntwo\n\n- a\n- b', [p('One\ntwo'), list('a', 'b')]],
]

// Weapon Core [856], the entry the rule was shared for.
const WEAPON_CORE_INTRO = 'Available to purchase from D1G-g2r. Costs 2 Damaged Weapon Cores each, with 2 in stock. ' +
  'Damaged Weapon Cores are dropped by certain side quest and overworld bosses:'
const WEAPON_CORE_ITEMS = [
  'Corrupter in Wasteland Basin',
  'Gigas at Oil Storage Facility ([[walkthroughs/side-quests/urgent-information|Urgent Information]])',
  'Brute in Forbidden Area ([[walkthroughs/side-quests/life-of-the-scavengers|Life of the Scavengers]])',
  'Stalker at Solar Tower in the Great Desert ([[walkthroughs/side-quests/reboot-great-desert|Reboot!!!]])',
  'Abaddon in Buried Ruins ([[walkthroughs/side-quests/an-eye-for-an-eye-a-tooth-for-a-tooth|An Eye for an Eye, a Tooth for a Tooth]])',
  'Behemoth in Northern Great Desert ([[walkthroughs/side-quests/encounter|Encounter]])',
]
const WEAPON_CORE = `${WEAPON_CORE_INTRO}\n\n${WEAPON_CORE_ITEMS.map((item) => `- ${item}`).join('\n')}`

describe('textBlocks', () => {
  it.each(CASES)('%s', (_name, text, blocks) => {
    expect(textBlocks(text)).toEqual(blocks)
  })

  it("reads Weapon Core's bosses as an intro and six items", () => {
    expect(textBlocks(WEAPON_CORE)).toEqual([p(WEAPON_CORE_INTRO), list(...WEAPON_CORE_ITEMS)])
  })
})
