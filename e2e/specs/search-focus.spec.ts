import { test, expect, type Locator, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';
import { pressAsSafari } from '../helpers/safari';
import { buildSlugMap } from '../../client/src/utils/slugify';

// When the desktop search closes without taking the reader anywhere, focus goes back to what
// opened it: the Search button, or, after Ctrl+K, whatever had focus then, if it's still on
// screen and not under the navbar. An opener in a bar panel that opening the search closed (a
// nav menu, the account menu, the bell's) gives way to that panel's button. Escape closes it
// from anywhere while it's open. Focus moved elsewhere meanwhile, a pick that lands somewhere
// and a press outside are left alone, and Clear search keeps focus in the box. A press on Close
// search, or on the result for the page you're on, gives focus back without the focus ring; a
// key gives it back with one. Back, Forward and a typed fragment close it, focus in it going to
// the Search button; focus landing outside it closes it too, and stays where it landed. Ctrl+K
// opens it only from the desktop layout up.

const LEVEL = '/levels/eidos-7';
const SUITS = '/cosmetics/nano-suits';
const CARDS = 'section[id] article[id]';
const SEARCH_BUTTON = 'button[aria-label="Search (Ctrl+K)"]';

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

const searchButton = (page: Page) => page.getByRole('button', { name: 'Search (Ctrl+K)', exact: true });
const box = (page: Page) => page.getByPlaceholder('Search…');
const panel = (page: Page) => page.locator('.animate-drop-in');
const result = (page: Page, title: string) => panel(page).getByRole('link', { name: title, exact: true });
const pill = (page: Page, label: string) => page.getByRole('button', { name: label, exact: true });

async function openByButton(page: Page) {
  await searchButton(page).click();
  await expect(box(page)).toBeFocused();
}

async function openWithResults(page: Page) {
  await openByButton(page);
  await box(page).fill('e2e');
  await expect(result(page, 'E2E page')).toBeVisible();
}

// Picks the one result, by a click on it or by Enter once the arrow has reached it.
async function choose(page: Page, how: 'click' | 'Enter', title: string) {
  if (how === 'Enter') {
    await page.keyboard.press('ArrowDown');
    await expect(result(page, title)).toHaveClass(/bg-gray-800\/70/);
    await page.keyboard.press('Enter');
  } else {
    await result(page, title).click();
  }
}

// Counts focus events on the Search button from here on. It remounts each time the search
// closes, so they are counted by what they land on.
async function countSearchButtonFocus(page: Page) {
  await page.evaluate((selector) => {
    const w = window as unknown as { searchButtonFocus?: number };
    if (w.searchButtonFocus === undefined) {
      document.addEventListener('focusin', e => {
        if (e.target instanceof Element && e.target.matches(selector)) w.searchButtonFocus! += 1;
      }, true);
    }
    w.searchButtonFocus = 0;
  }, SEARCH_BUTTON);
  return () => page.evaluate(() => (window as unknown as { searchButtonFocus: number }).searchButtonFocus);
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

// What follows the search in the bar, signed out.
const signIn = (page: Page) => page.getByRole('link', { name: 'Sign in', exact: true });

// An absence can't be polled for, so this gives a key's or press's side effects, those deferred
// to a frame or a timer included, two frames and 100 ms to happen first.
const settle = (page: Page) => page.evaluate(() =>
  new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 100)))));

// Closed, with focus on the Search button, and still so once anything a key or press set off
// has run.
async function expectClosedOnSearchButton(page: Page) {
  await expect(searchButton(page)).toBeFocused();
  await settle(page);
  await expect(box(page)).toHaveCount(0);
  await expect(searchButton(page)).toBeFocused();
}

type Landings = { named: Map<Element, string>; landed: string[]; watching?: boolean };

// Names each element focus lands on from here on: by the name given for it, the Search button as
// such, anything else by its tag.
async function watchFocus(page: Page, named: Record<string, Locator>) {
  await page.evaluate(() => { (window as unknown as Landings).named = new Map(); });
  for (const [name, target] of Object.entries(named)) {
    await target.evaluate((el, name) => { (window as unknown as Landings).named.set(el, name); }, name);
  }
  await page.evaluate((selector) => {
    const w = window as unknown as Landings;
    w.landed = [];
    if (w.watching) return;
    w.watching = true;
    document.addEventListener('focusin', e => {
      if (!(e.target instanceof Element)) return;
      w.landed.push(w.named.get(e.target) ?? (e.target.matches(selector) ? 'Search button' : e.target.tagName.toLowerCase()));
    }, true);
  }, SEARCH_BUTTON);
  return () => page.evaluate(() => (window as unknown as Landings).landed);
}

// The Levels menu, on the page arrive goes to (/privacy unless it says), opened by Enter on its
// arrow, with focus on its first link and its opening fade run out.
async function intoTheLevelsMenu(page: Page, arrive = async (page: Page) => { await page.goto('/privacy'); }) {
  await arrive(page);
  await page.mouse.move(5, 700);
  const arrow = page.getByRole('button', { name: 'Toggle levels menu', exact: true });
  await arrow.focus();
  await arrow.press('Enter');
  await expect(arrow).toHaveAttribute('aria-expanded', 'true');
  const menu = page.locator(`[id="${await arrow.getAttribute('aria-controls')}"]`);
  await page.keyboard.press('Tab');
  // By its tag, so it's still found once the menu has faded.
  const link = menu.locator('a').first();
  await expect(link).toBeFocused();
  await menu.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));
  return { arrow, menu, link };
}

// Holds the menu's next fade from its first frame, so a key pressed meanwhile lands inside it
// however slow the machine. The function returned lets it run out.
async function holdTheFade(menu: Locator) {
  await menu.evaluate(el => {
    const hold = new AbortController();
    (window as unknown as { fadeHold: AbortController }).fadeHold = hold;
    el.addEventListener('transitionrun', () => { for (const a of el.getAnimations()) a.pause(); }, { signal: hold.signal });
  });
  return () => menu.evaluate(el => {
    (window as unknown as { fadeHold: AbortController }).fadeHold.abort();
    for (const a of el.getAnimations()) a.play();
  });
}

const visibility = (target: Locator) => target.evaluate(el => getComputedStyle(el).visibility);

const closeSearchButton = (page: Page) => page.getByRole('button', { name: 'Close search', exact: true });
const focusRing = (target: Locator) => target.evaluate(el => el.matches(':focus-visible'));

// Types a key and takes it back, leaving Close search. Chromium shows the ring these tests guard
// against only after a key pressed since a mouse press last moved focus, such as the click that
// opens the search.
async function typeThenEmpty(page: Page) {
  await page.keyboard.press('a');
  await page.keyboard.press('Backspace');
  await expect(closeSearchButton(page)).toBeVisible();
}

test.describe('search focus, desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page, context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
    await stubSearch(page, [{ kind: 'level', title: 'E2E page', url: LEVEL }]);
  });

  for (const [from, reach] of [
    ['from the box', async (page: Page) => { await openWithResults(page); }],
    ['from the X', async (page: Page) => {
      await openWithResults(page);
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Clear search', exact: true })).toBeFocused();
    }],
    ['from a result', async (page: Page) => {
      await openWithResults(page);
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(result(page, 'E2E page')).toBeFocused();
    }],
    ['after a press on the results panel', async (page: Page) => {
      await openWithResults(page);
      // Its padding, above the first result: no control, so focus falls to the page.
      const edge = (await panel(page).boundingBox())!;
      await page.mouse.click(edge.x + 24, edge.y + 2);
      expect(await focusOnPage(page), 'focus on the page').toBe(true);
    }],
  ] as const) {
    test(`Escape ${from} closes the search and gives focus back to the Search button`, async ({ page }) => {
      await page.goto('/privacy');
      await reach(page);
      await page.keyboard.press('Escape');
      await expectClosedOnSearchButton(page);
    });
  }

  for (const [how, press] of [
    ['click', async (x: Locator) => { await x.click(); }],
    ['a Safari-style press', async (x: Locator) => { await pressAsSafari(x); }],
    ['Enter', async (x: Locator) => { await x.page().keyboard.press('Tab'); await expect(x).toBeFocused(); await x.page().keyboard.press('Enter'); }],
    ['Space', async (x: Locator) => { await x.page().keyboard.press('Tab'); await expect(x).toBeFocused(); await x.page().keyboard.press('Space'); }],
  ] as const) {
    test(`Close search by ${how} gives focus back to the Search button, and the search stays closed`, async ({ page }) => {
      await page.goto('/privacy');
      await openByButton(page);
      await press(page.getByRole('button', { name: 'Close search', exact: true }));
      await expectClosedOnSearchButton(page);
    });
  }

  // A press never takes focus out of the box; the keyboard reaches the X first.
  for (const [how, press, pressed] of [
    ['click', async (x: Locator) => { await x.click(); }, true],
    ['a Safari-style press', async (x: Locator) => { await pressAsSafari(x); }, true],
    ['the keyboard', async (x: Locator) => { await x.page().keyboard.press('Tab'); await expect(x).toBeFocused(); await x.page().keyboard.press('Enter'); }, false],
  ] as const) {
    test(`Clear search by ${how} empties the box and keeps the search open, with focus in the box`, async ({ page }) => {
      await page.goto('/privacy');
      await openWithResults(page);
      const blurs = await countBlurs(box(page));
      await press(page.getByRole('button', { name: 'Clear search', exact: true }));
      await expect(box(page)).toHaveValue('');
      await expect(box(page)).toBeFocused();
      await expect(page.getByRole('button', { name: 'Close search', exact: true })).toBeVisible();
      if (pressed) expect(await blurs(), 'the box kept focus throughout').toBe(0);
    });
  }

  // A press on Close search gives focus back without the focus ring, as a clicked button shows
  // none; a key gives it back with one.
  for (const [how, close, ring] of [
    ['a click on Close search', async (page: Page) => { await closeSearchButton(page).click(); }, false],
    ['Enter on Close search', async (page: Page) => {
      await page.keyboard.press('Tab');
      await expect(closeSearchButton(page)).toBeFocused();
      await page.keyboard.press('Enter');
    }, true],
    ['Space on Close search', async (page: Page) => {
      await page.keyboard.press('Tab');
      await expect(closeSearchButton(page)).toBeFocused();
      await page.keyboard.press('Space');
    }, true],
    ['Escape', async (page: Page) => { await page.keyboard.press('Escape'); }, true],
  ] as const) {
    test(`${how} gives focus back to the Search button ${ring ? 'with' : 'without'} the focus ring`, async ({ page }) => {
      await page.goto('/privacy');
      await openByButton(page);
      await typeThenEmpty(page);
      await close(page);
      await expectClosedOnSearchButton(page);
      expect(await focusRing(searchButton(page)), 'the focus ring shows').toBe(ring);
    });

    test(`${how} after Ctrl+K from a link on the page gives focus back to the link ${ring ? 'with' : 'without'} the focus ring`, async ({ page }) => {
      await page.goto(LEVEL);
      await page.mouse.move(5, 700);
      const link = page.locator(`${CARDS} a[href]`).first();
      await link.focus();
      await page.keyboard.press('Control+k');
      await expect(box(page)).toBeFocused();
      await typeThenEmpty(page);
      await close(page);
      await expect(box(page)).toHaveCount(0);
      await expect(link).toBeFocused();
      await settle(page);
      await expect(link).toBeFocused();
      expect(await focusRing(link), 'the focus ring shows').toBe(ring);
    });
  }

  // Picking the page you're on closes it as Close search does: a press gives focus back without
  // the focus ring, even where it focuses nothing on the way (Safari), and a key gives it back
  // with one.
  for (const [how, pick, ring] of [
    ['a Safari-style press', async (page: Page) => { await pressAsSafari(result(page, 'E2E page')); }, false],
    ['Enter on the result', async (page: Page) => {
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(result(page, 'E2E page')).toBeFocused();
      await page.keyboard.press('Enter');
    }, true],
    ['the arrow keys and Enter', async (page: Page) => { await choose(page, 'Enter', 'E2E page'); }, true],
  ] as const) {
    test(`picking the page you're on by ${how} gives focus back to the Search button ${ring ? 'with' : 'without'} the focus ring`, async ({ page }) => {
      await page.goto(LEVEL);
      await page.locator(CARDS).first().waitFor();
      await openByButton(page);
      // Typed with keys: Chromium shows the ring this guards against only after a key pressed
      // since a mouse press last moved focus.
      await page.keyboard.type('e2e');
      await expect(result(page, 'E2E page')).toBeVisible();
      await pick(page);
      await expectClosedOnSearchButton(page);
      expect(await focusRing(searchButton(page)), 'the focus ring shows').toBe(ring);
    });
  }

  test('Escape after Ctrl+K from a filter pill gives focus back to the pill', async ({ page }) => {
    await page.goto(LEVEL);
    await page.mouse.move(5, 700);
    await pill(page, 'NG+').focus();
    await page.keyboard.press('Control+k');
    await expect(box(page)).toBeFocused();
    await box(page).fill('e2e');
    await page.keyboard.press('Escape');
    await expect(box(page)).toHaveCount(0);
    await expect(pill(page, 'NG+')).toBeFocused();
  });

  test('Escape after Ctrl+K from a link on the page gives focus back to the link', async ({ page }) => {
    await page.goto(LEVEL);
    await page.mouse.move(5, 700);
    const link = page.locator(`${CARDS} a[href]`).first();
    await link.focus();
    await page.keyboard.press('Control+k');
    await expect(box(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(box(page)).toHaveCount(0);
    await expect(link).toBeFocused();
  });

  test('Escape after Ctrl+K with nothing focused gives focus to the Search button', async ({ page }) => {
    await page.goto(LEVEL);
    await page.locator(CARDS).first().waitFor();
    expect(await focusOnPage(page), 'nothing focused').toBe(true);
    await page.keyboard.press('Control+k');
    await expect(box(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expectClosedOnSearchButton(page);
  });

  test('Escape after Ctrl+K from a control since scrolled off screen gives focus to the Search button', async ({ page }) => {
    await page.goto(LEVEL);
    await pill(page, 'NG+').focus();
    await page.keyboard.press('Control+k');
    await expect(box(page)).toBeFocused();
    // The wheel, over the page rather than the panel, scrolls the page under the open search.
    await page.mouse.move(400, 600);
    await page.mouse.wheel(0, 2500);
    await expect.poll(() => pill(page, 'NG+').evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThan(0);
    await expect(box(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expectClosedOnSearchButton(page);
  });

  test('Escape after Ctrl+K from a control since scrolled under the navbar gives focus to the Search button', async ({ page }) => {
    await page.goto(LEVEL);
    const ng = pill(page, 'NG+');
    await ng.focus();
    await page.keyboard.press('Control+k');
    await expect(box(page)).toBeFocused();
    // The wheel takes the pill up under the fixed navbar, wholly, and still inside the window.
    const barBottom = await box(page).evaluate(el => el.closest('nav')!.getBoundingClientRect().bottom);
    const { top, bottom } = await ng.evaluate(el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; });
    await page.mouse.move(400, 600);
    await page.mouse.wheel(0, Math.round(bottom - (barBottom + bottom - top) / 2));
    await expect.poll(() => ng.evaluate((el, barBottom) => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= barBottom;
    }, barBottom), 'the pill under the navbar').toBe(true);
    await expect(box(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expectClosedOnSearchButton(page);
  });

  // The bar's own controls, outside any panel: the strip the navbar covers counts as on screen for
  // them.
  for (const [control, find] of [
    ['the Levels arrow with its menu shut', (page: Page) => page.getByRole('button', { name: 'Toggle levels menu', exact: true })],
    ['the Levels link', (page: Page) => page.getByRole('link', { name: 'Levels', exact: true })],
    ['the logo', (page: Page) => page.getByRole('link').filter({ has: page.getByAltText('Stellar Blade Guide Logo', { exact: true }) })],
    ['Sign in', signIn],
  ] as const) {
    test(`Escape after Ctrl+K from ${control} gives focus back to it`, async ({ page }) => {
      await page.goto('/privacy');
      await page.mouse.move(5, 700);
      const opener = find(page);
      await opener.focus();
      await expect(opener).toBeFocused();
      await page.keyboard.press('Control+k');
      await expect(box(page)).toBeFocused();
      const landed = await watchFocus(page, { opener });
      await page.keyboard.press('Escape');
      await expect(box(page)).toHaveCount(0);
      await expect(opener).toBeFocused();
      await settle(page);
      await expect(opener).toBeFocused();
      expect(await landed(), 'one focus, on it').toEqual(['opener']);
    });
  }

  test('Escape after Ctrl+K from a control that can no longer take focus gives focus to the Search button', async ({ page }) => {
    await page.goto(LEVEL);
    await page.locator(CARDS).first().waitFor();
    // The sidebar's Back to top shows, and takes focus, once the page is well down.
    const backToTop = page.locator('aside button[aria-label="Back to top"]');
    await page.mouse.move(700, 600);
    await page.mouse.wheel(0, 1500);
    await expect(backToTop).not.toHaveAttribute('inert');
    await backToTop.focus();
    await expect(backToTop).toBeFocused();
    await page.keyboard.press('Control+k');
    await expect(box(page)).toBeFocused();
    // Back at the top it fades out and turns inert, still laid out on screen: its focus fails.
    await page.mouse.wheel(0, -5000);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(backToTop).toHaveAttribute('inert', '');
    const barBottom = await box(page).evaluate(el => el.closest('nav')!.getBoundingClientRect().bottom);
    expect(await backToTop.evaluate((el, barBottom) => {
      const r = el.getBoundingClientRect();
      return r.top >= barBottom && r.bottom <= window.innerHeight;
    }, barBottom), 'Back to top, on screen below the navbar').toBe(true);
    await expect(box(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expectClosedOnSearchButton(page);
  });

  test("Escape straight after Ctrl+K from a link in an open nav menu gives focus to the menu's arrow, which keeps it once the menu has faded", async ({ page }) => {
    const { arrow, menu, link } = await intoTheLevelsMenu(page);
    const letTheFadeRun = await holdTheFade(menu);
    await page.keyboard.press('Control+k');
    await expect(box(page)).toBeFocused();
    // Opening the search closed the menu, held mid-fade: its link could still take focus.
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => menu.evaluate(el => el.getAnimations().some(a => a.playState === 'paused')), 'the fade, held').toBe(true);
    expect(await visibility(menu), 'the menu, still showing').toBe('visible');
    const landed = await watchFocus(page, { arrow, link });
    await page.keyboard.press('Escape');
    await expect(box(page)).toHaveCount(0);
    await expect.poll(landed, 'where focus landed').toEqual(['arrow']);
    await expect(arrow).toBeFocused();
    await letTheFadeRun();
    await expect.poll(() => visibility(menu), 'the menu, faded').toBe('hidden');
    await settle(page);
    await expect(arrow).toBeFocused();
    expect(await landed(), 'one focus on the arrow, none on the link').toEqual(['arrow']);
  });

  test("Escape after Ctrl+K from a link in an open nav menu, pressed once the menu has faded, gives focus to the menu's arrow", async ({ page }) => {
    const { arrow, menu, link } = await intoTheLevelsMenu(page);
    await page.keyboard.press('Control+k');
    await expect(box(page)).toBeFocused();
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => visibility(menu), 'the menu, faded').toBe('hidden');
    const landed = await watchFocus(page, { arrow, link });
    await page.keyboard.press('Escape');
    await expect(box(page)).toHaveCount(0);
    await expect.poll(landed, 'where focus landed').toEqual(['arrow']);
    await settle(page);
    await expect(arrow).toBeFocused();
  });

  for (const how of ['Enter', 'click'] as const) {
    test(`picking the page you're on by ${how} gives focus back to the Search button, adds no entry and stays closed`, async ({ page }) => {
      await page.goto(LEVEL);
      await page.locator(CARDS).first().waitFor();
      const before = await page.evaluate(() => [history.length, (history.state as { key?: string } | null)?.key]);
      await openWithResults(page);
      await choose(page, how, 'E2E page');
      await expectClosedOnSearchButton(page);
      const after = await page.evaluate(() => [history.length, (history.state as { key?: string } | null)?.key]);
      expect(after[0], 'no entry added').toBe(before[0]);
      expect(after[1], 'the entry was replaced').not.toBe(before[1]);
    });
  }

  for (const how of ['click', 'Enter'] as const) {
    test(`picking the page you're on by ${how} after arriving with a tracking query gives focus to the Search button`, async ({ page }) => {
      // Arrived from another page, on an address with a tracking query.
      await page.goto('/');
      await page.goto(`${LEVEL}?fbclid=e2e`);
      await page.locator(CARDS).first().waitFor();
      await openWithResults(page);
      await choose(page, how, 'E2E page');
      await expectClosedOnSearchButton(page);
    });
  }

  for (const [where, from] of [['on the page you are on', SUITS], ['on another page', '/privacy']] as const) {
    for (const how of ['click', 'Enter'] as const) {
      test(`a result for a card ${where}, picked by ${how}, hands focus to the card's heading`, async ({ page }) => {
        const cards = await typeCards(page, SUITS);
        const id = buildSlugMap(cards).get(cards[Math.floor(cards.length / 2)].id)!;
        await stubSearch(page, [{ kind: 'cosmetics', title: 'E2E card', url: `${SUITS}#${id}` }]);
        await page.goto(from);
        if (from === SUITS) await page.locator(CARDS).first().waitFor();
        await openByButton(page);
        await box(page).fill('e2e');
        await expect(result(page, 'E2E card')).toBeVisible();
        const searchButtonFocus = await countSearchButtonFocus(page);
        await choose(page, how, 'E2E card');
        await expect(page.locator(`article[id="${id}"] h2`)).toBeFocused();
        expect(await searchButtonFocus(), 'the Search button took no focus').toBe(0);
        await expect(box(page)).toHaveCount(0);
      });
    }
  }

  for (const how of ['click', 'Enter'] as const) {
    test(`a result for another page, picked by ${how}, leaves focus on that page, and the Search button takes none`, async ({ page }) => {
      await page.goto('/privacy');
      await openWithResults(page);
      const searchButtonFocus = await countSearchButtonFocus(page);
      await choose(page, how, 'E2E page');
      await page.locator(CARDS).first().waitFor();
      await settle(page);
      expect(await focusOnPage(page), 'focus on the page').toBe(true);
      expect(await searchButtonFocus(), 'the Search button took no focus').toBe(0);
      await expect(box(page)).toHaveCount(0);
    });
  }

  test('a press outside on a link closes the search and leaves focus on it', async ({ page }) => {
    await page.goto(LEVEL);
    await page.locator(CARDS).first().waitFor();
    await openWithResults(page);
    const searchButtonFocus = await countSearchButtonFocus(page);
    // The sidebar's Contents, well clear of the open panel.
    const contents = page.locator('aside nav a[href^="#"]').first();
    await contents.click();
    await expect(box(page)).toHaveCount(0);
    await expect(contents).toBeFocused();
    expect(await searchButtonFocus(), 'the Search button took no focus').toBe(0);
  });
});

// A level page has rendered in full: its heading, then its cards. The address changes before
// the page does, so a wait on the address alone would find the last page.
async function showsLevel(page: Page, name: string) {
  await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
  await expect(page.locator(CARDS).first()).toBeVisible();
}

// Xion, reached by a click on Eidos 7's Next link, at the foot of the page: Eidos 7's entry keeps
// that place for Back.
async function xionByNext(page: Page) {
  await page.goto(LEVEL);
  await showsLevel(page, 'Eidos 7');
  await page.locator('main a').filter({ hasText: /^Next/ }).click();
  await showsLevel(page, 'Xion');
}

// Eidos 7, reached by Back from Xion: Xion's data is cached, so the move back to it renders in
// full, across React's yields.
async function eidos7ByBack(page: Page) {
  await xionByNext(page);
  await page.goBack();
  await showsLevel(page, 'Eidos 7');
}

// The element named 'opener' in watchFocus: still on the page, and what it now holds.
const openerNow = (page: Page) => page.evaluate(() => {
  const opener = [...(window as unknown as Landings).named].find(([, name]) => name === 'opener')![0];
  return { connected: opener.isConnected, href: opener.getAttribute('href'), text: opener.textContent };
});

// A press on the results panel's padding, above the first result: no control, so focus falls to
// the page.
async function pressThePanel(page: Page) {
  const edge = (await panel(page).boundingBox())!;
  await page.mouse.click(edge.x + 24, edge.y + 2);
  expect(await focusOnPage(page), 'focus on the page').toBe(true);
}

// The footer's Terms link: a second entry, made in the app.
async function privacyThenTerms(page: Page) {
  await page.goto('/privacy');
  await page.locator('footer').getByRole('link', { name: 'Terms', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Terms of Service', exact: true })).toBeVisible();
}

// Follows the level page's Next link to `path` with a click from script, which moves no focus and
// fires no pointer event, and goes Back while React renders that page, before it commits:
// StructuredData turns the new page's crumbs into JSON as it renders. Records each heading shown,
// from the one on screen now.
const backWhileRendering = (page: Page, path: string) => page.evaluate((path) => {
  const w = window as unknown as { backed: boolean; headings: string[] };
  w.backed = false;
  w.headings = [document.querySelector('main h1')?.textContent ?? ''];
  new MutationObserver(() => {
    const heading = document.querySelector('main h1')?.textContent ?? '';
    if (w.headings.at(-1) !== heading) w.headings.push(heading);
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
  const stringify = JSON.stringify;
  JSON.stringify = function (this: JSON, ...args: Parameters<typeof JSON.stringify>) {
    const [value] = args;
    if (Array.isArray(value) && value.some(crumb => (crumb as { path?: string } | null)?.path === path)) {
      JSON.stringify = stringify;
      setTimeout(() => { w.backed = true; history.back(); }, 0);
    }
    return stringify.apply(this, args);
  } as typeof JSON.stringify;
  Array.from(document.querySelectorAll<HTMLAnchorElement>(`main a[href="${path}"]`))
    .find(a => /^Next/.test(a.textContent ?? ''))!.click();
}, path);

// Back, Forward and a typed fragment close the search, and focus in it goes back to the Search
// button, even after Ctrl+K. Focus landing on something outside it closes it too, from the box or
// from the page after a press on its panel, and stays where it went; focus going nowhere, as on
// that press, leaves it open, and so do a move the site makes on its own and a nav menu opened by
// hover. The entries here have no fragment naming an element: Chromium clears focus after a
// popstate that lands on one.
test.describe('search on Back, Forward and Tab, desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page, context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
    await stubSearch(page, [{ kind: 'level', title: 'E2E page', url: LEVEL }]);
  });

  for (const [where, reach] of [
    ['in the box', async (page: Page) => { await openWithResults(page); }],
    ['on a result', async (page: Page) => {
      await openWithResults(page);
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(result(page, 'E2E page')).toBeFocused();
    }],
  ] as const) {
    for (const [how, before, travel] of [
      ['Back', privacyThenTerms, async (page: Page) => {
        await page.goBack();
        await expect(page).toHaveURL(/\/privacy$/);
      }],
      ['Forward', async (page: Page) => {
        await privacyThenTerms(page);
        await page.goBack();
        await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy', exact: true })).toBeVisible();
      }, async (page: Page) => {
        await page.goForward();
        await expect(page).toHaveURL(/\/terms$/);
      }],
      ['a typed fragment that names nothing', async (page: Page) => { await page.goto('/privacy'); }, async (page: Page) => {
        await page.evaluate(() => { location.hash = 'probe-fragment'; });
        await expect(page).toHaveURL(/\/privacy#probe-fragment$/);
      }],
      ['a Back that cancels a page still rendering', eidos7ByBack, async (page: Page) => {
        await backWhileRendering(page, '/levels/xion');
        await expect.poll(() => page.evaluate(() => (window as unknown as { backed: boolean }).backed), 'Back went').toBe(true);
        await expect(page).toHaveURL(new RegExp(`${LEVEL}$`));
      }],
    ] as const) {
      test(`${how} with focus ${where} closes the search, focus going back to the Search button, and it reopens empty`, async ({ page }) => {
        await before(page);
        await reach(page);
        await travel(page);
        await expectClosedOnSearchButton(page);
        if (how === 'a Back that cancels a page still rendering') {
          await showsLevel(page, 'Eidos 7');
          expect(await page.evaluate(() => (window as unknown as { headings: string[] }).headings), 'Xion never showed')
            .toEqual(['Eidos 7']);
        }
        await page.keyboard.press('Enter');
        await expect(box(page)).toBeFocused();
        await expect(box(page)).toHaveValue('');
      });
    }
  }

  test('a typed fragment naming a section closes the search', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('#cookies'), 'a section of the page').toHaveCount(1);
    await openWithResults(page);
    await page.evaluate(() => { location.hash = 'cookies'; });
    await expect(page).toHaveURL(/\/privacy#cookies$/);
    await expect(box(page)).toHaveCount(0);
  });

  test("Back after Ctrl+K gives focus to the Search button, not to the control the next entry shows in the opener's place", async ({ page }) => {
    await xionByNext(page);
    await page.mouse.move(5, 700);
    // Contents keys its links by place: back on Eidos 7, Xion's third link shows Eidos 7's third.
    const third = page.locator('aside nav a[href^="#"]').nth(2);
    await expect(third).toHaveAttribute('href', '#main-gate');
    await third.focus();
    await page.keyboard.press('Control+k');
    await expect(box(page)).toBeFocused();
    const landed = await watchFocus(page, { opener: third });
    await page.goBack();
    await showsLevel(page, 'Eidos 7');
    await expect.poll(landed, 'where focus landed').toEqual(['Search button']);
    await expectClosedOnSearchButton(page);
    expect(await openerNow(page), "the opener's link, now Parking Tower's").toMatchObject({ connected: true, href: '#parking-tower' });
  });

  test("Back after Ctrl+K to an entry far down its page gives focus to the Search button, not to the pill in the opener's place", async ({ page }) => {
    await xionByNext(page);
    await page.mouse.move(5, 700);
    const ng = pill(page, 'NG+');
    await ng.focus();
    await page.keyboard.press('Control+k');
    await expect(box(page)).toBeFocused();
    const landed = await watchFocus(page, { opener: ng });
    await page.goBack();
    await showsLevel(page, 'Eidos 7');
    // Eidos 7 comes back where its Next link was clicked, far below its pills.
    await expect.poll(() => ng.evaluate(el => el.getBoundingClientRect().bottom), 'the pill, off screen').toBeLessThan(0);
    await expect.poll(landed, 'where focus landed').toEqual(['Search button']);
    await expectClosedOnSearchButton(page);
    expect(await openerNow(page), "the opener's pill, now Eidos 7's").toMatchObject({ connected: true, text: 'NG+' });
  });

  for (const [how, arrive, travel] of [
    ['Back', privacyThenTerms, async (page: Page) => {
      await page.goBack();
      await expect(page).toHaveURL(/\/privacy$/);
    }],
    ['a typed fragment that names nothing', async (page: Page) => { await page.goto('/privacy'); }, async (page: Page) => {
      await page.evaluate(() => { location.hash = 'probe-fragment'; });
      await expect(page).toHaveURL(/\/privacy#probe-fragment$/);
    }],
  ] as const) {
    test(`${how} after Ctrl+K from a link in an open nav menu gives focus to the Search button, not to the menu's arrow`, async ({ page }) => {
      const { arrow, link } = await intoTheLevelsMenu(page, arrive);
      await page.keyboard.press('Control+k');
      await expect(box(page)).toBeFocused();
      await expect(arrow, 'opening the search closed the menu').toHaveAttribute('aria-expanded', 'false');
      const landed = await watchFocus(page, { arrow, link });
      await travel(page);
      await expect(box(page)).toHaveCount(0);
      await expect.poll(landed, 'where focus landed').toEqual(['Search button']);
      await expectClosedOnSearchButton(page);
    });
  }

  test('Back after a press on the results panel closes the search, and focus stays on the page', async ({ page }) => {
    await privacyThenTerms(page);
    await openWithResults(page);
    await pressThePanel(page);
    const searchButtonFocus = await countSearchButtonFocus(page);
    await page.goBack();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(box(page)).toHaveCount(0);
    await settle(page);
    expect(await focusOnPage(page), 'focus still on the page').toBe(true);
    expect(await searchButtonFocus(), 'the Search button took no focus').toBe(0);
  });

  test('Tab past its last control closes the search, and focus stays where Tab put it', async ({ page }) => {
    await page.goto('/privacy');
    await openWithResults(page);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(result(page, 'E2E page')).toBeFocused();
    const searchButtonFocus = await countSearchButtonFocus(page);
    await page.keyboard.press('Tab');
    await expect(signIn(page)).toBeFocused();
    await expect(box(page)).toHaveCount(0);
    await settle(page);
    await expect(signIn(page)).toBeFocused();
    expect(await searchButtonFocus(), 'the Search button took no focus').toBe(0);
  });

  test('Shift+Tab out of the box closes the search, and focus stays where it went', async ({ page }) => {
    await page.goto('/privacy');
    await openWithResults(page);
    const searchButtonFocus = await countSearchButtonFocus(page);
    await page.keyboard.press('Shift+Tab');
    // The last nav menu's arrow, before the search in the bar.
    const arrow = page.getByRole('button', { name: 'Toggle cosmetics menu', exact: true });
    await expect(arrow).toBeFocused();
    await expect(box(page)).toHaveCount(0);
    await settle(page);
    await expect(arrow).toBeFocused();
    expect(await searchButtonFocus(), 'the Search button took no focus').toBe(0);
  });

  test('Tab and Shift+Tab within the search keep it open', async ({ page }) => {
    await stubSearch(page, [
      { kind: 'level', title: 'E2E page', url: LEVEL },
      { kind: 'level', title: 'E2E other page', url: '/levels/xion' },
    ]);
    await page.goto('/privacy');
    await openWithResults(page);
    const clear = page.getByRole('button', { name: 'Clear search', exact: true });
    const stops = [box(page), clear, result(page, 'E2E page'), result(page, 'E2E other page')];
    for (const [key, at] of [['Tab', 1], ['Tab', 2], ['Tab', 3], ['Shift+Tab', 2], ['Shift+Tab', 1], ['Shift+Tab', 0]] as const) {
      await page.keyboard.press(key);
      await expect(stops[at]).toBeFocused();
      await expect(box(page)).toBeVisible();
    }
    await settle(page);
    await expect(box(page)).toBeFocused();
  });

  test('a press on the results panel keeps the search open, and Escape then closes it with focus on the Search button', async ({ page }) => {
    await page.goto('/privacy');
    await openWithResults(page);
    await pressThePanel(page);
    await settle(page);
    await expect(result(page, 'E2E page')).toBeVisible();
    await page.keyboard.press('Escape');
    await expectClosedOnSearchButton(page);
  });

  test('a press on the results panel, then Tab, closes the search, and focus stays where Tab put it', async ({ page }) => {
    await page.goto('/privacy');
    await openByButton(page);
    // The prompt holds no link, so Tab carries on from the press, past the search.
    await panel(page).getByText('Search collectibles, walkthroughs, levels…', { exact: true }).click();
    expect(await focusOnPage(page), 'focus on the page').toBe(true);
    await expect(box(page)).toBeVisible();
    const searchButtonFocus = await countSearchButtonFocus(page);
    await page.keyboard.press('Tab');
    await expect(signIn(page)).toBeFocused();
    await expect(box(page)).toHaveCount(0);
    await settle(page);
    await expect(signIn(page)).toBeFocused();
    expect(await searchButtonFocus(), 'the Search button took no focus').toBe(0);
  });

  test('a press on the panel showing No results, then Tab to a link and Enter, opens that page with no search open', async ({ page }) => {
    await stubSearch(page, []);
    await page.goto('/privacy');
    await openByButton(page);
    await box(page).fill('e2e');
    const none = panel(page).getByText(/^No results for/);
    await none.click();
    expect(await focusOnPage(page), 'focus on the page').toBe(true);
    await page.keyboard.press('Tab');
    await expect(signIn(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome back', exact: true })).toBeVisible();
    await settle(page);
    await expect(box(page)).toHaveCount(0);
    await expect(searchButton(page)).toBeVisible();
  });

  test('Tab from the search on into the page, and a link followed there, leaves no search open on the next page', async ({ page }) => {
    await page.goto('/terms');
    await openWithResults(page);
    const disclaimer = page.locator('footer').getByRole('link', { name: 'Disclaimer', exact: true });
    for (let i = 0; i < 12 && !(await disclaimer.evaluate(a => a === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(disclaimer).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Disclaimer', exact: true })).toBeVisible();
    await settle(page);
    await expect(box(page)).toHaveCount(0);
    await expect(searchButton(page)).toBeVisible();
  });

  test('a move the site makes on its own leaves the search open with its text', async ({ page }) => {
    // Answered here, as the API answers a good token: the page then moves on to sign-in in 3 s.
    await page.route('**/api/auth/reset-password', route => route.fulfill({ status: 204 }));
    await page.goto('/reset-password?token=e2e');
    await page.locator('#password').fill('e2e-new-password');
    await page.getByRole('button', { name: 'Update password', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Password updated', exact: true })).toBeVisible();
    await openByButton(page);
    await expect(page, 'the search opened before the page moved on').toHaveURL(/\/reset-password/);
    await box(page).fill('e2e');
    await expect(result(page, 'E2E page')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome back', exact: true })).toBeVisible();
    await settle(page);
    await expect(box(page)).toHaveValue('e2e');
    await expect(box(page)).toBeFocused();
    await expect(result(page, 'E2E page')).toBeVisible();
  });

  test('hovering a nav menu leaves the search open with its text', async ({ page }) => {
    await page.goto('/privacy');
    await page.mouse.move(5, 700);
    await openWithResults(page);
    const arrow = page.getByRole('button', { name: 'Toggle collectibles menu', exact: true });
    // The menu's label, clear of the open search.
    await arrow.locator('xpath=preceding-sibling::a').hover();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await settle(page);
    await expect(box(page)).toHaveValue('e2e');
    await expect(box(page)).toBeFocused();
    await expect(result(page, 'E2E page')).toBeVisible();
  });
});

// Whether the app took each K pressed from here on, read once the press has reached every listener.
async function watchK(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { kTaken: boolean[] };
    w.kTaken = [];
    addEventListener('keydown', e => {
      if (e.key === 'k') setTimeout(() => w.kTaken.push(e.defaultPrevented), 0);
    });
  });
  return () => page.evaluate(() => (window as unknown as { kTaken: boolean[] }).kTaken);
}

const KEYS = [['Ctrl+K', 'Control+k'], ['Cmd+K', 'Meta+k']] as const;

// Ctrl+K and Cmd+K open the search only where it shows, from the desktop layout up. Below it the
// keys are left to the browser, and nothing opens.
test.describe('Ctrl+K below the desktop layout', () => {
  test.use({ viewport: { width: 1023, height: 800 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  for (const [name, key] of KEYS) {
    test(`${name} is left to the browser, and opens nothing`, async ({ page }) => {
      await page.goto('/privacy');
      await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy', exact: true })).toBeVisible();
      const taken = await watchK(page);
      await page.keyboard.press(key);
      await expect.poll(taken, 'the press reached the page, and the app left it alone').toEqual([false]);
      await settle(page);
      await expect(page.locator(SEARCH_BUTTON), 'the search, still closed').toHaveCount(1);
      await expect(box(page)).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Toggle menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
    });
  }
});

test.describe('Ctrl+K at the desktop layout', () => {
  test.use({ viewport: { width: 1024, height: 800 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  for (const [name, key] of KEYS) {
    test(`${name} opens the search with focus in the box`, async ({ page }) => {
      await page.goto('/privacy');
      await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy', exact: true })).toBeVisible();
      const taken = await watchK(page);
      await page.keyboard.press(key);
      await expect(box(page)).toBeFocused();
      await expect.poll(taken, 'the app took the press').toEqual([true]);
    });
  }
});
