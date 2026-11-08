import { test, expect } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// A type or walkthrough category named after a member every object inherits is an unknown
// page like any other (constants/categoryImages.ts).

const ADDRESSES = [
  '/cosmetics/constructor',
  '/collectibles/__proto__',
  '/upgrades/toString',
  // The walkthrough page reads its image while loading, before it knows the page is missing.
  '/walkthroughs/constructor/x',
];

test.describe('built-in names in the address', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  for (const path of ADDRESSES) {
    test(`${path} gets the 404 page`, async ({ page }) => {
      const notFound = page.getByRole('heading', { name: 'Page Not Found', exact: true });
      const crashPage = page.getByRole('heading', { name: 'Something went wrong', exact: true });

      await page.goto(path);
      await expect(notFound.or(crashPage).first()).toBeVisible();
      await expect(crashPage).toHaveCount(0);
      await expect(notFound).toBeVisible();
    });
  }
});
