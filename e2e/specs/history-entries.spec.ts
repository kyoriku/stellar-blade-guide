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

  // The drawer tells a navigation still rendering by the entry's key, which Contents and Back
  // to top leave alone, so neither looks like one and the search survives.
  test('the drawer keeps its search across a Contents jump and Back to top', async ({ page }) => {
    // The drawer's search answers nothing here, and leaves no Redis key behind.
    await page.route('**/api/search/**', route => route.fulfill({ json: { query: 'ca', total: 0, results: [] } }));
    // A pushed entry, which carries a key: a load's first entry reads 'default' with its state
    // wiped or not, so it couldn't tell the difference.
    await page.goto('/levels');
    await page.locator('a[href="/levels/eidos-7"]:not(#mobile-menu a):visible').first().click();
    await page.locator('section[id] article[id]').first().waitFor();
    expect((await entryState(page))?.key, 'a pushed entry').toBeTruthy();
    const toggle = page.getByRole('button', { name: 'Toggle menu' });
    const input = page.locator('#mobile-menu input[name="text"]');
    await toggle.click();
    await input.fill('ca');
    await toggle.click();

    await page.getByRole('button', { name: 'Open table of contents' }).click();
    await page.locator('a[href="#parking-tower"]:not(aside a)').click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#parking-tower');
    await toggle.click();
    await expect(input).toHaveValue('ca');
    await toggle.click();

    await page.getByRole('button', { name: 'Back to top' }).filter({ visible: true }).click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
    await toggle.click();
    await expect(input).toHaveValue('ca');
  });

  // The entry a visit starts on and a typed fragment both read 'default', and a Back, Forward
  // or typed address is never a navigation still rendering, so the drawer closes on one.
  test('a fragment typed while the drawer is open closes it', async ({ page }) => {
    await page.route('**/api/search/**', route => route.fulfill({ json: { query: 'ca', total: 0, results: [] } }));
    await page.goto('/levels/eidos-7');
    await page.locator('section[id] article[id]').first().waitFor();
    const toggle = page.getByRole('button', { name: 'Toggle menu' });
    await toggle.click();
    await page.locator('#mobile-menu input[name="text"]').fill('ca');
    await page.goto('/levels/eidos-7#parking-tower');
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#parking-tower');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#mobile-menu input[name="text"]')).toHaveValue('');
  });
});
