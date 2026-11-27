import { test, expect, type Locator, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';
import { tapAsSafari } from '../helpers/safari';
import { buildSlugMap } from '../../client/src/utils/slugify';

// The phone menu, the drawer under the menu button. When it closes without taking the reader
// anywhere (the menu button, Back, Forward or a move the site makes with focus in it, picking the
// page you're on), focus goes back to the menu button, unless it has moved on meanwhile. A link or
// a pick that lands somewhere leaves focus to the page, and Clear search keeps focus in the box.
// Focus checks after Back and Forward use entries with no fragment: Chromium clears focus after
// one that lands on a fragment naming an element.

const LEVEL = '/levels/eidos-7';
const XION = '/levels/xion';
const SUITS = '/cosmetics/nano-suits';
const CARDS = 'section[id] article[id]';

type Card = { id: number; title: string };

async function typeCards(page: Page, path: string): Promise<Card[]> {
  const res = await page.request.get(`/api${path}`);
  expect(res.status()).toBe(200);
  const levels = (await res.json()) as { locations: { collectibles: Card[] }[] }[];
  return levels.flatMap(l => l.locations.flatMap(loc => loc.collectibles));
}

// Every search answers these results: what's under test is where focus goes, not the ranking,
// and no Redis key is left behind.
async function stubSearch(page: Page, results: { kind: string; title: string; url: string }[]) {
  await page.route('**/api/search/**', route => route.fulfill({
    json: {
      query: 'e2e',
      total: results.length,
      results: results.map((r, i) => ({ kind: r.kind, id: i + 1, title: r.title, snippet: null, navigation_url: r.url, score: 4 })),
    },
  }));
}

const menuButton = (page: Page) => page.getByRole('button', { name: 'Toggle menu', exact: true });
const drawer = (page: Page) => page.locator('#mobile-menu');
const field = (page: Page) => drawer(page).getByPlaceholder('Search collectibles, walkthroughs, levels…');
const result = (page: Page, title: string) => drawer(page).getByRole('link', { name: title, exact: true });
const clearSearch = (page: Page) => drawer(page).getByRole('button', { name: 'Clear search', exact: true });
// The level page's own Next link, to the level after it.
const nextLink = (page: Page) => page.locator('main a').filter({ hasText: /^Next/ });

async function openDrawer(page: Page) {
  await menuButton(page).tap();
  await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(drawer(page)).not.toHaveAttribute('inert');
}

async function expectClosed(page: Page) {
  await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(drawer(page)).toHaveAttribute('inert', '');
}

// A level page has rendered in full: its heading, then its cards. The address changes before
// the page does, so a wait on the address alone would find the last page.
async function showsLevel(page: Page, name: string) {
  await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
  await expect(page.locator(CARDS).first()).toBeVisible();
}

// Counts focus events on the menu button from here on. It stays mounted across pages.
async function countMenuButtonFocus(page: Page) {
  await menuButton(page).evaluate(button => {
    const w = window as unknown as { menuButtonFocus?: number };
    if (w.menuButtonFocus === undefined) button.addEventListener('focus', () => { w.menuButtonFocus! += 1; });
    w.menuButtonFocus = 0;
  });
  return () => page.evaluate(() => (window as unknown as { menuButtonFocus: number }).menuButtonFocus);
}

// Counts the box's blur events from here on.
async function countBlurs(input: Locator) {
  await input.evaluate(el => {
    const w = window as unknown as { boxBlurs: number };
    w.boxBlurs = 0;
    el.addEventListener('blur', () => { w.boxBlurs += 1; });
  });
  return () => input.page().evaluate(() => (window as unknown as { boxBlurs: number }).boxBlurs);
}

const focusOnPage = (page: Page) => page.evaluate(() => document.activeElement === document.body);

// Records where focus is as the next click arrives, before the page's handlers run: the focused
// element's label or text, or 'nothing'.
async function focusAtClick(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { focusAtClick: string | null };
    w.focusAtClick = null;
    addEventListener('click', () => {
      const el = document.activeElement;
      w.focusAtClick = !el || el === document.body ? 'nothing' : el.getAttribute('aria-label') || el.textContent?.trim() || el.tagName;
    }, { capture: true, once: true });
  });
  return () => page.evaluate(() => (window as unknown as { focusAtClick: string | null }).focusAtClick);
}

// React runs what a press set off, its effects included, within two message turns.
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise(resolve => {
    const ch = new MessageChannel();
    let turns = 0;
    ch.port1.onmessage = () => (++turns === 2 ? resolve(null) : ch.port2.postMessage(null));
    ch.port2.postMessage(null);
  }));
}

// The browser's current entry: its length and React Router's key.
const entry = (page: Page) => page.evaluate(() => ({
  length: history.length,
  key: (history.state as { key?: string } | null)?.key,
}));

test.describe('the phone menu', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  // Focus starts in the box. Chromium's tap focuses the menu button; Safari's focuses nothing.
  for (const [how, press, safari] of [
    ['a tap', async (button: Locator) => { await button.tap(); }, false],
    ['a Safari-style tap', async (button: Locator) => { await tapAsSafari(button); }, true],
  ] as const) {
    test(`the menu button closes it by ${how}, and focus goes to the menu button`, async ({ page }) => {
      await page.goto('/privacy');
      await openDrawer(page);
      await field(page).focus();
      const tapped = await focusAtClick(page);
      await press(menuButton(page));
      if (safari) await expect.poll(tapped, 'the tap left focus on nothing').toBe('nothing');
      await expectClosed(page);
      await expect(menuButton(page)).toBeFocused();
    });
  }

  for (const [how, travel, lands] of [
    ['Back', (page: Page) => page.goBack(), LEVEL],
    ['Forward', (page: Page) => page.goForward(), XION],
  ] as const) {
    test(`${how} with focus in the box closes it, with focus on the menu button`, async ({ page }) => {
      await page.goto(LEVEL);
      await showsLevel(page, 'Eidos 7');
      await nextLink(page).click();
      await showsLevel(page, 'Xion');
      if (how === 'Forward') {
        await page.goBack();
        await showsLevel(page, 'Eidos 7');
      }
      await openDrawer(page);
      await field(page).focus();
      const focuses = await countMenuButtonFocus(page);
      await travel(page);
      await expect(page).toHaveURL(new RegExp(`${lands}$`));
      await expectClosed(page);
      await expect(menuButton(page)).toBeFocused();
      expect(await focuses(), 'one move, from the drawer').toBe(1);
    });
  }

  test('Back with focus outside it closes it and leaves focus where it is', async ({ page }) => {
    await page.goto(LEVEL);
    await showsLevel(page, 'Eidos 7');
    await nextLink(page).click();
    await showsLevel(page, 'Xion');
    await openDrawer(page);
    // The logo, outside the drawer: the keyboard reaches the bar with the drawer open.
    const logo = page.locator('nav a[href="/"]').first();
    await logo.focus();
    const focuses = await countMenuButtonFocus(page);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${LEVEL}$`));
    await expectClosed(page);
    await expect(logo).toBeFocused();
    expect(await focuses(), 'the menu button took no focus').toBe(0);
  });

  test('a typed fragment naming a section still closes it', async ({ page }) => {
    await page.goto(LEVEL);
    await showsLevel(page, 'Eidos 7');
    await openDrawer(page);
    await field(page).focus();
    // Chromium clears focus after this fragment, as it names an element, so focus isn't checked.
    await page.evaluate(() => { location.hash = '#parking-tower'; });
    await expect(page).toHaveURL(new RegExp(`${LEVEL}#parking-tower$`));
    await expectClosed(page);
  });

  test("a move the site makes, with focus in the box, closes it with focus on the menu button", async ({ page }) => {
    // A reset that lands sends the reader to sign in three seconds later.
    await page.route('**/api/auth/reset-password', route => route.fulfill({ json: {} }));
    await page.goto('/reset-password?token=e2e-not-a-token');
    await page.getByLabel('New password', { exact: true }).fill('e2e-Password-456');
    await page.getByRole('button', { name: 'Update password', exact: true }).tap();
    await expect(page.getByRole('heading', { name: 'Password updated', exact: true })).toBeVisible();
    await openDrawer(page);
    await field(page).focus();
    const focuses = await countMenuButtonFocus(page);
    await expect(page).toHaveURL('/login');
    await expectClosed(page);
    await expect(menuButton(page)).toBeFocused();
    expect(await focuses(), 'one move, from the drawer').toBe(1);
  });

  for (const [how, press, pressed] of [
    ['a tap', async (x: Locator) => { await x.tap(); }, true],
    ['a Safari-style tap', async (x: Locator) => { await tapAsSafari(x); }, true],
    ['the keyboard', async (x: Locator) => { await x.page().keyboard.press('Tab'); await expect(x).toBeFocused(); await x.page().keyboard.press('Enter'); }, false],
  ] as const) {
    test(`Clear search by ${how} empties the box and keeps the drawer open, with focus in the box`, async ({ page }) => {
      await stubSearch(page, [{ kind: 'level', title: 'E2E page', url: LEVEL }]);
      await page.goto('/privacy');
      await openDrawer(page);
      await field(page).fill('e2e');
      await expect(result(page, 'E2E page')).toBeVisible();
      await field(page).focus();
      const blurs = await countBlurs(field(page));
      await press(clearSearch(page));
      await expect(field(page)).toHaveValue('');
      await expect(field(page)).toBeFocused();
      await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'true');
      if (pressed) expect(await blurs(), 'the box kept focus throughout').toBe(0);
    });
  }

  for (const [how, choose, safari] of [
    ['a tap', async (link: Locator) => { await link.tap(); }, false],
    ['a Safari-style tap', async (link: Locator) => { await tapAsSafari(link); }, true],
    ['Enter', async (link: Locator) => { await link.focus(); await link.press('Enter'); }, false],
  ] as const) {
    test(`picking the page you're on by ${how} closes it with focus on the menu button, and adds no entry`, async ({ page }) => {
      await stubSearch(page, [{ kind: 'level', title: 'E2E page', url: LEVEL }]);
      await page.goto(LEVEL);
      await showsLevel(page, 'Eidos 7');
      await openDrawer(page);
      await field(page).fill('e2e');
      await expect(result(page, 'E2E page')).toBeVisible();
      const before = await entry(page);
      const focuses = await countMenuButtonFocus(page);
      const tapped = await focusAtClick(page);
      await choose(result(page, 'E2E page'));
      if (safari) await expect.poll(tapped, 'the tap left focus on nothing').toBe('nothing');
      await expectClosed(page);
      await expect(menuButton(page)).toBeFocused();
      expect(await focuses(), 'one move').toBe(1);
      await expect.poll(async () => (await entry(page)).key, 'the pick navigated').not.toBe(before.key);
      expect((await entry(page)).length, 'no entry added').toBe(before.length);
    });
  }

  test("picking the page you're on after arriving with a tracking query closes it with focus on the menu button, and adds no entry", async ({ page }) => {
    await stubSearch(page, [{ kind: 'level', title: 'E2E page', url: LEVEL }]);
    // Arrived from another page, on an address with a tracking query.
    await page.goto('/');
    await page.goto(`${LEVEL}?fbclid=e2e`);
    await showsLevel(page, 'Eidos 7');
    await openDrawer(page);
    await field(page).fill('e2e');
    await expect(result(page, 'E2E page')).toBeVisible();
    const before = await entry(page);
    const focuses = await countMenuButtonFocus(page);
    await result(page, 'E2E page').tap();
    await expectClosed(page);
    await expect(menuButton(page)).toBeFocused();
    expect(await focuses(), 'one move').toBe(1);
    await expect.poll(async () => (await entry(page)).key, 'the pick navigated').not.toBe(before.key);
    expect((await entry(page)).length, 'no entry added').toBe(before.length);
  });

  for (const [where, from] of [['on another page', '/privacy'], ['on the page you are on', SUITS]] as const) {
    test(`a tap on a result for a card ${where} hands focus to the card's heading`, async ({ page }) => {
      const cards = await typeCards(page, SUITS);
      const id = buildSlugMap(cards).get(cards[Math.floor(cards.length / 2)].id)!;
      await stubSearch(page, [{ kind: 'cosmetics', title: 'E2E card', url: `${SUITS}#${id}` }]);
      await page.goto(from);
      if (from === SUITS) await page.locator(CARDS).first().waitFor();
      await openDrawer(page);
      await field(page).fill('e2e');
      await expect(result(page, 'E2E card')).toBeVisible();
      const focuses = await countMenuButtonFocus(page);
      await result(page, 'E2E card').tap();
      await expect(page.locator(`article[id="${id}"] h2`)).toBeFocused();
      await expectClosed(page);
      expect(await focuses(), 'the menu button took no focus').toBe(0);
    });
  }

  test('a tap on a link in its sections leaves focus on the page it opens, and the menu button takes none', async ({ page }) => {
    await page.goto(LEVEL);
    await showsLevel(page, 'Eidos 7');
    await openDrawer(page);
    const focuses = await countMenuButtonFocus(page);
    // The Levels section is open on a level page.
    await drawer(page).getByRole('link', { name: 'Xion', exact: true }).tap();
    await showsLevel(page, 'Xion');
    await expectClosed(page);
    await settle(page);
    expect(await focusOnPage(page), 'focus on the page').toBe(true);
    expect(await focuses(), 'the menu button took no focus').toBe(0);
  });
});
