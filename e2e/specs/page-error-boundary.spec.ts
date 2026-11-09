import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// A page that throws while it renders shows the error page inside the layout: the navbar and
// footer stay, and the next navigation, Back and Forward included, clears it (the page's error
// boundary in RootLayout, reset on the router's location). The bad answer stays cached, so
// returning to the page crashes it again, caught the same way. The stub answers null where the
// level page reads a list; services/api.ts passes it through unchecked.

const LEVEL = '/levels/eidos-7';

const crashPage = (page: Page) => page.getByRole('heading', { name: 'Something went wrong', exact: true });
const footer = (page: Page) => page.getByRole('navigation', { name: 'Footer' });
const path = (page: Page) => new URL(page.url()).pathname;

async function breakLevelPage(page: Page) {
  await page.route(`**/api${LEVEL}`, route => route.fulfill({ body: 'null', contentType: 'application/json' }));
}

// The error page, with the layout around it still on screen.
async function expectCrashInLayout(page: Page) {
  await expect(crashPage(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Search (Ctrl+K)' })).toBeVisible();
  await expect(footer(page)).toBeVisible();
}

test.describe('a page that crashes', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('keeps the navbar and footer, Back leaves it, and Forward finds it again', async ({ page }) => {
    await breakLevelPage(page);
    await page.goto('/levels');
    await page.locator(`a[href="${LEVEL}"]:not(#mobile-menu a):visible`).first().click();
    await expect.poll(() => path(page)).toBe(LEVEL);
    await expectCrashInLayout(page);

    await page.goBack();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Levels');
    await expect(crashPage(page)).toHaveCount(0);

    await page.goForward();
    await expect.poll(() => path(page)).toBe(LEVEL);
    await expectCrashInLayout(page);
  });

  test('a link in the layout leaves it, and so does Back to Home', async ({ page }) => {
    await breakLevelPage(page);
    await page.goto(LEVEL);
    await expectCrashInLayout(page);
    await footer(page).getByRole('link', { name: 'Privacy', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy Policy');

    await page.goBack();
    await expectCrashInLayout(page);
    await page.getByRole('link', { name: 'Back to Home' }).click();
    await expect.poll(() => path(page)).toBe('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Stellar Blade Guide' })).toBeVisible();
    await expect(crashPage(page)).toHaveCount(0);
  });

  test('crashing again straight from the error page keeps the layout', async ({ page }) => {
    await breakLevelPage(page);
    await page.goto(LEVEL);
    await expectCrashInLayout(page);
    // From the error page straight into the next crash: a typed fragment, then Back.
    await page.goto(`${LEVEL}#again`);
    await expectCrashInLayout(page);
    await page.goBack();
    await expectCrashInLayout(page);
  });

  test('its two buttons line up', async ({ page }) => {
    await breakLevelPage(page);
    await page.goto(LEVEL);
    await expectCrashInLayout(page);
    const retry = (await page.getByRole('button', { name: 'Try Again' }).boundingBox())!;
    const home = (await page.getByRole('link', { name: 'Back to Home' }).boundingBox())!;
    expect(home.y).toBe(retry.y);
    expect(home.height).toBe(retry.height);
  });

  test('Try Again reloads, so the page renders once the cause is gone', async ({ page }) => {
    await breakLevelPage(page);
    await page.goto(LEVEL);
    await expectCrashInLayout(page);
    await page.unroute(`**/api${LEVEL}`);
    // A re-render would meet the same cached answer; only a reload asks the server again.
    await page.evaluate(() => { (window as unknown as { beforeRetry: boolean }).beforeRetry = true; });
    await page.getByRole('button', { name: 'Try Again' }).click();
    await expect(page.locator('section[id] article[id]').first()).toBeVisible();
    await expect(crashPage(page)).toHaveCount(0);
    expect(await page.evaluate(() => 'beforeRetry' in window), 'a new document').toBe(false);
  });
});
