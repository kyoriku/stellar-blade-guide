import { test, expect, type Locator, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';
import { buildSlugMap, sectionAnchor } from '../../client/src/utils/slugify';
import { REVEAL_COPY } from '../../client/src/constants/revealCopy';

// A search pick of the address already open replaces its entry, so one Back still leaves the
// page: the page's own result, or the card or section the address names, by click, Enter or tap,
// also after Contents or Back to top rewrote the address, and for a Greek anchor, which the router
// holds encoded while the result holds it raw; the page itself stays where it is. A tracking query
// the address arrived with changes none of this, and the page's own result drops it. Every other
// pick adds an entry, as a link does, a card Contents or Back to top moved away from included. A
// click the browser takes, with Ctrl, Cmd, Shift or Alt, or one another handler has already
// prevented, leaves this tab's page, history and search as they are. Back is checked by where it
// lands, never by an offset.

const LEVEL = '/levels/eidos-7';
const DOCS = '/collectibles/documents';
const SUITS = '/cosmetics/nano-suits';
const PASSCODES = '/collectibles/passcodes';
const CATEGORY = '/walkthroughs/main-story';
const WALKTHROUGH = '/walkthroughs/main-story/eye-of-the-hurricane';
// A passcode card whose anchor is Greek letters.
const GREEK = '\u03b8\u03b8\u03ba\u03ba\u03ba\u03b5';
const OFFSET = 97; // the scroll-anchor margin from md up
const CARDS = 'section[id] article[id]';
const SECTIONS = 'div.walkthrough-content[id]';

type Result = { kind: string; title: string; url: string };
type Card = { id: number; title: string; cycle: string };

async function typeCards(page: Page, path: string): Promise<Card[]> {
  const res = await page.request.get(`/api${path}`);
  expect(res.status()).toBe(200);
  const levels = (await res.json()) as { locations: { collectibles: Card[] }[] }[];
  return levels.flatMap(l => l.locations.flatMap(loc => loc.collectibles));
}

async function sectionAnchors(page: Page, path: string): Promise<string[]> {
  const res = await page.request.get(`/api${path}`);
  expect(res.status()).toBe(200);
  const { content } = (await res.json()) as { content: { section_title?: string; order: number }[] };
  return content.map(sectionAnchor);
}

// Every search answers these results: what's under test is where a pick goes, not the
// ranking, and no Redis key is left behind.
async function stubSearch(page: Page, results: Result[]) {
  await page.route('**/api/search/**', route => route.fulfill({
    json: {
      query: 'e2e',
      total: results.length,
      results: results.map((r, i) => ({ kind: r.kind, id: i + 1, title: r.title, snippet: null, navigation_url: r.url, score: 4 })),
    },
  }));
}

const desktopPanel = (page: Page) => page.locator('.animate-drop-in');
const drawer = (page: Page) => page.locator('#mobile-menu');
const resultIn = (panel: Locator, title: string) => panel.getByRole('link', { name: title, exact: true });

async function openSearch(page: Page) {
  await page.getByRole('button', { name: 'Search (Ctrl+K)', exact: true }).click();
  await page.getByPlaceholder('Search…').fill('e2e');
  await expect(desktopPanel(page).getByRole('link').first()).toBeVisible();
}

async function pickByClick(page: Page, title: string) {
  await openSearch(page);
  await resultIn(desktopPanel(page), title).click();
}

// Arrows down to the result, as the box takes them, then Enter.
async function pickByEnter(page: Page, title: string) {
  await openSearch(page);
  const rows = desktopPanel(page).getByRole('link');
  const index = (await rows.allTextContents()).findIndex(text => text.trim() === title);
  expect(index, `a result titled ${title}`).toBeGreaterThanOrEqual(0);
  for (let i = 0; i <= index; i++) await page.keyboard.press('ArrowDown');
  await expect(rows.nth(index)).toHaveClass(/bg-gray-800\/70/);
  await page.keyboard.press('Enter');
}

const pick = { click: pickByClick, Enter: pickByEnter };

async function tapResult(page: Page, title: string) {
  await page.getByRole('button', { name: 'Toggle menu' }).tap();
  await drawer(page).locator('input[name="text"]').fill('e2e');
  await resultIn(drawer(page), title).tap();
}

// The browser's current entry: React Router's key and index, and the address, its hash decoded.
const entry = (page: Page) => page.evaluate(() => {
  const state = history.state as { key?: string; idx?: number } | null;
  return {
    length: history.length,
    idx: state?.idx,
    key: state?.key,
    address: location.pathname + location.search + decodeURIComponent(location.hash),
  };
});
type Entry = Awaited<ReturnType<typeof entry>>;

// The pick navigated (a new key) without adding an entry.
async function expectReplaced(page: Page, before: Entry) {
  await expect.poll(async () => (await entry(page)).key, 'the pick navigated').not.toBe(before.key);
  const { length, idx } = await entry(page);
  expect({ length, idx }, 'no entry added').toEqual({ length: before.length, idx: before.idx });
}

async function expectPushed(page: Page, before: Entry) {
  await expect.poll(async () => (await entry(page)).key, 'the pick navigated').not.toBe(before.key);
  const { length, idx } = await entry(page);
  expect({ length, idx }, 'an entry added').toEqual({ length: before.length + 1, idx: (before.idx ?? 0) + 1 });
}

async function expectBackTo(page: Page, address: string) {
  await page.goBack();
  await expect.poll(async () => (await entry(page)).address, 'where one Back lands').toBe(address);
}

// Opens `address` from the home page by a search pick, a push, so one Back from it lands there.
async function arrive(page: Page, title: string, address: string, ready: string, by: 'click' | 'tap' = 'click') {
  await page.goto('/');
  if (by === 'tap') await tapResult(page, title);
  else await pickByClick(page, title);
  await expect.poll(async () => (await entry(page)).address).toBe(address);
  await page.locator(ready).first().waitFor();
}

// Where a jump to `id` puts the page: a section's first card takes its section along
// (scrollToCard), so its heading shows. Retried until the jump has happened.
async function expectJumpedTo(page: Page, id: string) {
  await expect(async () => {
    const top = await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const section = el.closest('section[id]');
      const landing = section?.querySelector('article') === el ? section! : el;
      return Math.round(landing.getBoundingClientRect().top);
    }, id);
    expect(top, `#${id} on the page`).not.toBeNull();
    expect(Math.abs(top! - OFFSET), `#${id}'s landing ${top}px down`).toBeLessThanOrEqual(1);
  }).toPass({ timeout: 10_000 });
}

// An absence can't be polled for, so this gives a scroll two frames to happen first.
const settle = (page: Page) => page.evaluate(() =>
  new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 100)))));

// Two idle callbacks, which wait for React's render of a pick and its commit, where ScrollToTop
// scrolls, however slow the CPU.
const idle = (page: Page) => page.evaluate(() =>
  new Promise(done => requestIdleCallback(() => requestIdleCallback(() => done(null)))));

const scrollY = (page: Page) => page.evaluate(() => window.scrollY);

// Scrolls about 1500px down, as a reader would, and gives the offset reached.
async function scrollDown(page: Page) {
  const y = await page.evaluate(() => {
    window.scrollTo(0, Math.min(1500, document.documentElement.scrollHeight - window.innerHeight));
    return window.scrollY;
  });
  expect(y, 'the page scrolls').toBeGreaterThan(300);
  return y;
}

const pill = (page: Page, label: string) => page.getByRole('button', { name: label, exact: true });
const note = (page: Page) => page.locator('span.sr-only[aria-live="polite"]').filter({ hasText: / set to All to show / });
const filterRecord = (page: Page) => page.evaluate(() =>
  (history.state as { usr?: { sbFilters?: { cycle?: string } } | null } | null)?.usr?.sbFilters ?? null);

test.describe('search history, desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  for (const { name, path, kind, ready } of [
    { name: 'level', path: LEVEL, kind: 'level', ready: CARDS },
    { name: 'type', path: DOCS, kind: 'type', ready: CARDS },
    { name: 'category', path: CATEGORY, kind: 'walkthrough_type', ready: `a[href^="${CATEGORY}/"]` },
    { name: 'walkthrough', path: WALKTHROUGH, kind: 'walkthrough', ready: SECTIONS },
  ]) {
    test(`Enter on the ${name} page's own result keeps its entry and its place, and one Back leaves`, async ({ page }) => {
      await stubSearch(page, [{ kind, title: 'E2E page', url: path }]);
      await arrive(page, 'E2E page', path, ready);

      let before = await entry(page);
      await pickByEnter(page, 'E2E page');
      await expectReplaced(page, before);
      await settle(page);
      expect(await scrollY(page), 'still at the top').toBe(0);

      const y = await page.evaluate(() => {
        window.scrollTo(0, Math.min(1500, document.documentElement.scrollHeight - window.innerHeight));
        return window.scrollY;
      });
      expect(y, 'the page scrolls').toBeGreaterThan(300);
      before = await entry(page);
      await pickByEnter(page, 'E2E page');
      await expectReplaced(page, before);
      await settle(page);
      expect(await scrollY(page), 'still where it was').toBe(y);

      await expectBackTo(page, '/');
    });
  }

  test("Enter on a card's result again keeps the entry, lands on the card and hands it focus", async ({ page }) => {
    const cards = await typeCards(page, DOCS);
    const id = buildSlugMap(cards).get(cards[Math.floor(cards.length / 2)].id)!;
    await stubSearch(page, [{ kind: 'collectibles', title: 'E2E card', url: `${DOCS}#${id}` }]);
    await arrive(page, 'E2E card', `${DOCS}#${id}`, CARDS);
    await expectJumpedTo(page, id);
    await page.evaluate(() => window.scrollTo(0, 0));

    const before = await entry(page);
    await pickByEnter(page, 'E2E card');
    await expectReplaced(page, before);
    await expectJumpedTo(page, id);
    await expect(page.locator(`article[id="${id}"] h2`)).toBeFocused();
    await expectBackTo(page, '/');
  });

  test("a Greek card's result picked again keeps the entry, by click and by Enter, also after a reload", async ({ page }) => {
    // Raw, as the server sends it; the router reads the address back encoded.
    const url = `${PASSCODES}#${GREEK}`;
    await stubSearch(page, [{ kind: 'collectibles', title: 'E2E card', url }]);
    await arrive(page, 'E2E card', url, CARDS);
    await expect(page.locator(`article[id="${GREEK}"]`), 'the anchor the page renders').toHaveCount(1);
    expect(await page.evaluate(() => location.hash)).toBe(`#${encodeURIComponent(GREEK)}`);

    for (const reloaded of [false, true]) {
      if (reloaded) {
        await page.reload();
        await page.locator(CARDS).first().waitFor();
      }
      for (const how of ['click', 'Enter'] as const) {
        await page.evaluate(() => window.scrollTo(0, 0));
        const before = await entry(page);
        await pick[how](page, 'E2E card');
        await expectReplaced(page, before);
        await expect(page.locator(`article[id="${GREEK}"] h2`), `focus after ${how}${reloaded ? ', reloaded' : ''}`).toBeFocused();
      }
    }
    await expectBackTo(page, '/');
  });

  test('the result for the section a Contents jump went to keeps the entry, by click and by Enter', async ({ page }) => {
    const anchors = await sectionAnchors(page, WALKTHROUGH);
    const [first, second] = [anchors[Math.floor(anchors.length / 2)], anchors[Math.floor(anchors.length / 2) + 1]];
    await stubSearch(page, [
      { kind: 'walkthrough', title: 'E2E page', url: WALKTHROUGH },
      { kind: 'walkthrough', title: 'E2E first section', url: `${WALKTHROUGH}#${first}` },
      { kind: 'walkthrough', title: 'E2E second section', url: `${WALKTHROUGH}#${second}` },
    ]);
    await arrive(page, 'E2E page', WALKTHROUGH, SECTIONS);

    for (const [id, how, title] of [[first, 'click', 'E2E first section'], [second, 'Enter', 'E2E second section']] as const) {
      // Contents rewrites the address without telling the router.
      await page.locator(`aside a[href="#${id}"]`).click();
      await expect.poll(async () => (await entry(page)).address).toBe(`${WALKTHROUGH}#${id}`);
      const before = await entry(page);
      await pick[how](page, title);
      await expectReplaced(page, before);
      await expect(page.locator(`div.walkthrough-content[id="${id}"] h3`), `focus after ${how}`).toBeFocused();
    }
    await expectBackTo(page, '/');
  });

  for (const how of ['click', 'Enter'] as const) {
    test(`after Back to top from a card and a scroll down, the page's own result by ${how} keeps the entry and its place`, async ({ page }) => {
      const cards = await typeCards(page, DOCS);
      const id = buildSlugMap(cards).get(cards[Math.floor(cards.length / 2)].id)!;
      await stubSearch(page, [
        { kind: 'collectibles', title: 'E2E card', url: `${DOCS}#${id}` },
        { kind: 'type', title: 'E2E page', url: DOCS },
      ]);
      await arrive(page, 'E2E card', `${DOCS}#${id}`, CARDS);
      await expectJumpedTo(page, id);
      // Back to top drops the hash without telling the router, which still holds the card's.
      const backToTop = page.locator('aside button[aria-label="Back to top"]');
      await expect(backToTop).toHaveCSS('opacity', '1');
      await backToTop.click();
      await expect.poll(() => page.evaluate(() => [window.scrollY, location.hash])).toEqual([0, '']);
      const y = await scrollDown(page);

      const before = await entry(page);
      await pick[how](page, 'E2E page');
      await expectReplaced(page, before);
      await idle(page);
      expect(await scrollY(page), 'still where it was').toBe(y);
      await expectBackTo(page, '/');
    });
  }

  for (const how of ['click', 'Enter'] as const) {
    test(`after a Contents jump, the walkthrough page's own result by ${how} keeps the entry and its place`, async ({ page }) => {
      const anchors = await sectionAnchors(page, WALKTHROUGH);
      const id = anchors[Math.floor(anchors.length / 2)];
      await stubSearch(page, [{ kind: 'walkthrough', title: 'E2E page', url: WALKTHROUGH }]);
      await arrive(page, 'E2E page', WALKTHROUGH, SECTIONS);
      // Contents rewrites the address without telling the router, which holds no hash.
      await page.locator(`aside a[href="#${id}"]`).click();
      await expect.poll(async () => (await entry(page)).address).toBe(`${WALKTHROUGH}#${id}`);
      await settle(page);
      const y = await scrollY(page);
      expect(y, 'the Contents jump scrolled').toBeGreaterThan(300);

      const before = await entry(page);
      await pick[how](page, 'E2E page');
      await expectReplaced(page, before);
      await settle(page);
      expect(await scrollY(page), 'still where it was').toBe(y);
      await expectBackTo(page, '/');
    });
  }

  for (const how of ['click', 'Enter'] as const) {
    test(`after arriving with a tracking query, the page's own result by ${how} keeps the entry and its place, and drops the query`, async ({ page }) => {
      await stubSearch(page, [{ kind: 'level', title: 'E2E page', url: LEVEL }]);
      // Two documents, so one Back from the page lands on the home page.
      await page.goto('/');
      await page.goto(`${LEVEL}?fbclid=e2e`);
      await page.locator(CARDS).first().waitFor();
      const y = await scrollDown(page);

      const before = await entry(page);
      await pick[how](page, 'E2E page');
      await expectReplaced(page, before);
      expect((await entry(page)).address, 'the address, without the query').toBe(LEVEL);
      await settle(page);
      expect(await scrollY(page), 'still where it was').toBe(y);
      await expectBackTo(page, '/');
    });
  }

  for (const how of ['click', 'Enter'] as const) {
    test(`with a filter on, the type page's own result by ${how} keeps the filter and the entry`, async ({ page }) => {
      await stubSearch(page, [{ kind: 'type', title: 'E2E page', url: SUITS }]);
      await arrive(page, 'E2E page', SUITS, CARDS);
      await pill(page, 'NG+').click();
      await expect(pill(page, 'NG+')).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(async () => (await filterRecord(page))?.cycle).toBe('NG+');

      const before = await entry(page);
      await pick[how](page, 'E2E page');
      await expectReplaced(page, before);
      // Written once the page has rendered the new entry, so the pills are read after that render.
      await expect.poll(async () => (await filterRecord(page))?.cycle, 'the entry keeps the filter').toBe('NG+');
      await expect(pill(page, 'NG+')).toHaveAttribute('aria-pressed', 'true');
      await expectBackTo(page, '/');
    });
  }

  for (const how of ['click', 'Enter'] as const) {
    test(`a card the filter hides, picked again by ${how}, still shows, and its entry is replaced`, async ({ page }) => {
      const cards = await typeCards(page, SUITS);
      const base = cards.filter(c => c.cycle === 'Base');
      const card = base[Math.floor(base.length / 2)];
      const id = buildSlugMap(cards).get(card.id)!;
      await stubSearch(page, [{ kind: 'cosmetics', title: 'E2E card', url: `${SUITS}#${id}` }]);
      await arrive(page, 'E2E card', `${SUITS}#${id}`, CARDS);
      await expectJumpedTo(page, id);
      await pill(page, 'NG+').click();
      await expect(page.locator(`article[id="${id}"]`)).toHaveCount(0);

      const before = await entry(page);
      await pick[how](page, 'E2E card');
      await expect(pill(page, 'All')).toHaveAttribute('aria-pressed', 'true');
      await expect(note(page)).toHaveText(REVEAL_COPY.shown(card.title));
      await expectJumpedTo(page, id);
      await expectReplaced(page, before);
      expect(await filterRecord(page), 'the entry keeps no filter').toBeNull();
      await expectBackTo(page, '/');
    });
  }

  for (const how of ['click', 'Enter'] as const) {
    test(`the page's own result while at a card, by ${how}, adds an entry, goes to the top, and Back returns to the card`, async ({ page }) => {
      const cards = await typeCards(page, DOCS);
      const id = buildSlugMap(cards).get(cards[Math.floor(cards.length / 2)].id)!;
      await stubSearch(page, [
        { kind: 'collectibles', title: 'E2E card', url: `${DOCS}#${id}` },
        { kind: 'type', title: 'E2E page', url: DOCS },
      ]);
      await arrive(page, 'E2E card', `${DOCS}#${id}`, CARDS);
      await expectJumpedTo(page, id);
      expect(await scrollY(page), 'at the card, well down the page').toBeGreaterThan(1000);

      const before = await entry(page);
      await pick[how](page, 'E2E page');
      await expectPushed(page, before);
      await expect.poll(() => scrollY(page), 'the page goes to its top').toBe(0);
      await expectBackTo(page, `${DOCS}#${id}`);
    });
  }

  for (const how of ['click', 'Enter'] as const) {
    test(`another card's result, by ${how}, adds an entry, and Back returns to the first card`, async ({ page }) => {
      const cards = await typeCards(page, DOCS);
      const slugs = buildSlugMap(cards);
      const first = slugs.get(cards[Math.floor(cards.length / 3)].id)!;
      const second = slugs.get(cards[Math.floor((2 * cards.length) / 3)].id)!;
      await stubSearch(page, [
        { kind: 'collectibles', title: 'E2E first card', url: `${DOCS}#${first}` },
        { kind: 'collectibles', title: 'E2E second card', url: `${DOCS}#${second}` },
      ]);
      await arrive(page, 'E2E first card', `${DOCS}#${first}`, CARDS);

      const before = await entry(page);
      await pick[how](page, 'E2E second card');
      await expectPushed(page, before);
      await expectJumpedTo(page, second);
      await expectBackTo(page, `${DOCS}#${first}`);
    });
  }

  for (const how of ['click', 'Enter'] as const) {
    test(`a card's result picked again after Back to top, by ${how}, adds an entry, and Back returns to the top`, async ({ page }) => {
      const cards = await typeCards(page, DOCS);
      const id = buildSlugMap(cards).get(cards[Math.floor(cards.length / 2)].id)!;
      await stubSearch(page, [{ kind: 'collectibles', title: 'E2E card', url: `${DOCS}#${id}` }]);
      await arrive(page, 'E2E card', `${DOCS}#${id}`, CARDS);
      await expectJumpedTo(page, id);
      // Back to top drops the hash without telling the router, which keeps the card's.
      const backToTop = page.locator('aside button[aria-label="Back to top"]');
      await expect(backToTop).toHaveCSS('opacity', '1');
      await backToTop.click();
      await expect.poll(() => page.evaluate(() => [window.scrollY, location.hash])).toEqual([0, '']);

      const before = await entry(page);
      await pick[how](page, 'E2E card');
      await expectPushed(page, before);
      await expectJumpedTo(page, id);
      await expectBackTo(page, DOCS);
    });

    test(`a card's result picked again after Contents moved elsewhere, by ${how}, adds an entry, and Back returns to that section`, async ({ page }) => {
      const cards = await typeCards(page, DOCS);
      const id = buildSlugMap(cards).get(cards[Math.floor(cards.length / 2)].id)!;
      await stubSearch(page, [{ kind: 'collectibles', title: 'E2E card', url: `${DOCS}#${id}` }]);
      await arrive(page, 'E2E card', `${DOCS}#${id}`, CARDS);
      await expectJumpedTo(page, id);
      // Contents rewrites the address without telling the router, which keeps the card's hash.
      const contents = page.locator('aside nav a[href^="#"]').first();
      const section = `${DOCS}${decodeURIComponent((await contents.getAttribute('href'))!)}`;
      await contents.click();
      await expect.poll(async () => (await entry(page)).address).toBe(section);

      const before = await entry(page);
      await pick[how](page, 'E2E card');
      await expectPushed(page, before);
      await expectJumpedTo(page, id);
      await expectBackTo(page, section);
    });
  }

  for (const [whose, title, kept] of [
    ["the page's own result", 'E2E page', 'history'],
    ["another page's result", 'E2E other page', 'page'],
  ] as const) {
    for (const [key, label] of [['Control', 'Ctrl'], ['Meta', 'Cmd'], ['Shift', 'Shift'], ['Alt', 'Alt']] as const) {
      test(`${label}+click on ${whose} leaves the click to the browser, and this tab's ${kept} and search as they are`, async ({ page }) => {
        await stubSearch(page, [
          { kind: 'level', title: 'E2E page', url: LEVEL },
          { kind: 'type', title: 'E2E other page', url: DOCS },
        ]);
        await arrive(page, 'E2E page', LEVEL, CARDS);
        const before = await entry(page);
        await openSearch(page);
        // Last on the click's way up, after the app's handlers: whether the app left the click (a
        // new tab or window, or a download) to the browser. It then cancels it, since Playwright
        // can stall on reporting a new tab.
        await page.evaluate(() => window.addEventListener('click', e => {
          (window as unknown as { leftToBrowser: boolean }).leftToBrowser = !e.defaultPrevented;
          e.preventDefault();
        }, { once: true }));
        await resultIn(desktopPanel(page), title).click({ modifiers: [key] });
        expect(await page.evaluate(() => (window as unknown as { leftToBrowser?: boolean }).leftToBrowser),
          'the click left to the browser').toBe(true);
        await settle(page);
        expect(await entry(page), 'this tab did not navigate').toEqual(before);
        await expect(page.getByPlaceholder('Search…'), "this tab's search, still open with its text").toHaveValue('e2e');
        await expect(resultIn(desktopPanel(page), title), 'its results, still showing').toBeVisible();
      });
    }
  }

  for (const [name, title] of [
    ["a plain click another handler already prevented leaves this tab's page, history and search as they are", 'E2E page'],
    ["a plain click another handler already prevented, on another page's result, leaves this tab's page and search as they are", 'E2E other page'],
  ] as const) {
    test(name, async ({ page }) => {
      await stubSearch(page, [
        { kind: 'level', title: 'E2E page', url: LEVEL },
        { kind: 'type', title: 'E2E other page', url: DOCS },
      ]);
      await arrive(page, 'E2E page', LEVEL, CARDS);
      const before = await entry(page);
      await openSearch(page);
      // First on the click's way down, before the app's handlers: another script takes it.
      await page.evaluate(() => window.addEventListener('click', e => {
        e.preventDefault();
        (window as unknown as { prevented: boolean }).prevented = true;
      }, { capture: true, once: true }));
      await resultIn(desktopPanel(page), title).click();
      expect(await page.evaluate(() => (window as unknown as { prevented?: boolean }).prevented),
        'the other handler took the click').toBe(true);
      await settle(page);
      expect(await entry(page), 'this tab did not navigate').toEqual(before);
      await expect(page.getByPlaceholder('Search…'), "this tab's search, still open with its text").toHaveValue('e2e');
      await expect(resultIn(desktopPanel(page), title), 'its results, still showing').toBeVisible();
    });
  }
});

test.describe('search history, phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test("a tap on a Greek card's result again keeps the entry", async ({ page }) => {
    const url = `${PASSCODES}#${GREEK}`;
    await stubSearch(page, [{ kind: 'collectibles', title: 'E2E card', url }]);
    await arrive(page, 'E2E card', url, CARDS, 'tap');
    await page.evaluate(() => window.scrollTo(0, 0));

    const before = await entry(page);
    await tapResult(page, 'E2E card');
    await expectReplaced(page, before);
    await expect(page.locator(`article[id="${GREEK}"] h2`)).toBeFocused();
    await expectBackTo(page, '/');
  });

  test('a tap on the result for the section a Contents jump went to keeps the entry', async ({ page }) => {
    const anchors = await sectionAnchors(page, WALKTHROUGH);
    const id = anchors[Math.floor(anchors.length / 2)];
    await stubSearch(page, [
      { kind: 'walkthrough', title: 'E2E page', url: WALKTHROUGH },
      { kind: 'walkthrough', title: 'E2E section', url: `${WALKTHROUGH}#${id}` },
    ]);
    await arrive(page, 'E2E page', WALKTHROUGH, SECTIONS, 'tap');
    // The floating Contents drawer, which rewrites the address without telling the router.
    await page.getByRole('button', { name: 'Open table of contents', exact: true }).tap();
    await page.locator(`a[href="#${id}"]:not(aside a)`).tap();
    await expect.poll(async () => (await entry(page)).address).toBe(`${WALKTHROUGH}#${id}`);

    const before = await entry(page);
    await tapResult(page, 'E2E section');
    await expectReplaced(page, before);
    await expectBackTo(page, '/');
  });

  test("after Top from a card and a scroll down, a tap on the page's own result keeps the entry and its place", async ({ page }) => {
    const cards = await typeCards(page, DOCS);
    const id = buildSlugMap(cards).get(cards[Math.floor(cards.length / 2)].id)!;
    await stubSearch(page, [
      { kind: 'collectibles', title: 'E2E card', url: `${DOCS}#${id}` },
      { kind: 'type', title: 'E2E page', url: DOCS },
    ]);
    await arrive(page, 'E2E card', `${DOCS}#${id}`, CARDS, 'tap');
    // The jump to the card, far down the page; the Top pill shows past 500px.
    await expect.poll(() => scrollY(page)).toBeGreaterThan(1000);
    await page.getByRole('button', { name: 'Back to top', exact: true }).tap();
    await expect.poll(() => page.evaluate(() => [window.scrollY, location.hash])).toEqual([0, '']);
    const y = await scrollDown(page);

    const before = await entry(page);
    await tapResult(page, 'E2E page');
    await expectReplaced(page, before);
    await idle(page);
    expect(await scrollY(page), 'still where it was').toBe(y);
    await expectBackTo(page, '/');
  });

  test("a tap on the page's own result while at a card adds an entry, goes to the top, and Back returns to the card", async ({ page }) => {
    const cards = await typeCards(page, DOCS);
    const id = buildSlugMap(cards).get(cards[Math.floor(cards.length / 2)].id)!;
    await stubSearch(page, [
      { kind: 'collectibles', title: 'E2E card', url: `${DOCS}#${id}` },
      { kind: 'type', title: 'E2E page', url: DOCS },
    ]);
    await arrive(page, 'E2E card', `${DOCS}#${id}`, CARDS, 'tap');
    // The jump to the card, far down the page.
    await expect.poll(() => scrollY(page)).toBeGreaterThan(1000);

    const before = await entry(page);
    await tapResult(page, 'E2E page');
    await expectPushed(page, before);
    await expect.poll(() => scrollY(page), 'the page goes to its top').toBe(0);
    await expectBackTo(page, `${DOCS}#${id}`);
  });

  test("a tap on a card's result again after Top adds an entry, and Back returns to the top", async ({ page }) => {
    const cards = await typeCards(page, DOCS);
    const id = buildSlugMap(cards).get(cards[Math.floor(cards.length / 2)].id)!;
    await stubSearch(page, [{ kind: 'collectibles', title: 'E2E card', url: `${DOCS}#${id}` }]);
    await arrive(page, 'E2E card', `${DOCS}#${id}`, CARDS, 'tap');
    await expect.poll(() => scrollY(page)).toBeGreaterThan(1000);
    await page.getByRole('button', { name: 'Back to top', exact: true }).tap();
    await expect.poll(() => page.evaluate(() => [window.scrollY, location.hash])).toEqual([0, '']);

    const before = await entry(page);
    await tapResult(page, 'E2E card');
    await expectPushed(page, before);
    await expectBackTo(page, DOCS);
  });

  test("after arriving with a tracking query, a tap on the page's own result keeps the entry and its place, and drops the query", async ({ page }) => {
    await stubSearch(page, [{ kind: 'level', title: 'E2E page', url: LEVEL }]);
    // Two documents, so one Back from the page lands on the home page.
    await page.goto('/');
    await page.goto(`${LEVEL}?fbclid=e2e`);
    await page.locator(CARDS).first().waitFor();
    const y = await scrollDown(page);

    const before = await entry(page);
    await tapResult(page, 'E2E page');
    await expectReplaced(page, before);
    expect((await entry(page)).address, 'the address, without the query').toBe(LEVEL);
    await settle(page);
    expect(await scrollY(page), 'still where it was').toBe(y);
    await expectBackTo(page, '/');
  });
});
