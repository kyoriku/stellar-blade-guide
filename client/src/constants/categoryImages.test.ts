import { describe, expect, it } from 'vitest';
import seo from './seo.json';
import {
  COLLECTIBLE_IMAGES,
  COSMETIC_IMAGES,
  LEVEL_IMAGES,
  UPGRADE_IMAGES,
  WALKTHROUGH_IMAGES,
} from './categoryImages';

const MAPS: Array<[string, Record<string, string>, Record<string, { image: string }>]> = [
  ['WALKTHROUGH_IMAGES', WALKTHROUGH_IMAGES, seo.walkthroughTypes],
  ['LEVEL_IMAGES', LEVEL_IMAGES, seo.levels],
  ['COLLECTIBLE_IMAGES', COLLECTIBLE_IMAGES, seo.types.collectibles],
  ['UPGRADE_IMAGES', UPGRADE_IMAGES, seo.types.upgrades],
  ['COSMETIC_IMAGES', COSMETIC_IMAGES, seo.types.cosmetics],
];

// Members every plain object inherits.
const BUILT_IN = [
  'constructor',
  '__proto__',
  'toString',
  'valueOf',
  'hasOwnProperty',
  'isPrototypeOf',
  'toLocaleString',
  '__defineGetter__',
];

describe('category image maps', () => {
  it("hold each seo.json entry's image under its slug", () => {
    for (const [name, images, section] of MAPS) {
      expect(Object.keys(images), name).toEqual(Object.keys(section));
      for (const [slug, entry] of Object.entries(section)) {
        expect(images[slug], `${name}[${slug}]`).toBe(entry.image);
      }
    }
  });

  it('find nothing for a built-in name', () => {
    for (const [name, images] of MAPS) {
      for (const key of BUILT_IN) {
        expect(images[key], `${name}[${key}]`).toBeUndefined();
      }
    }
  });
});
