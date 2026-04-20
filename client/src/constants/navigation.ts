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
  { slug: 'nest', name: 'Nest' },
] as const;

export const COLLECTIBLES = [
  { slug: 'cans', name: 'Cans' },
  { slug: 'documents', name: 'Documents' },
  { slug: 'memorysticks', name: 'Memorysticks' },
  { slug: 'passcodes', name: 'Passcodes' },
  { slug: 'camps', name: 'Camps' },
] as const;

export const UPGRADES = [
  { slug: 'beta-cores', name: 'Beta Cores' },
  { slug: 'body-cores', name: 'Body Cores' },
  { slug: 'weapon-cores', name: 'Weapon Cores' },
  { slug: 'exospines', name: 'Exospines' },
  { slug: 'gear', name: 'Gear' },
  { slug: 'tumbler-expansion-modules', name: 'Tumbler Expansion Modules' },
  { slug: 'drone-upgrade-modules', name: 'Drone Upgrade Modules' },
]

export const MATERIALS = [
  { slug: 'supply-boxes', name: 'Supply Boxes' },
  { slug: 'supply-chests', name: 'Supply Chests' },
  // { slug: 'items', name: 'Items' },
] as const;

export const COSMETICS = [
  { slug: 'nano-suits', name: 'Nano Suits' },
  { slug: 'glasses', name: 'Glasses' },
  { slug: 'earrings', name: 'Earrings' },
  { slug: 'hairstyles', name: 'Hairstyles' },
  { slug: 'drone-appearances', name: 'Drone Appearances' },
  { slug: 'lily-outfits', name: 'Lily Outfits' },
  { slug: 'adam-outfits', name: 'Adam Outfits' },
] as const;

export type WalkthroughSlug = typeof WALKTHROUGHS[number]['slug'];
export type LevelSlug = typeof LEVELS[number]['slug'];
export type CollectibleSlug = typeof COLLECTIBLES[number]['slug'];
export type UpgradeSlug = typeof UPGRADES[number]['slug'];
export type MaterialSlug = typeof MATERIALS[number]['slug'];
export type CosmeticSlug = typeof COSMETICS[number]['slug'];