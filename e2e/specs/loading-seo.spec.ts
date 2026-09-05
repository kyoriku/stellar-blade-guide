import { test, expect } from '@playwright/test';
import { nextTestIp } from '../helpers/auth';

// The walkthrough pages previously rendered no <title> or meta description at
// all while their query loaded. These tests hold the API request open to pin
// the loading-state head tags, then release it to pin the loaded ones.

test.describe('walkthrough loading-state seo', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ 'x-real-ip': nextTestIp() });
  });

  test('list page carries full head tags while loading', async ({ page }) => {
    await page.route('**/api/walkthroughs/main-story', () => { /* hold open */ });
    await page.goto('/walkthroughs/main-story', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle('Main Story Walkthroughs | Stellar Blade Guide');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);

    await page.unroute('**/api/walkthroughs/main-story');
    await page.reload();
    // List titles are state-invariant; the loaded page must show the same one.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).toHaveTitle('Main Story Walkthroughs | Stellar Blade Guide');
  });

  test('detail page swaps the transient type title for the walkthrough title', async ({ page }) => {
    await page.route('**/api/walkthroughs/main-story/7th-airborne-squad', () => { /* hold open */ });
    await page.goto('/walkthroughs/main-story/7th-airborne-squad', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle('Main Story Walkthrough | Stellar Blade Guide');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);

    await page.unroute('**/api/walkthroughs/main-story/7th-airborne-squad');
    await page.reload();
    await expect(page).toHaveTitle(/7th Airborne Squad Walkthrough \| Stellar Blade Guide$/);
    // 7th Airborne Squad documents a boss, so the loaded description claims strategies.
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /boss strategies/);
  });

  test('bossless walkthroughs do not claim boss strategies', async ({ page }) => {
    // missing-husband (bulletin board request) has no is_boss content block.
    await page.goto('/walkthroughs/bulletin-board-requests/missing-husband');
    // Gate on the loaded title first — the loading transient also lacks the
    // phrase, so asserting too early would pass vacuously.
    await expect(page).toHaveTitle(/Missing Husband Walkthrough/);
    await expect(page.locator('meta[name="description"]')).not.toHaveAttribute('content', /boss strategies/);
  });
});
