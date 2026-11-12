import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';
import { readFixtures } from '../helpers/db';

// Every page path is lowercase, so an address typed, shared or printed with capitals lands on its
// lowercase spelling, which then decides the page. In production the server's 301 comes first
// (server-meta.spec.ts); on the Vite dev server the client does it, before the router starts
// for a first visit (main.tsx) and at RootLayout for a link inside the app.

const SITE = 'https://stellarbladeguide.com';
const OFFSET = 97;
const heading = (page: Page) => page.getByRole('heading', { level: 1 });

// Has the page jumped to card `id`, or to its section when it is the section's first card?
async function expectLanded(page: Page, id: string) {
  await expect(async () => {
    const top = await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const section = el.closest('section[id]');
      return Math.round((section?.querySelector('article') === el ? section! : el).getBoundingClientRect().top);
    }, id);
    expect(top).not.toBeNull();
    expect(Math.abs(top! - OFFSET)).toBeLessThanOrEqual(1);
  }).toPass({ timeout: 10_000 });
}

test.describe('addresses with capitals', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  for (const [typed, landed, h1] of [
    ['/UPGRADES/weapon-cores', '/upgrades/weapon-cores', 'Weapon Cores'],
    // Collectibles' Documents rendered here: the Upgrades category has no such type.
    ['/UPGRADES/documents', '/upgrades/documents', 'Page Not Found'],
    ['/upgrades/WEAPON-CORES', '/upgrades/weapon-cores', 'Weapon Cores'],
    ['/Levels/Eidos-7', '/levels/eidos-7', 'Eidos 7'],
    ['/levels/%45idos-7', '/levels/eidos-7', 'Eidos 7'],
    ['/LEVELS', '/levels', 'Levels'],
    // It passes no canonical of its own, so it named itself canonical in capitals.
    ['/PRIVACY', '/privacy', 'Privacy Policy'],
    // The query and the hash keep their spelling: a reset token is mixed case.
    ['/RESET-PASSWORD?token=AbC#x', '/reset-password?token=AbC#x', 'Set new password'],
  ]) {
    test(`${typed} lands on ${landed}`, async ({ page }) => {
      await page.goto(typed);
      await expect(heading(page)).toHaveText(h1);
      await expect(page).toHaveURL(landed);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', SITE + landed.split(/[?#]/)[0]);
    });
  }

  test('a walkthrough address with capitals asks the API in lowercase', async ({ page }) => {
    const fx = readFixtures();
    const asked: string[] = [];
    page.on('request', request => {
      const { pathname } = new URL(request.url());
      if (pathname.startsWith('/api/walkthroughs/')) asked.push(pathname);
    });
    await page.goto(`/WALKTHROUGHS/E2E-FIXTURE/${fx.walkthroughSlug.toUpperCase()}`);
    await expect(page.getByRole('heading', { level: 1, name: fx.walkthroughTitle })).toBeVisible();
    await expect(page).toHaveURL(`/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`);
    expect(asked).toContain(`/api/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`);
    expect(asked.filter(path => path !== path.toLowerCase())).toEqual([]);
  });

  test('a typed address with capitals is still a typed address', async ({ page }) => {
    await page.goto('/cosmetics/nano-suits');
    const id = (await page.locator('section[id] article[id]').nth(2).getAttribute('id'))!;
    await page.goto(`/COSMETICS/Nano-Suits#${id}`);
    await expect(page).toHaveURL(`/cosmetics/nano-suits#${id}`);
    await expectLanded(page, id);
    // A typed address leaves focus alone. A replace made by the router would read as a link
    // and hand focus to the card's heading (jump-focus.spec.ts).
    await expect(page.locator(`article[id="${id}"] h2`)).not.toBeFocused();
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    // Replaced in place: one Back leaves it.
    await page.goBack();
    await expect(page).toHaveURL('/cosmetics/nano-suits');
  });

  test('a link inside the app with capitals lands on its lowercase spelling', async ({ page }) => {
    // The fixture card's wikilink, given capitals, a query and a hash, as a typo in seed text would.
    const fx = readFixtures();
    await page.route('**/api/levels/eidos-7', async route => {
      const response = await route.fetch();
      type Location = { collectibles: { title: string; description: { content: string } }[] };
      const locations = (await response.json()) as Location[];
      const card = locations.flatMap(location => location.collectibles).find(c => c.title === fx.collectibleTitle)!;
      card.description.content = card.description.content.replace('[[levels/eidos-7|', '[[UPGRADES/Weapon-Cores?from=e2e#e2e-hash|');
      await route.fulfill({ response, json: locations });
    });
    await page.goto('/levels/eidos-7');
    await page.getByRole('link', { name: 'Eidos 7 page', exact: true }).click();
    await expect(heading(page)).toHaveText('Weapon Cores');
    await expect(page).toHaveURL('/upgrades/weapon-cores?from=e2e#e2e-hash');
    // Replaced, not pushed: one Back returns to the level page.
    await page.goBack();
    await expect(page).toHaveURL('/levels/eidos-7');
    await expect(heading(page)).toHaveText('Eidos 7');
  });

  test('an API address with capitals is left as it is', async ({ page }) => {
    // Never rewritten into the API, where a reload would answer JSON.
    await page.goto('/API/levels');
    await expect(heading(page)).toHaveText('Page Not Found');
    await expect(page).toHaveURL('/API/levels');
  });
});
