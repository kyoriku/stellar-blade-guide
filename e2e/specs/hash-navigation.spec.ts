import { test, expect, type Locator, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { readFixtures, createCommentThread, deleteFixtureComments, type Fixtures } from '../helpers/db';
import { holdRoute } from '../helpers/route';
import { buildSlugMap } from '../../client/src/utils/slugify';
import { cycleLabel } from '../../client/src/constants/cycleLabels';

// A link or a search result to something on the page jumps to it on every navigation
// (useHashJump): the same link again, a link to the hash the address held before Contents or
// Back to top rewrote it, a first visit whose data arrives late. A refetch afterwards leaves
// the reader where they are. Link clicks land where the app puts them, so those check the
// landing; Back, Forward and a typed fragment, where the browser scrolls again afterwards,
// check what the app did instead.

const OFFSET = 97; // the scroll-anchor margin from md up
const TYPE = '/cosmetics/nano-suits';
const TYPE_API = `**/api${TYPE}`;

type Card = { id: number; title: string; cycle: string; description: { type: string; content?: string } };

async function typeCards(page: Page, path: string): Promise<Card[]> {
  const res = await page.request.get(`/api${path}`);
  expect(res.status()).toBe(200);
  const levels = (await res.json()) as { locations: { collectibles: Card[] }[] }[];
  return levels.flatMap(l => l.locations.flatMap(loc => loc.collectibles));
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

// A same-page wikilink on a card, where the card and its target can both be scrolled to the offset.
async function samePageLink(page: Page): Promise<{ href: string; target: string }> {
  await page.locator('section[id] article[id]').first().waitFor();
  const found = await page.evaluate(({ path, offset }) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const reachable = (el: Element) => {
      const section = el.closest('section[id]');
      const landing = section?.querySelector('article') === el ? section! : el;
      const top = landing.getBoundingClientRect().top + window.scrollY - offset;
      return top > 0 && top < maxScroll;
    };
    for (const a of document.querySelectorAll<HTMLAnchorElement>(`article a[href^="${path}#"]`)) {
      const href = a.getAttribute('href')!;
      const target = decodeURIComponent(href.slice(href.indexOf('#') + 1));
      const el = document.getElementById(target);
      if (el && !el.contains(a) && reachable(el) && reachable(a.closest('article')!)) return { href, target };
    }
    return null;
  }, { path: TYPE, offset: OFFSET });
  expect(found, `a card on ${TYPE} links another card on it`).not.toBeNull();
  return found!;
}

// Two cards in the middle of the page, both of which can be scrolled to the offset.
async function twoReachableCards(page: Page): Promise<[string, string]> {
  await page.locator('section[id] article[id]').first().waitFor();
  const ids = await page.evaluate((offset) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    return [...document.querySelectorAll('section[id] article[id]')].filter(el => {
      const section = el.closest('section[id]');
      const landing = section?.querySelector('article') === el ? section! : el;
      const top = landing.getBoundingClientRect().top + window.scrollY - offset;
      return top > 0 && top < maxScroll;
    }).map(el => el.id);
  }, OFFSET);
  expect(ids.length, 'cards that can be scrolled to').toBeGreaterThan(10);
  return [ids[Math.floor(ids.length / 3)], ids[Math.floor((2 * ids.length) / 3)]];
}

const linkTo = (page: Page, href: string) => page.locator(`article a[href="${href}"]`).first();
// A press with no scroll of Playwright's first, which could bring the target near the offset.
const press = (link: Locator) => link.evaluate(a => (a as HTMLElement).click());

// Every search answers one result leading to `url`: what's under test is the page it opens,
// not the ranking, and no Redis key is left behind.
async function stubSearch(page: Page, url: string, kind: string) {
  await page.route('**/api/search/**', route => route.fulfill({
    json: { query: 'e2e', total: 1, results: [{ kind, id: 1, title: 'E2E result', snippet: null, navigation_url: url, score: 4 }] },
  }));
}

async function chooseResult(page: Page) {
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder('Search…').fill('e2e');
  const row = page.locator('.animate-drop-in a').first();
  await expect(row).toBeVisible();
  await row.click();
}

// An absence can't be polled for, so this gives a jump two frames to happen first.
const settle = (page: Page) => page.evaluate(() =>
  new Promise(done => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 100)))));

// The scroll the app asks for, by window.scrollTo; the browser's own restore and fragment
// scroll go around it.
async function spyOnAppScrolls(page: Page) {
  await page.addInitScript(() => {
    const calls: number[] = [];
    (window as unknown as { appScrolls: number[] }).appScrolls = calls;
    const original = window.scrollTo.bind(window) as (...args: unknown[]) => void;
    window.scrollTo = ((...args: unknown[]) => {
      const [a, b] = args;
      calls.push(typeof a === 'object' && a !== null ? Number((a as ScrollToOptions).top) : Number(b));
      original(...args);
    }) as typeof window.scrollTo;
  });
}

const takeAppScrolls = (page: Page) => page.evaluate(() => {
  const calls = (window as unknown as { appScrolls: number[] }).appScrolls;
  return calls.splice(0, calls.length);
});

// Where the app's jump to `id` scrolls the window to.
const landingOf = (page: Page, id: string) => page.evaluate((id) => {
  const el = document.getElementById(id)!;
  const section = el.closest('section[id]');
  const landing = section?.querySelector('article') === el ? section! : el;
  const margin = parseFloat(getComputedStyle(landing).scrollMarginTop) || 0;
  return landing.getBoundingClientRect().top + window.scrollY - margin;
}, id);

test.describe('hash navigation', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('the same link again jumps again', async ({ page }) => {
    await page.goto(TYPE);
    const { href, target } = await samePageLink(page);
    await press(linkTo(page, href));
    await expectJumpedTo(page, target);
    await page.evaluate(() => window.scrollTo(0, 0));
    await press(linkTo(page, href));
    await expectJumpedTo(page, target);
  });

  test('a link to the hash a Contents jump replaced jumps', async ({ page }) => {
    await page.goto(TYPE);
    const { href, target } = await samePageLink(page);
    await press(linkTo(page, href));
    await expectJumpedTo(page, target);
    // Contents rewrites the address without a navigation, so the router still holds the link's hash.
    const entry = page.locator('aside nav a[href^="#"]').first();
    await entry.click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(await entry.getAttribute('href'));
    await press(linkTo(page, href));
    await expectJumpedTo(page, target);
    await expect.poll(() => page.evaluate(() => decodeURIComponent(location.hash.slice(1)))).toBe(target);
  });

  test('a link to the hash Back to top dropped jumps', async ({ page }) => {
    await page.goto(TYPE);
    const { href, target } = await samePageLink(page);
    await press(linkTo(page, href));
    await expectJumpedTo(page, target);
    const backToTop = page.locator('aside button[aria-label="Back to top"]');
    await expect(backToTop).toHaveCSS('opacity', '1');
    await backToTop.click();
    await expect.poll(() => page.evaluate(() => [window.scrollY, location.hash])).toEqual([0, '']);
    await press(linkTo(page, href));
    await expectJumpedTo(page, target);
  });

  // Whatever the page does with a link to a card its filter hides, pressing All and the same
  // link again lands on it: the second press is a navigation to the address already open.
  test('a link pressed again after All lands, though the cycle filter hid its target the first time', async ({ page }) => {
    const cards = await typeCards(page, TYPE);
    const slugs = buildSlugMap(cards);
    const bySlug = new Map(cards.map(c => [slugs.get(c.id)!, c]));
    const pair = cards.flatMap(source => [...(source.description.content ?? '').matchAll(/\[\[cosmetics\/nano-suits#([^|\]]+)\|/g)]
      .map(m => ({ source, target: bySlug.get(m[1]) }))
      .filter(p => p.target && p.target.cycle !== source.cycle))[0];
    expect(pair, `a ${TYPE} card links a card of another cycle on the page`).toBeTruthy();
    const href = `${TYPE}#${slugs.get(pair.target!.id)}`;

    await page.goto(TYPE);
    await page.getByRole('button', { name: cycleLabel(pair.source.cycle), exact: true }).click();
    await press(linkTo(page, href));
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await press(linkTo(page, href));
    await expectJumpedTo(page, slugs.get(pair.target!.id)!);
  });

  for (const { name, path, selector, kind } of [
    { name: 'level', path: '/levels/eidos-7', selector: 'section[id] article[id]:not(:first-child)', kind: 'level' },
    { name: 'type', path: TYPE, selector: 'section[id] article[id]:not(:first-child)', kind: 'cosmetics' },
    { name: 'walkthrough', path: '/walkthroughs/main-story/eye-of-the-hurricane', selector: 'section > div.walkthrough-content[id]', kind: 'walkthrough' },
  ]) {
    test(`a search result on the ${name} page it opens jumps each time it is chosen`, async ({ page }) => {
      await page.goto(path);
      await page.locator(selector).first().waitFor();
      const id = await page.evaluate(({ selector, offset }) => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const ok = [...document.querySelectorAll(selector)].filter(el => {
          const top = el.getBoundingClientRect().top + window.scrollY - offset;
          return el.id && top > 0 && top < maxScroll;
        });
        return ok[Math.floor(ok.length / 2)]?.id ?? null;
      }, { selector, offset: OFFSET });
      expect(id, `a ${selector} that can be scrolled to`).not.toBeNull();
      await stubSearch(page, `${path}#${encodeURIComponent(id!)}`, kind);
      await chooseResult(page);
      await expectJumpedTo(page, id!);
      await page.evaluate(() => window.scrollTo(0, 0));
      // The address already open: a replace, with the same hash.
      await chooseResult(page);
      await expectJumpedTo(page, id!);
    });
  }

  test('a refetch with new content leaves the reader where they are', async ({ page }) => {
    await page.clock.install();
    await page.goto(TYPE);
    const { href, target } = await samePageLink(page);
    await press(linkTo(page, href));
    await expectJumpedTo(page, target);

    // The next answer for the page's data edits its first description.
    const MARK = 'E2E refetched description';
    await page.route(TYPE_API, async route => {
      const response = await route.fetch();
      const levels = await response.json();
      levels[0].locations[0].collectibles[0].description = { type: 'text', content: MARK };
      await route.fulfill({ response, json: levels });
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.clock.fastForward('31:00'); // past the 30-minute staleTime
    const refetched = page.waitForResponse(r => r.url().endsWith(`/api${TYPE}`) && r.ok());
    // TanStack refetches stale queries when the browser comes back online.
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
      window.dispatchEvent(new Event('online'));
    });
    await refetched;
    await expect(page.getByText(MARK)).toHaveCount(1);
    await settle(page);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('a visit whose data arrives late still lands once it has', async ({ page }) => {
    const cards = await typeCards(page, TYPE);
    const slugs = buildSlugMap(cards);
    const card = cards[Math.floor(cards.length / 2)];
    const held = await holdRoute(page, TYPE_API);
    await stubSearch(page, `${TYPE}#${slugs.get(card.id)}`, 'cosmetics');
    await page.goto('/privacy');
    await chooseResult(page);
    await held.seen;
    await expect(page.locator('#skeleton-1')).toBeVisible();
    held.release();
    await expectJumpedTo(page, slugs.get(card.id)!);
  });

  // The entry a visit starts on and a fragment typed into the address bar both carry the key
  // 'default', so only a guard on the navigation itself tells them apart.
  test('a typed fragment and Back to the first entry each jump once', async ({ page }) => {
    await spyOnAppScrolls(page);
    await page.goto(TYPE);
    const [source, target] = await twoReachableCards(page);
    await page.goto('about:blank');
    await page.goto(`${TYPE}#${encodeURIComponent(source)}`);
    await expectJumpedTo(page, source);
    await takeAppScrolls(page);

    // A fragment navigation the browser makes, as an edit in the address bar does.
    await page.goto(`${TYPE}#${encodeURIComponent(target)}`);
    await expect.poll(() => page.evaluate(() => decodeURIComponent(location.hash.slice(1)))).toBe(target);
    await settle(page);
    expect(await takeAppScrolls(page), 'one jump, to the typed card').toEqual([await landingOf(page, target)]);

    await page.goBack();
    await expect.poll(() => page.evaluate(() => decodeURIComponent(location.hash.slice(1)))).toBe(source);
    await settle(page);
    expect(await takeAppScrolls(page), 'one jump, to the first card').toEqual([await landingOf(page, source)]);
  });
});

// A comment's link lands it centred, where its thread centres it once loaded, with no scroll to
// the top first: the thread's own scroll then has nothing left to move.
test.describe('comment links', () => {
  test.use({ viewport: { width: 1280, height: 900 } });
  let fx: Fixtures;
  let ip: string;
  let user: TestUser;
  let parentId: number;

  test.beforeAll(async ({ browser }) => {
    fx = readFixtures();
    ip = nextTestIp();
    user = makeUser(fx.token, 'jump');
    const page = await browser.newPage();
    await apiRegister(page, user, ip);
    ({ parentId } = await createCommentThread(fx, user.username));
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    await deleteFixtureComments(fx);
    const page = await browser.newPage();
    await apiDeleteUser(page, user, ip);
    await page.close();
  });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('a link to a comment on the open page lands it centred, never at the top first', async ({ page }) => {
    await spyOnAppScrolls(page);
    const path = `/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`;
    await page.goto(path);
    await expect(page.locator(`#comment-${parentId}`)).toBeVisible();
    await takeAppScrolls(page);
    // A fragment navigation the browser makes, with the thread already on the page.
    await page.goto(`${path}#comment-${parentId}`);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#comment-${parentId}`);
    await settle(page);
    expect(await takeAppScrolls(page), 'no window scroll by the app').toEqual([]);
    // Where centring puts it, the page's end included: centring it again moves nothing.
    const moved = await page.evaluate((id) => {
      const before = window.scrollY;
      document.getElementById(id)!.scrollIntoView({ behavior: 'instant', block: 'center' });
      return Math.abs(window.scrollY - before);
    }, `comment-${parentId}`);
    expect(moved).toBeLessThanOrEqual(1);
  });
});
