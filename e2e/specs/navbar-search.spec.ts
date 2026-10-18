import { test, expect } from '@playwright/test';
import { readFixtures, pgPool, redisClient, searchKey, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

let fx: Fixtures;

// searchQuery state exists only in the mobile drawer (<1024px).
test.use({ viewport: { width: 390, height: 844 } });

test.describe('navbar mobile search', () => {
  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('a walkthrough result links its type by the navigation spelling', async ({ page }) => {
    // The DB stores side-quest; the page lives at side-quests. A singular link let the
    // edge cache a copy the seed purge never refreshes. A real side quest, because the
    // fixture's type is not in the navigation.
    const pool = pgPool();
    const { rows } = await pool
      .query<{ title: string; slug: string }>(
        "SELECT title, slug FROM walkthroughs WHERE mission_type = 'side-quest' ORDER BY display_order, id LIMIT 1",
      )
      .finally(() => pool.end());
    const { title, slug } = rows[0];

    // A real title means a real search key, and a response an earlier run cached (it
    // lives an hour) would answer instead of the code under test. Clear that key.
    const key = searchKey(title.trim().toLowerCase());
    const redis = redisClient();
    try {
      await redis.del(key);
      await page.goto('/');
      await page.getByRole('button', { name: 'Toggle menu' }).click();
      await page.getByPlaceholder('Search collectibles, walkthroughs, levels...').fill(title);
      await page
        .locator('#mobile-menu a[href^="/walkthroughs/"]')
        .filter({ has: page.getByText(title, { exact: true }) })
        .first()
        .click();
      await expect(page).toHaveURL(new RegExp(`/walkthroughs/side-quests/${slug}$`));
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    } finally {
      await redis.del(key);
      redis.disconnect();
    }
  });

  test('query clears and accordion resets after navigating from a result', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.getByRole('button', { name: 'Toggle menu' });
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await hamburger.click();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    const input = page.getByPlaceholder('Search collectibles, walkthroughs, levels...');
    await expect(input).toBeVisible();
    await input.fill(fx.token); // unique run token — matches only our fixtures

    // Debounced /api/search; click the walkthrough fixture result to navigate in-app.
    await page.getByText(fx.walkthroughTitle).first().click();
    await expect(page).toHaveURL(new RegExp(`/walkthroughs/e2e-fixtures?/${fx.walkthroughSlug}`));

    // Drawer closed on navigation. It hides via -translate-x-full/opacity-0
    // (never display:none), which Playwright still treats as "visible" — so
    // assert the class, not visibility.
    // Target the drawer by the id the toggle's aria-controls names, not by
    // "nearest fixed ancestor" — that walk only avoided matching the navbar
    // because the navbar is a <nav> and the XPath said div.
    const drawer = page.locator('#mobile-menu');
    await expect(drawer).toHaveClass(/-translate-x-full/);
    await expect(page.getByRole('button', { name: 'Toggle menu' })).toHaveAttribute('aria-expanded', 'false');

    // Closed drawer is inert: its search input must not be focusable.
    await expect(drawer).toHaveAttribute('inert', '');
    expect(
      await page.evaluate(() => {
        const el = document.querySelector<HTMLInputElement>('#mobile-menu input[name="text"]');
        el?.focus();
        return document.activeElement === el;
      })
    ).toBe(false);

    // Reopen: query cleared, sections reset to the route-appropriate state —
    // landing on /walkthroughs/... auto-expands Walkthroughs, others stay closed.
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await expect(drawer).not.toHaveClass(/-translate-x-full/);
    await expect(drawer).not.toHaveAttribute('inert');
    await expect(input).toHaveValue('');

    const sectionButton = (label: string) =>
      page.getByRole('button', { name: label }).filter({ visible: true });
    await expect(sectionButton('Walkthroughs')).toHaveAttribute('aria-expanded', 'true');
    await expect(sectionButton('Walkthroughs').locator('svg.lucide-chevron-right')).toHaveClass(/rotate-90/);
    for (const label of ['Levels', 'Collectibles', 'Upgrades', 'Cosmetics']) {
      await expect(sectionButton(label)).toHaveAttribute('aria-expanded', 'false');
      const content = sectionButton(label).locator('xpath=following-sibling::div[1]');
      await expect(content).toHaveClass(/max-h-0/);
      await expect(sectionButton(label).locator('svg.lucide-chevron-right')).not.toHaveClass(/rotate-90/);
    }
  });
});
