import { describe, it, expect } from 'vitest'
import { stripLinks, descriptionPlainText } from './descriptionText'

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
})
