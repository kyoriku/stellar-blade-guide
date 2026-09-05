import { test, expect } from '@playwright/test';
import { nextTestIp } from '../helpers/auth';

// The six category index pages ship intent-matched seoTitle overrides while
// their h1s keep the short names. These pages render <SEO> unconditionally
// (no loading branch), so plain navigation pins the contract.

const TITLES: Array<[path: string, title: string | RegExp]> = [
  ['/collectibles', 'All Collectibles & Where to Find Them | Stellar Blade Guide'],
  ['/cosmetics', 'All Cosmetics: Outfits, Glasses & More | Stellar Blade Guide'],
  ['/upgrades', 'All Upgrades: Cores, Exospines & Gear | Stellar Blade Guide'],
  ['/materials', 'All Supply Box & Chest Locations | Stellar Blade Guide'],
  // Level count is interpolated from LEVELS.length — assert the shape, not the number.
  ['/levels', /^All \d+ Levels with Every Collectible \| Stellar Blade Guide$/],
  ['/walkthroughs', 'Main Story & Side Quest Walkthroughs | Stellar Blade Guide'],
];

test.describe('index page seo titles', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ 'x-real-ip': nextTestIp() });
  });

  for (const [path, title] of TITLES) {
    test(`${path} carries its seo title`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
    });
  }
});
