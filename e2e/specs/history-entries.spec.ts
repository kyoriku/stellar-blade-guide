import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// Contents and Back to top rewrite the address of the history entry they're on, and keep the
// entry's state, which React Router owns (its key and index); Back to top keeps the query too.
// These check state, never offsets.

const TYPE = '/cosmetics/nano-suits';

const entryState = (page: Page) => page.evaluate(() => history.state as { key?: string; idx?: number } | null);

test.describe('history entries, desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test("a Contents jump keeps the entry's history state", async ({ page }) => {
    await page.goto(TYPE);
    await page.locator('section[id] article[id]').first().waitFor();
    // A same-page link pushes an entry that carries a key.
    await page.locator(`article a[href^="${TYPE}#"]`).first().evaluate(a => (a as HTMLElement).click());
    await expect.poll(async () => (await entryState(page))?.key ?? null).not.toBeNull();
    const before = await entryState(page);
    const entry = page.locator('aside nav a[href^="#"]').first();
    await entry.click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(await entry.getAttribute('href'));
    expect(await entryState(page)).toEqual(before);
  });

  test("Back to top keeps the query and the entry's history state", async ({ page }) => {
    await page.goto('/levels/eidos-7?ref=e2e');
    await page.locator('section[id] article[id]').first().waitFor();
    const before = await entryState(page);
    expect(before, 'the router has written the entry').not.toBeNull();
    await page.evaluate(() => window.scrollTo(0, 1500));
    const backToTop = page.locator('aside button[aria-label="Back to top"]');
    await expect(backToTop).toHaveCSS('opacity', '1');
    await backToTop.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    expect(await page.evaluate(() => location.search)).toBe('?ref=e2e');
    expect(await entryState(page)).toEqual(before);
  });
});

test.describe('history entries, phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test("Back to top keeps the query and the entry's history state", async ({ page }) => {
    await page.goto('/levels/eidos-7?ref=e2e');
    await page.locator('section[id] article[id]').first().waitFor();
    const before = await entryState(page);
    expect(before, 'the router has written the entry').not.toBeNull();
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.getByRole('button', { name: 'Back to top' }).filter({ visible: true }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    expect(await page.evaluate(() => location.search)).toBe('?ref=e2e');
    expect(await entryState(page)).toEqual(before);
  });
});
