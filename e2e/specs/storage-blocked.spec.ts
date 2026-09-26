import { test, expect } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp } from '../helpers/auth';

let fx: Fixtures;

/**
 * A browser that refuses site storage (Safari "Block all cookies", a per-site
 * cookie block, Firefox with cookies off) makes the window.localStorage getter
 * itself throw. The public guide needs no storage, so it must render signed
 * out, keep a guest's ticks in memory for the page's life, and never blank the
 * root: the provider's first render reads the session hint, and the root error
 * boundary's fallback used to render a router Link outside the router.
 */
test.describe('storage refused', () => {
  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    await context.setExtraHTTPHeaders({ 'x-real-ip': nextTestIp() });
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('Access is denied for this document.', 'SecurityError');
        },
      });
    });
  });

  test('a guide page renders signed out and a guest toggle holds in memory', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/levels/eidos-7');
    await expect(
      page.locator('nav').getByRole('link', { name: 'Sign in' }).filter({ visible: true })
    ).toBeVisible();

    const article = page.locator(`article#collectible-${fx.collectibleId}`);
    await expect(article).toBeVisible();
    const toggle = article.getByRole('button', { name: /Mark as/ });
    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Mark as not found');
    expect(errors).toEqual([]);
  });

  test('a protected route still redirects to login', async ({ page }) => {
    await page.goto('/progress');
    await expect(page).toHaveURL(/\/login/);
  });
});
