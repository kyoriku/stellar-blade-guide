import { LEVELS, type LevelSlug } from './navigation';

export function isLevelSlug(value: string): value is LevelSlug {
  return LEVELS.some(level => level.slug === value);
}

// Hand-written copy; counts are hardcoded to the seeded dataset. The e2e
// count-consistency spec (e2e/specs/level-seo.spec.ts) pins each title's number
// to the live count line, so a data correction must update both together.
export const LEVEL_SEO: Record<LevelSlug, { title: string; description: string }> = {
  'eidos-7': {
    title: 'All 139 Eidos 7 Collectibles',
    description: 'Eidos 7 is the opening level, and it hides 139 collectibles across 8 areas, including 34 memorysticks, 14 camps, and 6 passcodes. Every entry has a screenshot and a written location, and each can be checked off as you collect it. On a first playthrough 128 are available; the other 11 need New Game+ or later. You leave Eidos 7 at the end of Scavenger Adam, but it reopens after Altess Levoire and stays open until you travel to the Nest after Spire 4.',
  },
  'xion': {
    title: 'All 165 Xion Collectibles',
    description: 'Xion is the hub city rather than a combat level, but it still holds 165 collectibles, including 49 documents, 36 Nano Suits, 13 hairstyles, and 12 earrings, mostly bought, earned, or found around the city. Each is listed with a screenshot and where to get it, plus a checkbox to track what you own. Of those, 12 need New Game+ or later. The city, its side quests, and the Bulletin Board lock at the first point of no return, when you choose to travel to Spire 4 after Abyss Levoire; the Safehouse stays open, and the merchants keep trading until you leave for the Nest.',
  },
  'wasteland': {
    title: 'All 208 Wasteland Collectibles',
    description: 'The Wasteland is the first open region, and it spreads 208 collectibles over 9 areas, 37 memorysticks, 25 Nano Suits, and 15 cans among them. Of those, 21 come from the NieR: Automata and Goddess of Victory: Nikke DLC and 13 more need New Game+ or later, so a base-game first run can collect 174. Screenshots and written locations cover every entry, and you can tick them off one by one. The area stays open after the first point of no return; it locks at the second, when you travel to the Nest after Spire 4, and anything missed has to wait for New Game+.',
  },
  'altess-levoire': {
    title: 'All 25 Altess Levoire Collectibles',
    description: 'Altess Levoire is a short linear facility with 25 collectibles across 9 sections, among them 6 documents, 5 camps, and 4 supply chests, plus a few upgrades. Nothing is locked to a later playthrough. Every one has a screenshot and a written location, and you can mark each one collected. Everything in the area locks at the second point of no return, when you travel to the Nest after Spire 4; anything missed has to wait for New Game+.',
  },
  'matrix-11': {
    title: 'All 131 Matrix 11 Collectibles',
    description: 'Matrix 11 is the linear level that leads into the Great Desert, and it packs 131 collectibles into 8 areas, including 24 memorysticks, 12 camps, and 11 pieces of Gear. Each is listed by area with a screenshot, a written location, and a checkbox to track your progress. Of the total, 9 are locked to New Game+ or later, leaving 122 for a first run. Everything in the area locks at the second point of no return, when you travel to the Nest after Spire 4; anything missed has to wait for New Game+.',
  },
  'great-desert': {
    title: 'All 188 Great Desert Collectibles',
    description: 'The Great Desert is Stellar Blade\'s second open region, and it holds 188 collectibles across 6 areas, including 51 memorysticks, 19 camps, and 16 cans. Every entry has a screenshot and a written location, and you can check them off as you go. A first run can collect 179; the remaining 9 need New Game+ or later. The area stays open after the first point of no return; it locks at the second, when you travel to the Nest after Spire 4, and anything missed has to wait for New Game+.',
  },
  'abyss-levoire': {
    title: 'All 30 Abyss Levoire Collectibles',
    description: 'Abyss Levoire is a short linear level reached from the Great Desert, with just 30 collectibles across 6 sections: 7 camps, 6 supply boxes, 5 documents, and a handful of chests, upgrades, and Nano Suits. All but 2 are available on a first playthrough; the rest need New Game+ or later. Each has a screenshot, a written location, and a checkbox, so the short list is quick to clear. Finishing it locks nothing by itself; the first point of no return is choosing to travel to Spire 4 afterward, and the area only locks at the second, when you travel to the Nest.',
  },
  'eidos-9': {
    title: 'All 54 Eidos 9 Collectibles',
    description: 'Eidos 9 is optional: Lily only asks you there after Abyss Levoire if her progress bar is full, and it\'s required for the Making New Memories ending. It packs 54 collectibles into 3 areas, including 20 supply boxes, 9 Nano Suits, and 7 memorysticks. A first playthrough covers 48; 6 more wait for New Game+ or later. Every item comes with a screenshot and a written location, and you can log each one as you find it. Visit before you finish Spire 4; after that it\'s gone until New Game+.',
  },
  'spire-4': {
    title: 'All 120 Spire 4 Collectibles',
    description: 'Spire 4 is the long climb before the finale, with 120 collectibles over 11 sections, including 28 memorysticks, 13 camps, and 12 pieces of Gear. The first ascent can net 112; 8 only appear in New Game+ or later. Screenshots, written locations, and progress tracking cover every one. Finishing it also closes Eidos 9 if you haven\'t visited yet, and everything else locks at the second point of no return, when you travel to the Nest afterward; anything missed has to wait for New Game+.',
  },
  'nest': {
    title: 'Nest Collectibles',
    description: 'The Nest is the final area, and it has exactly 1 collectible: a camp near the end. It\'s listed with a screenshot and a checkbox so nothing is left unchecked.',
  },
};
