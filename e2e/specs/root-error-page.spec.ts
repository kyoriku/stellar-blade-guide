import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// A crash outside the page's error boundary, here in the navbar, takes the whole site to the
// root error page, above the router. With no router to answer them, Back and Forward reload
// the address they land on. Search results with no list make the navbar's search throw.

const LEVEL = '/levels/eidos-7';

const heading = (page: Page) => page.getByRole('heading', { level: 1 });

async function crashTheNavbar(page: Page) {
  await page.getByRole('button', { name: 'Search (Ctrl+K)' }).click();
  await page.getByPlaceholder('Search…').fill('e2e');
  await expect(heading(page)).toHaveText('Something went wrong');
  await expect(page.locator('nav')).toHaveCount(0);
}

test.describe('the root error page', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ page, context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
    await page.route('**/api/search/**', route =>
      route.fulfill({ json: { query: 'e2e', total: 1, results: null } }));
    await page.goto('/levels');
    await page.locator(`a[href="${LEVEL}"]:not(#mobile-menu a):visible`).first().click();
    await expect(heading(page)).toHaveText('Eidos 7');
  });

  test('Back reloads the page it lands on', async ({ page }) => {
    await crashTheNavbar(page);
    await page.goBack();
    await expect(heading(page)).toHaveText('Levels');
    await expect(page.getByRole('navigation', { name: 'Footer' })).toBeVisible();
  });

  test('Forward reloads the page it lands on', async ({ page }) => {
    await page.goBack();
    await expect(heading(page)).toHaveText('Levels');
    await crashTheNavbar(page);
    await page.goForward();
    await expect(heading(page)).toHaveText('Eidos 7');
    await expect(page.getByRole('navigation', { name: 'Footer' })).toBeVisible();
  });
});
