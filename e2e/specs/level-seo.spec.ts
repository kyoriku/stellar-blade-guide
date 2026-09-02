import { test, expect } from '@playwright/test';
import { nextTestIp } from '../helpers/auth';

// Level pages ship hardcoded, count-led titles and intro copy from
// client/src/constants/levelSeo.ts. The copy is static while the catalog is
// live, so besides pinning the shipped head tags these tests cross-check each
// title's number against the live count line — the only guard against a data
// correction silently desyncing the prose.
//
// eidos-7 is excluded from the cross-check: global-setup inserts its fixture
// collectible there, inflating the live count by one during e2e runs. nest is
// excluded because its fallback title carries no number.

test.describe('level page seo', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ 'x-real-ip': nextTestIp() });
  });

  test('great desert title carries the collectible total', async ({ page }) => {
    await page.goto('/levels/great-desert');
    await expect(page).toHaveTitle(/^All \d+ Great Desert Collectibles \| Stellar Blade Guide$/);
  });

  test('nest falls back to the countless title', async ({ page }) => {
    await page.goto('/levels/nest');
    await expect(page).toHaveTitle('Nest Collectibles | Stellar Blade Guide');
  });

  test('meta description matches the rendered intro', async ({ page }) => {
    await page.goto('/levels/great-desert');
    // The intro paragraph renders with the same class set and identical text
    // in the loading and loaded branches, so this cannot race the query.
    const intro = page.locator('p.sm\\:basis-full').first();
    const introText = (await intro.textContent())?.trim();
    expect(introText).toBeTruthy();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', introText!);
  });

  const CROSS_CHECK = [
    'xion',
    'wasteland',
    'altess-levoire',
    'matrix-11',
    'great-desert',
    'abyss-levoire',
    'eidos-9',
    'spire-4',
  ];
  for (const slug of CROSS_CHECK) {
    test(`${slug} title count equals the live count line`, async ({ page }) => {
      await page.goto(`/levels/${slug}`);
      // The bare "N collectibles" line only exists once the query resolves;
      // the intro paragraph's longer sentence fails the anchored match.
      const countLine = page.getByText(/^\d+ collectibles$/);
      await expect(countLine).toBeVisible();
      const liveCount = (await countLine.textContent())!.match(/\d+/)![0];
      expect(await page.title()).toMatch(new RegExp(`^All ${liveCount} `));
    });
  }
});
