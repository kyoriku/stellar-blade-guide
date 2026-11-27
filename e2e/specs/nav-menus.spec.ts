import { test, expect, type Locator, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';
import { pressAsSafari, tapAsSafari } from '../helpers/safari';

// The desktop nav menus (components/navbar/DesktopDropdown.tsx) open from their arrow by
// keyboard as well as by hover. The arrow's press used to bubble to the menu's own click,
// which closes it, so Enter and Space left a menu shut and its items out of reach. Escape
// closes an open menu, focus leaving it closes it, and keyboard focus lights an item. Back,
// Forward and a typed fragment close an open menu, as they close the account menu, giving
// focus back to the arrow when it was in the menu. A menu opened while a page still renders
// stays open as that page arrives. Escape closes an open menu with focus on its arrow, its
// link or an item, or on nothing, as a tap or Safari's click on the arrow leaves it, giving
// focus to the arrow from an item, or from nothing when the arrow opened the menu; with
// focus elsewhere, in the open search say, the menu stays open, even where the search's own
// Escape gives focus back inside it. With focus on nothing and the search or the bell's panel
// open as well, Escape closes only that, giving focus back: one Escape closes one panel.

test.use({ viewport: { width: 1280, height: 800 } });

// The Levels menu: its arrow, the section's own link beside it, the panel the arrow names, and
// the panel's links.
async function levelsMenu(page: Page) {
  const arrow = page.getByRole('button', { name: 'Toggle levels menu' });
  const panel = page.locator(`[id="${await arrow.getAttribute('aria-controls')}"]`);
  return { arrow, label: arrow.locator('xpath=preceding-sibling::a'), panel, items: panel.getByRole('link') };
}

const focusInside = (panel: ReturnType<Page['locator']>) => panel.evaluate(el => el.contains(document.activeElement));

const focusOnPage = (page: Page) => page.evaluate(() => document.activeElement === document.body);

// Opens the Levels menu from its arrow and moves focus to its first item, with the mouse parked
// away from the bar: a menu that slides in under a resting pointer can close at the next layout.
async function openOnItem(page: Page) {
  const menu = await levelsMenu(page);
  await page.mouse.move(5, 700);
  await menu.arrow.focus();
  await page.keyboard.press('Enter');
  await expect(menu.arrow).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await expect(menu.items.first()).toBeFocused();
  return menu;
}

// Follows the footer's Terms link from the keyboard: a second entry in this tab's history. Neither
// address has a fragment, so Back and Forward between them land on none: Chromium clears focus
// after a popstate that lands on a fragment naming an element.
async function toTerms(page: Page): Promise<void> {
  await page.getByRole('navigation', { name: 'Footer', exact: true })
    .getByRole('link', { name: 'Terms', exact: true }).press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms of Service');
}

// Counts focus events on `target` from here on.
async function countFocus(target: Locator): Promise<() => Promise<number>> {
  await target.evaluate(el => {
    const w = window as unknown as { focusCount: number };
    w.focusCount = 0;
    el.addEventListener('focus', () => { w.focusCount += 1; });
  });
  return () => target.page().evaluate(() => (window as unknown as { focusCount: number }).focusCount);
}

// Records each element focus lands on from here on, by its label or its text.
async function recordLandings(page: Page): Promise<() => Promise<string[]>> {
  await page.evaluate(() => {
    const w = window as unknown as { landings: string[] };
    w.landings = [];
    document.addEventListener('focusin', e => {
      const el = e.target as Element;
      w.landings.push(el.getAttribute('aria-label') || el.textContent?.trim() || el.tagName);
    }, true);
  });
  return () => page.evaluate(() => (window as unknown as { landings: string[] }).landings);
}

// A level page has rendered in full: its heading, then its cards. The address changes before the
// page does, so a wait on the address alone would find the last page.
async function showsLevel(page: Page, name: string): Promise<void> {
  await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
  await expect(page.locator('section[id] article[id]').first()).toBeVisible();
}

// Eidos 7, reached by Back from Xion: Xion's data is cached, so the move back to it renders in
// full, across React's yields, and a Back that cancels it hands React Router the location it
// already had.
async function eidos7ByBack(page: Page): Promise<void> {
  await page.goto('/levels/eidos-7');
  await showsLevel(page, 'Eidos 7');
  await page.locator('main a').filter({ hasText: /^Next/ }).click();
  await showsLevel(page, 'Xion');
  await page.goBack();
  await showsLevel(page, 'Eidos 7');
}

// Follows the level page's Next link to `path` with a click from script, which moves no focus and
// fires no pointer event, and goes Back as React renders that page: StructuredData turns its crumbs
// into JSON as it renders (as in contents-drawer.spec.ts). Records whether Back landed, and each
// heading shown, from the one on screen now.
const backWhileRendering = (page: Page, path: string) => page.evaluate((path) => {
  const w = window as unknown as { popped: boolean; headings: string[] };
  w.popped = false;
  w.headings = [document.querySelector('main h1')?.textContent ?? ''];
  addEventListener('popstate', () => { w.popped = true; }, { once: true });
  new MutationObserver(() => {
    const heading = document.querySelector('main h1')?.textContent ?? '';
    if (w.headings.at(-1) !== heading) w.headings.push(heading);
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
  const stringify = JSON.stringify;
  JSON.stringify = function (this: JSON, ...args: Parameters<typeof JSON.stringify>) {
    const [value] = args;
    if (Array.isArray(value) && value.some(crumb => (crumb as { path?: string } | null)?.path === path)) {
      JSON.stringify = stringify;
      setTimeout(() => history.back(), 0);
    }
    return stringify.apply(this, args);
  } as typeof JSON.stringify;
  Array.from(document.querySelectorAll<HTMLAnchorElement>(`main a[href="${path}"]`))
    .find(a => /^Next/.test(a.textContent ?? ''))!.click();
}, path);

// The Levels menu as its open left it: aria-expanded, whether focus was in its panel, and the
// heading on screen.
interface Opened { open: string | null; inPanel: boolean; heading: string }

// Follows the level page's Next link to `path` with a click from script and, while React renders
// that page, opens the Levels menu with a click on its arrow from script and puts focus on its
// first item: StructuredData turns the page's crumbs into JSON as it renders, and a press queued
// then lands when React next yields (as in contents-drawer.spec.ts). Records what the open left,
// and each heading shown, from the one on screen now. With `thenBack`, Back follows the open
// before that page can commit.
const openWhileRendering = (page: Page, path: string, thenBack = false) => page.evaluate(({ path, thenBack }) => {
  const w = window as unknown as { opened: Opened | null; popped: boolean; headings: string[] };
  w.opened = null;
  w.popped = false;
  w.headings = [document.querySelector('main h1')?.textContent ?? ''];
  addEventListener('popstate', () => { w.popped = true; }, { once: true });
  new MutationObserver(() => {
    const heading = document.querySelector('main h1')?.textContent ?? '';
    if (w.headings.at(-1) !== heading) w.headings.push(heading);
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
  const arrow = document.querySelector<HTMLElement>('button[aria-label="Toggle levels menu"]')!;
  const panel = document.getElementById(arrow.getAttribute('aria-controls')!)!;
  const stringify = JSON.stringify;
  JSON.stringify = function (this: JSON, ...args: Parameters<typeof JSON.stringify>) {
    const [value] = args;
    if (Array.isArray(value) && value.some(crumb => (crumb as { path?: string } | null)?.path === path)) {
      JSON.stringify = stringify;
      queueMicrotask(async () => {
        arrow.click();
        // React commits the press in a microtask.
        await Promise.resolve();
        await Promise.resolve();
        panel.querySelector('a')!.focus();
        w.opened = {
          open: arrow.getAttribute('aria-expanded'),
          inPanel: panel.contains(document.activeElement),
          heading: document.querySelector('main h1')?.textContent ?? '',
        };
        if (thenBack) setTimeout(() => history.back(), 0);
      });
    }
    return stringify.apply(this, args);
  } as typeof JSON.stringify;
  Array.from(document.querySelectorAll<HTMLAnchorElement>(`main a[href="${path}"]`))
    .find(a => /^Next/.test(a.textContent ?? ''))!.click();
}, { path, thenBack });

const opened = (page: Page) => page.evaluate(() => (window as unknown as { opened: Opened | null }).opened);

// Lets everything a tap set off run, React's effects included: two message turns.
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise(resolve => {
    const ch = new MessageChannel();
    let turns = 0;
    ch.port1.onmessage = () => (++turns === 2 ? resolve(null) : ch.port2.postMessage(null));
    ch.port2.postMessage(null);
  }));
}

test.describe('desktop nav menus', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
    // No menu is the current section here, and the mouse never comes near the bar.
    await page.goto('/privacy');
  });

  test('a menu opens from the keyboard, focus in it shows, and Escape closes it with focus back on the arrow', async ({ page }) => {
    const { arrow, items } = await levelsMenu(page);
    await arrow.focus();
    await page.keyboard.press('Enter');
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await expect(items.first()).toBeVisible();
    // Space works as well, both ways.
    await page.keyboard.press('Space');
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Space');
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');

    // Tab reaches the items, and a focused item lights as a hovered one does (white text
    // on a tint), since the panel clips an outline drawn outside a full-width link.
    await page.keyboard.press('Tab');
    await expect(items.first()).toBeFocused();
    await expect(items.first()).toHaveCSS('color', 'rgb(255, 255, 255)');
    expect(await items.first().evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');

    await page.keyboard.press('Escape');
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    await expect(arrow).toBeFocused();
  });

  test("a menu's items can take focus in the frame it opens", async ({ page }) => {
    // All in one task: the press, React's commit (a microtask), then the reads, before any
    // frame runs. The panel fades in, and with visibility in that transition it stayed
    // hidden until the fade's first step, so a Tab straight after Enter skipped the items
    // (and closed the menu as focus left).
    const { arrow } = await levelsMenu(page);
    const seen = await arrow.evaluate(async el => {
      el.click();
      await Promise.resolve();
      await Promise.resolve();
      const panel = document.getElementById(el.getAttribute('aria-controls')!)!;
      const first = panel.querySelector('a')!;
      first.focus();
      return { expanded: el.getAttribute('aria-expanded'), visibility: getComputedStyle(panel).visibility, focused: document.activeElement === first };
    });
    expect(seen).toEqual({ expanded: 'true', visibility: 'visible', focused: true });
  });

  test('a menu stays open while focus moves through it, and closes once focus leaves it', async ({ page }) => {
    const { arrow, panel, items } = await levelsMenu(page);
    await arrow.focus();
    await page.keyboard.press('Enter');
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    const count = await items.count();
    expect(count, 'a menu of items').toBeGreaterThan(1);
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
      await expect(items.nth(i)).toBeFocused();
      await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    }
    // Past the last item: the next section's link, outside this menu.
    await page.keyboard.press('Tab');
    expect(await focusInside(panel)).toBe(false);
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
  });

  test('Enter on an item goes to its page, and the menu closes', async ({ page }) => {
    const { arrow, items } = await levelsMenu(page);
    await arrow.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    const href = await items.first().getAttribute('href');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(href!);
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
  });

  test("a click on the arrow toggles its menu, whether or not hover opened it", async ({ page }) => {
    const { arrow } = await levelsMenu(page);
    await arrow.hover();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await arrow.click();
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    // The pointer hasn't left, so only the click can open it again.
    await arrow.click();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
  });

  test('Escape with focus on the arrow closes the menu and leaves focus on the arrow', async ({ page }) => {
    const { arrow } = await levelsMenu(page);
    await page.mouse.move(5, 700);
    await arrow.focus();
    await page.keyboard.press('Enter');
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    const arrowFocus = await countFocus(arrow);
    await page.keyboard.press('Escape');
    await expect(arrow, 'Escape closes the menu').toHaveAttribute('aria-expanded', 'false');
    await expect(arrow).toBeFocused();
    expect(await arrowFocus(), 'focus never left the arrow').toBe(0);
  });

  for (const opened of ['its arrow', 'hover'] as const) {
    test(`Escape with focus on the section's own link closes a menu ${opened} opened, and leaves focus on the link`, async ({ page }) => {
      const { arrow, label } = await levelsMenu(page);
      if (opened === 'hover') {
        await label.hover();
        await expect(arrow).toHaveAttribute('aria-expanded', 'true');
        await label.focus();
      } else {
        await page.mouse.move(5, 700);
        await arrow.focus();
        await page.keyboard.press('Enter');
        await expect(arrow).toHaveAttribute('aria-expanded', 'true');
        // Back to the link beside the arrow, in the menu's wrapper: the menu stays open.
        await page.keyboard.press('Shift+Tab');
      }
      await expect(label).toBeFocused();
      await expect(arrow).toHaveAttribute('aria-expanded', 'true');
      const arrowFocus = await countFocus(arrow);
      await page.keyboard.press('Escape');
      await expect(arrow, 'Escape closes the menu').toHaveAttribute('aria-expanded', 'false');
      await settle(page);
      await expect(label, 'focus stays on the link').toBeFocused();
      expect(await arrowFocus(), 'the arrow took no focus').toBe(0);
    });
  }

  test('Escape closes a menu a Safari-style click opened, giving focus to the arrow', async ({ page }) => {
    const { arrow } = await levelsMenu(page);
    // A mouse arriving at the arrow hovers its menu open, and a click then shuts it.
    await arrow.hover();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await pressAsSafari(arrow);
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    // Opened from the arrow this time, and Safari's click focuses nothing.
    await pressAsSafari(arrow);
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    expect(await focusOnPage(page), 'focus on nothing').toBe(true);
    await page.keyboard.press('Escape');
    await expect(arrow, 'Escape closes the menu').toHaveAttribute('aria-expanded', 'false');
    await expect(arrow, 'the arrow takes focus').toBeFocused();
    // The pointer hasn't left, so nothing opens it again.
    await settle(page);
    await expect(arrow, 'still shut, with the pointer on it').toHaveAttribute('aria-expanded', 'false');
  });

  test('Escape closes a menu hover opened, with focus on the page, and leaves focus there', async ({ page }) => {
    const { arrow } = await levelsMenu(page);
    // Opened from the arrow and shut first: opening by hover forgets that.
    await page.mouse.move(5, 700);
    await arrow.focus();
    await page.keyboard.press('Enter');
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    await arrow.evaluate(el => el.blur());
    expect(await focusOnPage(page), 'focus on the page').toBe(true);
    await arrow.hover();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    const arrowFocus = await countFocus(arrow);
    await page.keyboard.press('Escape');
    await expect(arrow, 'Escape closes the menu').toHaveAttribute('aria-expanded', 'false');
    await settle(page);
    expect(await focusOnPage(page), 'focus stays on the page').toBe(true);
    expect(await arrowFocus(), 'the arrow took no focus').toBe(0);
  });

  test('with focus in the open search, Escape closes the search and leaves a menu hover opened open', async ({ page }) => {
    await page.route('**/api/search/**', route => route.fulfill({
      json: { query: 'e2e', total: 1, results: [{ kind: 'level', id: 1, title: 'E2E page', snippet: null, navigation_url: '/levels/eidos-7', score: 4 }] },
    }));
    const searchButton = page.getByRole('button', { name: 'Search (Ctrl+K)', exact: true });
    const box = page.getByPlaceholder('Search\u2026');
    await searchButton.click();
    await expect(box).toBeFocused();
    await box.fill('e2e');
    await expect(page.getByRole('link', { name: 'E2E page', exact: true })).toBeVisible();
    // Hovering a menu leaves the search open: the Collectibles label, clear of the open search.
    const arrow = page.getByRole('button', { name: 'Toggle collectibles menu', exact: true });
    await arrow.locator('xpath=preceding-sibling::a').hover();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await expect(box).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(box, 'Escape closes the search').toHaveCount(0);
    await expect(searchButton).toBeFocused();
    await settle(page);
    await expect(arrow, 'the menu, still open').toHaveAttribute('aria-expanded', 'true');
  });

  test('with focus on nothing while the search is open, Escape closes the search and leaves a menu hover opened open', async ({ page }) => {
    await page.route('**/api/search/**', route => route.fulfill({
      json: { query: 'e2e', total: 1, results: [{ kind: 'level', id: 1, title: 'E2E page', snippet: null, navigation_url: '/levels/eidos-7', score: 4 }] },
    }));
    const searchButton = page.getByRole('button', { name: 'Search (Ctrl+K)', exact: true });
    const box = page.getByPlaceholder('Search\u2026');
    const results = page.locator('.animate-drop-in');
    await searchButton.click();
    await expect(box).toBeFocused();
    await box.fill('e2e');
    await expect(results.getByRole('link', { name: 'E2E page', exact: true })).toBeVisible();
    // A press on the results panel's padding: focus on nothing, the search still open.
    const edge = (await results.boundingBox())!;
    await page.mouse.click(edge.x + 24, edge.y + 2);
    expect(await focusOnPage(page), 'focus on nothing').toBe(true);
    const arrow = page.getByRole('button', { name: 'Toggle collectibles menu', exact: true });
    await arrow.locator('xpath=preceding-sibling::a').hover();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await expect(box, 'the search, still open').toHaveCount(1);
    // The search's Escape runs first, giving focus to the Search button: the key was the search's.
    await page.keyboard.press('Escape');
    await expect(box, 'Escape closes the search').toHaveCount(0);
    await expect(searchButton).toBeFocused();
    await settle(page);
    await expect(arrow, 'the menu, still open').toHaveAttribute('aria-expanded', 'true');
  });

  test('with focus given back inside a menu hover opened, Escape closes the search and leaves the menu open', async ({ page }) => {
    const box = page.getByPlaceholder('Search\u2026');
    const arrow = page.getByRole('button', { name: 'Toggle collectibles menu', exact: true });
    const link = arrow.locator('xpath=preceding-sibling::a');
    // Ctrl+K from the section's own link, which sits in the menu's wrapper.
    await page.mouse.move(5, 700);
    await link.focus();
    await page.keyboard.press('Control+k');
    await expect(box).toBeFocused();
    // Hovering the label opens the menu and leaves the search open.
    await link.hover();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await expect(box).toBeFocused();
    const landed = await recordLandings(page);
    // The search's Escape runs first and gives focus back to the link.
    await page.keyboard.press('Escape');
    await expect(box, 'Escape closes the search').toHaveCount(0);
    await settle(page);
    expect(await arrow.getAttribute('aria-expanded'), 'the menu, still open').toBe('true');
    await expect(link).toBeFocused();
    expect(await landed(), 'one focus landing, on the link').toEqual(['Collectibles']);
  });

  test('with focus in the box, Escape after Ctrl+K from an item of a menu hover opened again gives focus to its arrow and leaves the menu open', async ({ page }) => {
    const box = page.getByPlaceholder('Search\u2026');
    // Ctrl+K from an item: opening the search closes the menu, which fades out.
    const { arrow, label, panel } = await openOnItem(page);
    await page.keyboard.press('Control+k');
    await expect(box).toBeFocused();
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => panel.evaluate(el => getComputedStyle(el).visibility), 'the menu, faded out').toBe('hidden');
    // Hovering the label opens it again and leaves the search open.
    await label.hover();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await expect(box).toBeFocused();
    const landed = await recordLandings(page);
    // The search's Escape runs first: opening the search closed the menu, so its arrow takes focus.
    await page.keyboard.press('Escape');
    await expect(box, 'Escape closes the search').toHaveCount(0);
    await settle(page);
    expect(await arrow.getAttribute('aria-expanded'), 'the menu, still open').toBe('true');
    await expect(arrow, 'focus on the arrow').toBeFocused();
    expect(await landed(), 'one focus landing, on the arrow').toEqual(['Toggle levels menu']);
    // The reason for the arrow: once the pointer leaves and hover's close has faded the menu out,
    // focus is still there, where an item would have lost it to the page.
    await page.mouse.move(5, 700);
    await expect(arrow, "hover's close").toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => panel.evaluate(el => getComputedStyle(el).visibility), 'the menu, faded out').toBe('hidden');
    await settle(page);
    await expect(arrow, 'focus still on the arrow').toBeFocused();
    expect(await landed(), 'no landing since').toEqual(['Toggle levels menu']);
  });

  test('with focus on nothing, Escape after Ctrl+K from an item of a menu hover opened again gives focus to its arrow and leaves the menu open', async ({ page }) => {
    await page.route('**/api/search/**', route => route.fulfill({
      json: { query: 'e2e', total: 1, results: [{ kind: 'level', id: 1, title: 'E2E page', snippet: null, navigation_url: '/levels/eidos-7', score: 4 }] },
    }));
    const box = page.getByPlaceholder('Search\u2026');
    const results = page.locator('.animate-drop-in');
    // Ctrl+K from Eidos 7: opening the search closes the menu, which fades out.
    const { arrow, label, panel } = await openOnItem(page);
    await page.keyboard.press('Control+k');
    await expect(box).toBeFocused();
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => panel.evaluate(el => getComputedStyle(el).visibility), 'the menu, faded out').toBe('hidden');
    await box.fill('e2e');
    await expect(results.getByRole('link', { name: 'E2E page', exact: true })).toBeVisible();
    // A press on the results panel's padding: focus on nothing, the search still open.
    const edge = (await results.boundingBox())!;
    await page.mouse.click(edge.x + 24, edge.y + 2);
    expect(await focusOnPage(page), 'focus on nothing').toBe(true);
    await expect(box, 'the search, still open').toHaveCount(1);
    // Hovering the label opens the menu again and leaves the search open.
    await label.hover();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await expect(box, 'the search, still open').toHaveCount(1);
    const landed = await recordLandings(page);
    // The search's Escape runs first and gives focus to the arrow: the key was the search's.
    await page.keyboard.press('Escape');
    await expect(box, 'Escape closes the search').toHaveCount(0);
    await settle(page);
    expect(await arrow.getAttribute('aria-expanded'), 'the menu, still open').toBe('true');
    await expect(arrow, 'focus on the arrow').toBeFocused();
    expect(await landed(), 'one focus landing, on the arrow').toEqual(['Toggle levels menu']);
  });

  test('Back, Forward and a typed fragment close a menu, giving focus in it back to the arrow', async ({ page }) => {
    const { arrow } = await levelsMenu(page);
    await toTerms(page);
    // The fragment names nothing on the page, so the browser leaves focus where the menu puts it.
    const moves: [string, RegExp, () => Promise<unknown>][] = [
      ['Back', /\/privacy$/, () => page.goBack()],
      ['Forward', /\/terms$/, () => page.goForward()],
      ['a typed fragment', /\/terms#probe-fragment$/, () => page.evaluate(() => { location.hash = 'probe-fragment'; })],
    ];
    for (const [move, address, go] of moves) {
      await openOnItem(page);
      await go();
      await expect(page).toHaveURL(address);
      await expect(arrow, `${move} closes the menu`).toHaveAttribute('aria-expanded', 'false');
      await expect(arrow, `${move} gives focus back to the arrow`).toBeFocused();
    }
  });

  test('a typed fragment naming a section still closes a menu with focus in it', async ({ page }) => {
    // Chromium clears focus after a popstate that lands on a fragment naming an element, so where
    // focus ends isn't checked here.
    const { arrow } = await openOnItem(page);
    await page.evaluate(() => { location.hash = 'cookies'; });
    await expect(page).toHaveURL(/\/privacy#cookies$/);
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
  });

  test("Back closes a menu with focus on the section's own link, and leaves focus there", async ({ page }) => {
    const { arrow, label } = await levelsMenu(page);
    await toTerms(page);
    await page.mouse.move(5, 700);
    await arrow.focus();
    await page.keyboard.press('Enter');
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    // The link beside the arrow stays on screen as the menu closes.
    await page.keyboard.press('Shift+Tab');
    await expect(label).toBeFocused();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    const arrowFocus = await countFocus(arrow);
    await page.goBack();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    await expect(label).toBeFocused();
    expect(await arrowFocus(), 'the arrow took no focus').toBe(0);
  });

  test('Back closes a menu hover opened, with the pointer still on it, until the pointer comes back', async ({ page }) => {
    const { arrow } = await levelsMenu(page);
    await toTerms(page);
    await arrow.hover();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await page.goBack();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    await page.mouse.move(5, 700);
    await arrow.hover();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
  });

  test('a Back that cancels a page still rendering closes a menu, giving focus in it back to the arrow', async ({ page }) => {
    await eidos7ByBack(page);
    const { arrow } = await openOnItem(page);
    await backWhileRendering(page, '/levels/xion');
    await expect.poll(() => page.evaluate(() => (window as unknown as { popped: boolean }).popped), 'Back landed').toBe(true);
    await expect(page).toHaveURL(/\/levels\/eidos-7$/);
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    await expect(arrow).toBeFocused();
    await showsLevel(page, 'Eidos 7');
    expect(await page.evaluate(() => (window as unknown as { headings: string[] }).headings), 'Xion never showed')
      .toEqual(['Eidos 7']);
  });

  test('a menu opened while a page still renders stays open as that page arrives, and Back closes it, giving focus back to the arrow', async ({ page }) => {
    await eidos7ByBack(page);
    const { arrow, panel } = await levelsMenu(page);
    await page.mouse.move(5, 700);
    await openWhileRendering(page, '/levels/xion');
    await showsLevel(page, 'Xion');
    // Anything Xion's commit set off has run, its effects included.
    await settle(page);
    expect(await opened(page), 'the menu opened, with focus in it, while Eidos 7 was still on screen')
      .toEqual({ open: 'true', inPanel: true, heading: 'Eidos 7' });
    await expect(arrow, 'still open on Xion').toHaveAttribute('aria-expanded', 'true');
    expect(await focusInside(panel), 'focus still in it').toBe(true);

    await page.goBack();
    await expect(page).toHaveURL(/\/levels\/eidos-7$/);
    await expect(arrow, 'Back closes it').toHaveAttribute('aria-expanded', 'false');
    await expect(arrow, 'Back gives focus back to the arrow').toBeFocused();
  });

  test('a Back that cancels a page still rendering closes a menu opened meanwhile, giving focus back to the arrow', async ({ page }) => {
    await eidos7ByBack(page);
    const { arrow } = await levelsMenu(page);
    await page.mouse.move(5, 700);
    await openWhileRendering(page, '/levels/xion', true);
    await expect.poll(() => page.evaluate(() => (window as unknown as { popped: boolean }).popped), 'Back landed').toBe(true);
    await expect(page).toHaveURL(/\/levels\/eidos-7$/);
    expect(await opened(page), 'the menu opened, with focus in it, while Eidos 7 was still on screen')
      .toEqual({ open: 'true', inPanel: true, heading: 'Eidos 7' });
    await expect(arrow, 'Back closes it').toHaveAttribute('aria-expanded', 'false');
    await expect(arrow, 'Back gives focus back to the arrow').toBeFocused();
    await showsLevel(page, 'Eidos 7');
    expect(await page.evaluate(() => (window as unknown as { headings: string[] }).headings), 'Xion never showed')
      .toEqual(['Eidos 7']);
  });
});

// By touch (Chromium's touch emulation): hover opens a menu for a mouse only. A tap fires an
// emulated hover too, which opened the menu just before the tap's click on the arrow toggled
// it shut, so a touch screen at this width couldn't open the menus at all.
test.describe('desktop nav menus by touch', () => {
  test.use({ hasTouch: true });

  test.beforeEach(async ({ context, page }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
    await page.goto('/privacy');
  });

  test('a tap on the arrow opens its menu, and a second tap closes it', async ({ page }) => {
    const { arrow, items } = await levelsMenu(page);
    await arrow.tap();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await expect(items.first()).toBeVisible();
    // Still open once everything the tap set off has run, its pointer leaving included.
    await settle(page);
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await arrow.tap();
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
  });

  test('a tap elsewhere closes an open menu, even where a tap leaves the arrow unfocused', async ({ page }) => {
    const { arrow } = await levelsMenu(page);
    // iOS Safari doesn't focus a tapped button, so focus never leaves the menu there.
    await arrow.evaluate(el => el.addEventListener('mousedown', e => e.preventDefault()));
    await arrow.tap();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await expect(arrow).not.toBeFocused();
    // The heading's far end: the open menu covers its middle.
    const heading = page.getByRole('heading', { level: 1 });
    const box = (await heading.boundingBox())!;
    await heading.tap({ position: { x: box.width - 10, y: box.height / 2 } });
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
  });

  test('Back closes a menu a tap opened, even where the tap left the arrow unfocused', async ({ page }) => {
    const { arrow } = await levelsMenu(page);
    await toTerms(page);
    // iOS Safari doesn't focus a tapped button, so focus never enters the menu there.
    await tapAsSafari(arrow);
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await expect(arrow).not.toBeFocused();
    const arrowFocus = await countFocus(arrow);
    await page.goBack();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    expect(await arrowFocus(), 'focus stays where it was').toBe(0);
  });

  test('Escape closes a menu a tap opened, where the tap left the arrow unfocused, giving focus to the arrow', async ({ page }) => {
    const { arrow } = await levelsMenu(page);
    // iOS Safari doesn't focus a tapped button, so focus is on nothing.
    await tapAsSafari(arrow);
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    expect(await focusOnPage(page), 'focus on nothing').toBe(true);
    await page.keyboard.press('Escape');
    await expect(arrow, 'Escape closes the menu').toHaveAttribute('aria-expanded', 'false');
    await expect(arrow, 'the arrow takes focus').toBeFocused();
  });
});
