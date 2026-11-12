import { test, expect } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// The type page takes its category from its route, never from the address, so no spelling of
// the address can show another category's page. An escaped letter is one such spelling: the
// router decodes it and matches the route, while the address itself keeps the escape.

test.describe('the type page category', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  for (const [address, h1] of [
    // Documents is a Collectibles type: under Upgrades it is no page.
    ['/%75pgrades/documents', 'Page Not Found'],
    ['/%75pgrades/weapon-cores', 'Weapon Cores'],
    ['/%63osmetics/cans', 'Page Not Found'],
    ['/%63osmetics/nano-suits', 'Nano Suits'],
  ]) {
    test(`${address} follows its route`, async ({ page }) => {
      await page.goto(address);
      // The address keeps its escape; were it decoded, the old pathname check would pass too.
      await expect(page).toHaveURL(address);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
    });
  }
});
