import { test, expect } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp } from '../helpers/auth';

let fx: Fixtures;

// searchQuery state exists only in the mobile drawer (<1024px).
test.use({ viewport: { width: 390, height: 844 } });

test.describe('navbar mobile search', () => {
  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ 'x-real-ip': nextTestIp() });
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
    const drawer = input.locator('xpath=ancestor::div[contains(@class, "fixed")][1]');
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
    for (const label of ['Levels', 'Collectibles', 'Upgrades', 'Cosmetics', 'Materials']) {
      await expect(sectionButton(label)).toHaveAttribute('aria-expanded', 'false');
      const content = sectionButton(label).locator('xpath=following-sibling::div[1]');
      await expect(content).toHaveClass(/max-h-0/);
      await expect(sectionButton(label).locator('svg.lucide-chevron-right')).not.toHaveClass(/rotate-90/);
    }
  });
});
