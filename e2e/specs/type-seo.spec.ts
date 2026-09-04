import { test, expect } from '@playwright/test';
import { nextTestIp } from '../helpers/auth';

// Frozen head tags for the 21 type pages (constants/typeSeo.ts). The
// count-consistency loop is the drift guard for the hardcoded title counts:
// the number in the live count line ("26 Passcodes") must equal the number in
// the tab title. The e2e fixture collectible carries no type mappings, so it
// is invisible to every type page and no slug needs skipping.

// Byte-pin of the frozen copy for one page (e2e cannot import client
// constants; this literal must match TYPE_SEO['passcodes'].description).
const PASSCODES_DESCRIPTION =
  'Complete guide to all 26 Passcodes in Stellar Blade. Every location with screenshots and detailed descriptions to help you find them all.';

test.describe('type page seo', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ 'x-real-ip': nextTestIp() });
  });

  test('passcodes title carries the collectible total', async ({ page }) => {
    await page.goto('/collectibles/passcodes');
    await expect(page).toHaveTitle(/^All \d+ Passcode Locations \| Stellar Blade Guide$/);
  });

  test('head tags are present while loading', async ({ page }) => {
    await page.route('**/api/collectibles/passcodes', () => { /* hold open */ });
    await page.goto('/collectibles/passcodes', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle('All 26 Passcode Locations | Stellar Blade Guide');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
  });

  test('meta description is the frozen copy', async ({ page }) => {
    await page.goto('/collectibles/passcodes');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', PASSCODES_DESCRIPTION);
  });

  const PAGES: Array<[category: string, slug: string]> = [
    ['collectibles', 'cans'],
    ['collectibles', 'documents'],
    ['collectibles', 'memorysticks'],
    ['collectibles', 'passcodes'],
    ['collectibles', 'camps'],
    ['upgrades', 'beta-cores'],
    ['upgrades', 'body-cores'],
    ['upgrades', 'weapon-cores'],
    ['upgrades', 'exospines'],
    ['upgrades', 'gear'],
    ['upgrades', 'tumbler-expansion-modules'],
    ['upgrades', 'drone-upgrade-modules'],
    ['cosmetics', 'nano-suits'],
    ['cosmetics', 'glasses'],
    ['cosmetics', 'earrings'],
    ['cosmetics', 'hairstyles'],
    ['cosmetics', 'drone-appearances'],
    ['cosmetics', 'lily-outfits'],
    ['cosmetics', 'adam-outfits'],
    ['materials', 'supply-boxes'],
    ['materials', 'supply-chests'],
  ];
  for (const [category, slug] of PAGES) {
    test(`${slug} title count equals the live count line`, async ({ page }) => {
      const displayName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      await page.goto(`/${category}/${slug}`);
      // The bare "N {Type}" count line only exists once the query resolves;
      // the intro paragraph's longer sentence fails the anchored match.
      const countLine = page.getByText(new RegExp(`^\\d+ ${displayName}$`));
      await expect(countLine).toBeVisible();
      const liveCount = (await countLine.textContent())!.match(/\d+/)![0];
      expect(await page.title()).toMatch(new RegExp(`^All ${liveCount} `));
    });
  }
});
