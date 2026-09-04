import { COLLECTIBLES, UPGRADES, COSMETICS, MATERIALS } from './navigation';
import type { CollectibleSlug, UpgradeSlug, CosmeticSlug, MaterialSlug } from './navigation';

export type TypeSlug = CollectibleSlug | UpgradeSlug | CosmeticSlug | MaterialSlug;

export function isTypeSlug(value: string): value is TypeSlug {
  return (
    COLLECTIBLES.some(t => t.slug === value) ||
    UPGRADES.some(t => t.slug === value) ||
    COSMETICS.some(t => t.slug === value) ||
    MATERIALS.some(t => t.slug === value)
  );
}

// Static head-tag copy; counts are hardcoded to the seeded dataset (same
// policy as levelSeo.ts). The e2e count-consistency spec
// (e2e/specs/type-seo.spec.ts) pins each title's number to the live count
// line, so a data correction must update both together. Descriptions are the
// former in-page template's output frozen per slug, with each cycle list
// corrected to the cycles the type actually spans. Titles drop "Locations"
// where the quantity total differs from the entry count (weapon-cores,
// tumbler-expansion-modules, drone-upgrade-modules).
export const TYPE_SEO: Record<TypeSlug, { title: string; description: string }> = {
  'cans': {
    title: 'All 49 Can Locations',
    description: 'Complete guide to all 49 Cans in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.',
  },
  'documents': {
    title: 'All 114 Document Locations',
    description: 'Complete guide to all 114 Documents in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.',
  },
  'memorysticks': {
    title: 'All 186 Memorystick Locations',
    description: 'Complete guide to all 186 Memorysticks in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.',
  },
  'passcodes': {
    title: 'All 26 Passcode Locations',
    description: 'Complete guide to all 26 Passcodes in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.',
  },
  'camps': {
    title: 'All 91 Camp Locations',
    description: 'Complete guide to all 91 Camps in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.',
  },
  'beta-cores': {
    title: 'All 20 Beta Core Locations',
    description: 'Complete guide to all 20 Beta Cores in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.',
  },
  'body-cores': {
    title: 'All 20 Body Core Locations',
    description: 'Complete guide to all 20 Body Cores in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.',
  },
  'weapon-cores': {
    title: 'All 17 Weapon Cores',
    description: 'Complete guide to all 17 Weapon Cores in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.',
  },
  'exospines': {
    title: 'All 12 Exospine Locations',
    description: 'Complete guide to all 12 Exospines in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.',
  },
  'gear': {
    title: 'All 77 Gear Locations',
    description: 'Complete guide to all 77 Gear in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.',
  },
  'tumbler-expansion-modules': {
    title: 'All 18 Tumbler Expansion Modules',
    description: 'Complete guide to all 18 Tumbler Expansion Modules in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.',
  },
  'drone-upgrade-modules': {
    title: 'All 48 Drone Upgrade Modules',
    description: 'Complete guide to all 48 Drone Upgrade Modules in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.',
  },
  'nano-suits': {
    title: 'All 126 Nano Suits & How to Unlock',
    description: 'All 126 Nano Suits in Stellar Blade across Base, NG+, NG++, and DLC. Filter by cycle, sort A–Z, with screenshots and location guides.',
  },
  'glasses': {
    title: 'All 20 Glasses Locations',
    description: 'All 20 Glasses in Stellar Blade across Base, NG+, and DLC. Filter by cycle, sort A–Z, with screenshots and location guides.',
  },
  'earrings': {
    title: 'All 24 Earrings Locations',
    description: 'All 24 Earrings in Stellar Blade across Base, NG+, and NG++. Filter by cycle, sort A–Z, with screenshots and location guides.',
  },
  'hairstyles': {
    title: 'All 22 Hairstyles & How to Unlock',
    description: 'All 22 Hairstyles in Stellar Blade across Base and DLC. Filter by cycle, sort A–Z, with screenshots and location guides.',
  },
  'drone-appearances': {
    title: 'All 9 Drone Appearance Locations',
    description: 'All 9 Drone Appearances in Stellar Blade across Base, NG+, and DLC. Filter by cycle, sort A–Z, with screenshots and location guides.',
  },
  'lily-outfits': {
    title: 'All 7 Lily Outfit Locations',
    description: 'All 7 Lily Outfits in Stellar Blade across Base, NG+, and DLC. Filter by cycle, sort A–Z, with screenshots and location guides.',
  },
  'adam-outfits': {
    title: 'All 8 Adam Outfit Locations',
    description: 'All 8 Adam Outfits in Stellar Blade across Base, NG+, and DLC. Filter by cycle, sort A–Z, with screenshots and location guides.',
  },
  'supply-boxes': {
    title: 'All 151 Supply Box Locations',
    description: 'Complete guide to all 151 Supply Boxes in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.',
  },
  'supply-chests': {
    title: 'All 42 Supply Chest Locations',
    description: 'Complete guide to all 42 Supply Chests in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.',
  },
};
