import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';
import { holdRoute } from '../helpers/route';

// Each history entry keeps the filters its level or type page showed (utils/entryFilters.ts),
// so Back, Forward and a reload put them back, and the browser's restored scroll offset meets
// the layout it was saved under. A pushed entry, and a new tab, open on All. These check state:
// the filters, the record, and the cards on screen, never a scroll offset.

const TYPE = '/cosmetics/nano-suits';
const DOCUMENTS = '/collectibles/documents';
const CARDS = 'section[id] article[id]';

const pill = (page: Page, label: string) => page.getByRole('button', { name: label, exact: true });
const azToggle = (page: Page) => page.getByRole('button', { name: 'A–Z', exact: true });
const recordOf = (page: Page) => page.evaluate(() =>
  (history.state as { usr?: { sbFilters?: unknown } | null } | null)?.usr?.sbFilters ?? null);
const cardIds = (page: Page) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map(a => a.id), CARDS);
const pressed = (page: Page, label: string) => expect(pill(page, label)).toHaveAttribute('aria-pressed', 'true');

// A same-page wikilink on a card that stays on screen under All.
async function samePageLink(page: Page): Promise<string> {
  await page.locator(CARDS).first().waitFor();
  const href = await page.evaluate((path) => {
    for (const a of document.querySelectorAll<HTMLAnchorElement>(`article a[href^="${path}#"]`)) {
      const href = a.getAttribute('href')!;
      if (document.getElementById(decodeURIComponent(href.slice(href.indexOf('#') + 1)))) return href;
    }
    return null;
  }, TYPE);
  expect(href, `a card on ${TYPE} links another card on it`).not.toBeNull();
  return href!;
}
const followLink = (page: Page, href: string) =>
  page.locator(`article a[href="${href}"]`).first().evaluate(a => (a as HTMLElement).click());

test.describe('filter memory', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('Back from the next type puts back the filters this one showed', async ({ page }) => {
    await page.goto(TYPE);
    await page.locator(CARDS).first().waitFor();
    await pill(page, 'NG+').click();
    await azToggle(page).click();
    await expect(azToggle(page)).toHaveAttribute('aria-pressed', 'true');
    const ids = await cardIds(page);

    await page.locator('a').filter({ hasText: /^Next/ }).click();
    await expect(page).not.toHaveURL(new RegExp(`${TYPE}$`));
    await page.locator(CARDS).first().waitFor();
    await pressed(page, 'All');

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${TYPE}$`));
    await pressed(page, 'NG+');
    await expect(azToggle(page)).toHaveAttribute('aria-pressed', 'true');
    expect(await cardIds(page)).toEqual(ids);
    expect(await recordOf(page)).toEqual({ v: 1, path: TYPE, cycle: 'NG+', subtype: 'All', sort: 'alphabetical' });
  });

  test('Back from another page puts back the filter the level showed', async ({ page }) => {
    await page.goto('/levels/eidos-7');
    await page.locator(CARDS).first().waitFor();
    await pill(page, 'NG++').click();
    const ids = await cardIds(page);
    await page.locator('footer a[href="/privacy"]').click();
    await expect(page).toHaveURL(/\/privacy$/);
    await page.goBack();
    await page.locator(CARDS).first().waitFor();
    await pressed(page, 'NG++');
    expect(await cardIds(page)).toEqual(ids);
  });

  // Xion holds no NG++, so a filter left over from Wasteland must not decide what Xion's
  // entry gets back.
  test('Back to a level puts back its cycle, though the level left was on one it lacks', async ({ page }) => {
    await page.goto('/levels/xion');
    await page.locator(CARDS).first().waitFor();
    await expect(pill(page, 'NG++'), 'Xion holds no NG++').toHaveCount(0);
    await pill(page, 'NG+').click();
    await page.locator('a[href="/levels/wasteland"]').filter({ hasText: /^Next/ }).click();
    await expect(page).toHaveURL(/\/levels\/wasteland$/);
    await page.locator(CARDS).first().waitFor();
    await pill(page, 'NG++').click();

    await page.goBack();
    await expect(page).toHaveURL(/\/levels\/xion$/);
    await pressed(page, 'NG+');
    expect(await recordOf(page)).toEqual({ v: 1, path: '/levels/xion', cycle: 'NG+', subtype: 'All', sort: 'default' });
  });

  test("a reload keeps each page's filters, and a new tab opens on All", async ({ page, context }) => {
    await page.goto(TYPE);
    await page.locator(CARDS).first().waitFor();
    await pill(page, 'NG+').click();
    await azToggle(page).click();
    await page.reload();
    await page.locator(CARDS).first().waitFor();
    await pressed(page, 'NG+');
    await expect(azToggle(page)).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/levels/eidos-7');
    await page.locator(CARDS).first().waitFor();
    await pill(page, 'NG++').click();
    await page.reload();
    await page.locator(CARDS).first().waitFor();
    await pressed(page, 'NG++');

    const tab = await context.newPage();
    await tab.goto(TYPE);
    await tab.locator(CARDS).first().waitFor();
    await pressed(tab, 'All');
    await expect(azToggle(tab)).toHaveAttribute('aria-pressed', 'false');
  });

  test("Back and Forward on one page put back each entry's filter", async ({ page }) => {
    await page.goto(TYPE);
    const href = await samePageLink(page);
    await followLink(page, href);
    await expect.poll(() => page.evaluate(() => location.hash)).not.toBe('');
    await pill(page, 'NG+').click();
    await expect.poll(() => recordOf(page)).not.toBeNull();

    await page.goBack();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
    await pressed(page, 'All');
    expect(await recordOf(page)).toBeNull();
    await page.goForward();
    await expect.poll(() => page.evaluate(() => location.hash)).not.toBe('');
    await pressed(page, 'NG+');
  });

  // The entry's filter is back in the render React makes inside the popstate event, before
  // the browser restores the scroll offset it saved under that filter. A listener added after
  // the router's runs once that render is on the page.
  test('the filter is back while the popstate event is still being handled', async ({ page }) => {
    await page.goto(TYPE);
    const href = await samePageLink(page);
    await followLink(page, href);
    await expect.poll(() => page.evaluate(() => location.hash)).not.toBe('');
    await pill(page, 'NG+').click();
    await expect.poll(() => recordOf(page)).not.toBeNull();
    await page.goBack();
    await pressed(page, 'All');

    await page.evaluate(() => {
      const seen: string[] = [];
      (window as unknown as { pressedAtPop: string[] }).pressedAtPop = seen;
      window.addEventListener('popstate', () => {
        seen.push([...document.querySelectorAll('button[aria-pressed="true"][title^="Show "]')].map(b => b.textContent).join());
      });
    });
    await page.goForward();
    await expect.poll(() => page.evaluate(() => (window as unknown as { pressedAtPop: string[] }).pressedAtPop)).toEqual(['NG+']);
  });

  test('a reload and Back from another page keep the Documents subtype', async ({ page }) => {
    await page.goto(DOCUMENTS);
    await page.locator(CARDS).first().waitFor();
    const select = page.locator('select[title$="of a specific subtype"]');
    const subtype = (await select.locator('option:not([value="All"])').first().getAttribute('value'))!;
    await select.selectOption(subtype);
    await page.reload();
    await page.locator(CARDS).first().waitFor();
    await expect(select).toHaveValue(subtype);
    await page.locator('footer a[href="/privacy"]').click();
    await expect(page).toHaveURL(/\/privacy$/);
    await page.goBack();
    await page.locator(CARDS).first().waitFor();
    await expect(select).toHaveValue(subtype);
  });

  test("Back and Forward on one level put back each entry's cycle", async ({ page }) => {
    const res = await page.request.get('/api/levels/eidos-7');
    expect(res.status()).toBe(200);
    const ngPlus = ((await res.json()) as { collectibles: { id: number; cycle: string }[] }[])
      .flatMap(loc => loc.collectibles).find(c => c.cycle === 'NG+')!;
    const hash = `#collectible-${ngPlus.id}`;
    // A result for one of the level's NG+ cards: a second entry on the same page.
    await page.route('**/api/search/**', route => route.fulfill({
      json: { query: 'e2e', total: 1, results: [{ kind: 'level', id: 1, title: 'E2E result', snippet: null, navigation_url: `/levels/eidos-7${hash}`, score: 4 }] },
    }));
    await page.goto('/levels/eidos-7');
    await page.locator(CARDS).first().waitFor();
    await pill(page, 'NG+').click();
    await page.keyboard.press('Control+k');
    await page.getByPlaceholder('Search\u2026').fill('e2e');
    await page.locator('.animate-drop-in a').first().click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(hash);
    await pressed(page, 'NG+');
    await pill(page, 'NG++').click();

    await page.goBack();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
    await pressed(page, 'NG+');
    await page.goForward();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(hash);
    await pressed(page, 'NG++');
  });

  test("a remembered filter the page doesn't offer goes back to All", async ({ page }) => {
    const remember = (path: string, filters: Record<string, string>) => page.evaluate(({ path, filters }) => {
      const state = (history.state ?? {}) as { usr?: Record<string, unknown> | null };
      const record = { v: 1, path, cycle: 'All', subtype: 'All', sort: 'default', ...filters };
      history.replaceState({ ...state, usr: { ...(state.usr ?? {}), sbFilters: record } }, '');
    }, { path, filters });

    await page.goto('/levels/xion');
    await page.locator(CARDS).first().waitFor();
    await remember('/levels/xion', { cycle: 'NG++' });
    await page.reload();
    await pressed(page, 'All');
    await expect.poll(() => recordOf(page)).toBeNull();

    await page.goto(DOCUMENTS);
    await page.locator(CARDS).first().waitFor();
    await remember(DOCUMENTS, { subtype: 'No Such Subtype' });
    await page.reload();
    await expect(page.locator('select[title$="of a specific subtype"]')).toHaveValue('All');
    await expect.poll(() => recordOf(page)).toBeNull();
  });

  test('while a reload that keeps a filter loads, the placeholders show it', async ({ page }) => {
    const placeholder = (label: string) => page.locator('div.rounded-lg.border').filter({ hasText: new RegExp(`^${label}$`) });
    await page.goto('/levels/eidos-7');
    await page.locator(CARDS).first().waitFor();
    await pill(page, 'NG+').click();
    const level = await holdRoute(page, '**/api/levels/eidos-7');
    await page.reload();
    await level.seen;
    await expect(placeholder('All')).toHaveClass(/text-gray-400/);
    level.release();
    await pressed(page, 'NG+');

    await page.goto(TYPE);
    await page.locator(CARDS).first().waitFor();
    await azToggle(page).click();
    const type = await holdRoute(page, `**/api${TYPE}`);
    await page.reload();
    await type.seen;
    await expect(placeholder('A\u2013Z')).toHaveClass(/text-cyan-400/);
    type.release();
    await expect(azToggle(page)).toHaveAttribute('aria-pressed', 'true');
  });

  test("a Contents jump keeps the entry's filters", async ({ page }) => {
    await page.goto(TYPE);
    await page.locator(CARDS).first().waitFor();
    await pill(page, 'NG+').click();
    await expect.poll(() => recordOf(page)).not.toBeNull();
    await page.locator('aside nav a[href^="#"]').first().click();
    await expect.poll(() => page.evaluate(() => location.hash)).not.toBe('');
    await page.reload();
    await page.locator(CARDS).first().waitFor();
    await pressed(page, 'NG+');
  });

  test('Back between two entries of one page closes the lightbox', async ({ page }) => {
    await page.goto(TYPE);
    const href = await samePageLink(page);
    await followLink(page, href);
    await expect.poll(() => page.evaluate(() => location.hash)).not.toBe('');
    await page.locator('article button[type="button"]').filter({ has: page.locator('img') }).first().click();
    await expect(page.locator('.yarl__portal')).toHaveCount(1);
    await page.goBack();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
    await expect(page.locator('.yarl__portal')).toHaveCount(0);
  });
});
