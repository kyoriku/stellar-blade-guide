import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// The level and type pages' cycle pills, and the type page's A–Z toggle, say which is
// on through aria-pressed: the tint shows it only to someone who can see it.

// Each cycle pill is titled "Show …", All included.
const cyclePills = (page: Page) => page.locator('main button[title^="Show "]');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

// The row's pills as the page renders them, with only `selected` pressed.
async function expectSelected(page: Page, selected: string): Promise<string[]> {
  await expect(cyclePills(page).first()).toBeVisible();
  const labels = await cyclePills(page).allTextContents();
  expect(labels.length, 'a row of pills').toBeGreaterThan(1);
  for (const label of labels) {
    await expect(button(page, label), label).toHaveAttribute('aria-pressed', String(label === selected));
  }
  return labels;
}

async function expectToggles(page: Page): Promise<void> {
  const az = button(page, 'A–Z');
  await expect(az).toHaveAttribute('aria-pressed', 'false');
  await az.click();
  await expect(az).toHaveAttribute('aria-pressed', 'true');
  await az.click();
  await expect(az).toHaveAttribute('aria-pressed', 'false');
}

// React can set aside a render it has started and begin it again, here because a press
// lands while the new page renders. StructuredData turns the page's crumbs into JSON
// as it renders, so JSON naming `path` shows the new page has rendered once; a press
// queued then lands before React finishes, and React renders the page again from the
// start. The search button's press sets state outside the page, so it changes no
// filter itself.
async function navigateWithRestart(page: Page, path: string): Promise<void> {
  await page.evaluate((path) => {
    const press = document.querySelector<HTMLElement>('button[aria-label="Search (Ctrl+K)"]')!;
    const stringify = JSON.stringify;
    JSON.stringify = function (this: JSON, ...args: Parameters<typeof JSON.stringify>) {
      const [value] = args;
      if (Array.isArray(value) && value.some(crumb => (crumb as { path?: string } | null)?.path === path)) {
        JSON.stringify = stringify;
        (window as unknown as { restarted?: boolean }).restarted = true;
        queueMicrotask(() => press.click());
      }
      return stringify.apply(this, args);
    } as typeof JSON.stringify;
    // The page's own link: the nav and the drawer hold hidden copies.
    Array.from(document.querySelectorAll<HTMLElement>(`main a[href="${path}"]`)).find(a => a.checkVisibility())!.click();
  }, path);
  await expect.poll(() => page.evaluate(() => (window as unknown as { restarted?: boolean }).restarted),
    'the new page rendered, and the press landed while it did').toBe(true);
}

test.describe('filter pills', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test("a level page's cycle pills say which one is selected", async ({ page }) => {
    await page.goto('/levels/eidos-7');
    const labels = await expectSelected(page, 'All');
    const last = labels[labels.length - 1];
    await button(page, last).click();
    await expectSelected(page, last);
  });

  test("a type page's cycle pills and its A–Z say which is on", async ({ page }) => {
    await page.goto('/cosmetics/nano-suits');
    const labels = await expectSelected(page, 'All');
    const last = labels[labels.length - 1];
    await button(page, last).click();
    await expectSelected(page, last);
    await expectToggles(page);
  });

  test('a new level starts on All, even when React renders it twice', async ({ page }) => {
    // Xion first, so its data is cached and the move back renders it in full.
    await page.goto('/levels/xion');
    await expectSelected(page, 'All');
    await page.locator('main a[href="/levels/eidos-7"]:visible').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Eidos 7');
    const labels = await expectSelected(page, 'All');
    const last = labels[labels.length - 1];
    await button(page, last).click();
    await expectSelected(page, last);

    await navigateWithRestart(page, '/levels/xion');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Xion');
    await expectSelected(page, 'All');
    await expect(page.getByText(/^\d+ collectibles$/)).toBeVisible();
  });

  test('a new type starts with A–Z off, even when React renders it twice', async ({ page }) => {
    // Documents first, so its data is cached and the move back renders it in full.
    await page.goto('/collectibles/documents');
    const az = button(page, 'A–Z');
    await expect(az).toHaveAttribute('aria-pressed', 'false');
    await page.locator('main a[href="/collectibles/cans"]:visible').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cans');
    await az.click();
    await expect(az).toHaveAttribute('aria-pressed', 'true');

    await navigateWithRestart(page, '/collectibles/documents');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Documents');
    await expect(az).toHaveAttribute('aria-pressed', 'false');
  });

  test("a type page with one cycle shows no pills, and its A–Z says when it's on", async ({ page }) => {
    await page.goto('/collectibles/cans');
    await expect(button(page, 'A–Z')).toBeVisible();
    await expect(cyclePills(page)).toHaveCount(0);
    await expectToggles(page);
  });
});
