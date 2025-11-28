export const WALKTHROUGHS = [
  { slug: 'main-story', name: 'Main Story' },
  // { slug: 'side-quests', name: 'Side Quests' },
  // { slug: 'bulletin-board-requests', name: 'Bulletin Board Requests' },
  // { slug: 'bosses', name: 'Bosses' },
  // { slug: 'fishing', name: 'Fishing' },
] as const;

export const LEVELS = [
  { slug: 'eidos-7', name: 'Eidos 7' },
  { slug: 'xion', name: 'Xion' },
  { slug: 'wasteland', name: 'Wasteland' },
  { slug: 'altess-levoire', name: 'Altess Levoire' },
  { slug: 'matrix-11', name: 'Matrix 11' },
  { slug: 'great-desert', name: 'Great Desert' },
  { slug: 'abyss-levoire', name: 'Abyss Levoire' },
  { slug: 'eidos-9', name: 'Eidos 9' },
  { slug: 'spire-4', name: 'Spire 4' },
] as const;

export const COLLECTIBLES = [
  { slug: 'beta-cores', name: 'Beta Cores' },
  { slug: 'body-cores', name: 'Body Cores' },
  { slug: 'camps', name: 'Camps' },
  { slug: 'cans', name: 'Cans' },
  { slug: 'documents', name: 'Documents' },
  { slug: 'earrings', name: 'Earrings' },
  { slug: 'exospines', name: 'Exospines' },
  { slug: 'glasses', name: 'Glasses' },
  { slug: 'locked-chests', name: 'Locked Chests' },
  { slug: 'memorysticks', name: 'Memorysticks' },
  { slug: 'nano-suits', name: 'Nano Suits' },
  { slug: 'outfits', name: 'Outfits' },
  { slug: 'passcodes', name: 'Passcodes' },
  { slug: 'robots', name: 'Robots' },
  { slug: 'supply-boxes', name: 'Supply Boxes' },
  { slug: 'supply-chests', name: 'Supply Chests' },
  { slug: 'items', name: 'Items' },
] as const;

export type WalkthroughSlug = typeof WALKTHROUGHS[number]['slug'];
export type LevelSlug = typeof LEVELS[number]['slug'];
export type CollectibleSlug = typeof COLLECTIBLES[number]['slug'];