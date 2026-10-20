import { describe, it, expect } from 'vitest'
import { breadcrumbList } from './breadcrumbs'

describe('breadcrumbList', () => {
  it('puts Home first and numbers every crumb from 1', () => {
    const list = breadcrumbList([
      { name: 'Walkthroughs', path: '/walkthroughs' },
      { name: 'Bulletin Board Requests', path: '/walkthroughs/bulletin-board-requests' },
      { name: 'A Gift for a Fishing Maniac', path: '/walkthroughs/bulletin-board-requests/gift-for-a-fishing-maniac' },
    ])
    expect(list['@type']).toBe('BreadcrumbList')
    expect(list.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stellarbladeguide.com/' },
      { '@type': 'ListItem', position: 2, name: 'Walkthroughs', item: 'https://stellarbladeguide.com/walkthroughs' },
      { '@type': 'ListItem', position: 3, name: 'Bulletin Board Requests', item: 'https://stellarbladeguide.com/walkthroughs/bulletin-board-requests' },
      { '@type': 'ListItem', position: 4, name: 'A Gift for a Fishing Maniac', item: 'https://stellarbladeguide.com/walkthroughs/bulletin-board-requests/gift-for-a-fishing-maniac' },
    ])
  })

  it('keeps each name exactly as the page passes it', () => {
    const names = breadcrumbList([{ name: 'NieR: Automata DLC', path: '/walkthroughs/nier-dlc' }])
      .itemListElement.map(c => c.name)
    expect(names).toEqual(['Home', 'NieR: Automata DLC'])
  })
})
