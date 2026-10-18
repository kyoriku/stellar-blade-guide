import { test, expect, type Locator, type Page } from '@playwright/test';
import { readFixtures, redisClient, searchKey, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';
import { holdRoute } from '../helpers/route';

// Where search results lead, in the drawer's search below lg and the bar's from lg
// up: a type page and a walkthrough category by name, and a walkthrough found only by
// a word in its text, at the section holding that word. Then what the bar's panel
// shows while a search is on its way, and that a trailing space or a lone letter
// sends nothing.
//
// Real queries mean real Redis keys, and a response cached earlier (they live an
// hour) would answer instead of the code under test, so every key a test can use is
// deleted before it and after it.

let fx: Fixtures;

const PHONE = {
  name: 'phone',
  viewport: { width: 390, height: 844 },
  async open(page: Page): Promise<Locator> {
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    return page.getByPlaceholder('Search collectibles, walkthroughs, levels...');
  },
  // The drawer, where results take the place of the sections.
  panel: (page: Page) => page.locator('#mobile-menu'),
};

const DESKTOP = {
  name: 'desktop',
  viewport: { width: 1280, height: 800 },
  async open(page: Page): Promise<Locator> {
    await page.getByRole('button', { name: 'Search (Ctrl+K)' }).click();
    return page.getByPlaceholder('Search...');
  },
  // The dropdown under the bar's input, the one panel that drops in.
  panel: (page: Page) => page.locator('.animate-drop-in'),
};

// A result row is a link holding its title and snippet as paragraphs. The drawer's
// sign-in links hold none.
const rows = (panel: Locator) => panel.getByRole('link').filter({ has: panel.page().locator('p') });
const rowTitled = (panel: Locator, title: string) =>
  rows(panel).filter({ has: panel.page().getByText(title, { exact: true }) });

// Every query the tests send, already in the server's normalized form, and "x", which
// "x " would become if it were ever sent. The fixture words and the run token are
// this run's own, and teardown sweeps those too.
const queries = () => [
  'nano', 'x', 'side quests', fx.titledSection.word.slice(0, 5),
  fx.titledSection.word, fx.untitledSection.word, fx.token,
];

async function clearSearchKeys(): Promise<void> {
  const redis = redisClient();
  try {
    await redis.del(...queries().map(searchKey));
  } finally {
    redis.disconnect();
  }
}

// Runs the clock well past useSearch's 300 ms debounce, then lets React render and
// run its effects, which is where a search is sent (React posts them as messages;
// two turns is ample).
async function debounce(page: Page): Promise<void> {
  await page.clock.runFor(1_000);
  await page.evaluate(() => new Promise(resolve => {
    const ch = new MessageChannel();
    let turns = 0;
    ch.port1.onmessage = () => (++turns === 2 ? resolve(null) : ch.port2.postMessage(null));
    ch.port2.postMessage(null);
  }));
}

const isSearch = (url: string, q?: string) =>
  url.includes('/api/search/') && (q === undefined || new URL(url).searchParams.get('q') === q);

test.beforeAll(() => {
  fx = readFixtures();
});

test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  await clearSearchKeys();
});

test.afterEach(() => clearSearchKeys());

for (const layout of [PHONE, DESKTOP]) {
  test.describe(`search results, ${layout.name}`, () => {
    test.use({ viewport: layout.viewport });

    test('"nano" leads with the Nano Suits page, and its row opens it', async ({ page }) => {
      await page.goto('/');
      await (await layout.open(page)).fill('nano');
      const first = rows(layout.panel(page)).first();
      await expect(first.locator('p').first()).toHaveText('Nano Suits');
      await expect(first.locator('p').nth(1)).toHaveText(/^\d+ nano suits$/);
      await first.click();
      await expect(page).toHaveURL(/\/cosmetics\/nano-suits$/);
    });

    test('"side quests" leads with the Side Quests category', async ({ page }) => {
      await page.goto('/');
      await (await layout.open(page)).fill('side quests');
      await rows(layout.panel(page)).first().click();
      await expect(page).toHaveURL(/\/walkthroughs\/side-quests$/);
    });

    for (const kind of ['titled', 'untitled'] as const) {
      test(`a word only the ${kind} section holds opens the walkthrough at that section`, async ({ page }) => {
        const { word, anchor } = kind === 'titled' ? fx.titledSection : fx.untitledSection;
        await page.goto('/');
        await (await layout.open(page)).fill(word);
        const row = rowTitled(layout.panel(page), fx.walkthroughTitle);
        await expect(row).toHaveAttribute('href', `/walkthroughs/e2e-fixture/${fx.walkthroughSlug}#${anchor}`);
        await row.click();
        await expect(page).toHaveURL(new RegExp(`#${anchor}$`));
        await expect(page.locator(`[id="${anchor}"]`)).toHaveCount(1);
      });
    }

    test('the first five characters of that word already link its section', async ({ page }) => {
      const { word, anchor } = fx.titledSection;
      const typed = word.slice(0, 5);
      // Nothing in the walkthrough's title starts with them, so only its text can
      // match, and only a match in the text links a section.
      expect(fx.walkthroughTitle.toLowerCase()).not.toContain(typed);
      await page.goto('/');
      await (await layout.open(page)).fill(typed);
      await expect(rowTitled(layout.panel(page), fx.walkthroughTitle))
        .toHaveAttribute('href', `/walkthroughs/e2e-fixture/${fx.walkthroughSlug}#${anchor}`);
    });

    test('a trailing space sends no second search, and "x " sends none', async ({ page }) => {
      const sent: string[] = [];
      page.on('request', r => { if (isSearch(r.url())) sent.push(new URL(r.url()).searchParams.get('q') ?? ''); });
      await page.clock.install();
      await page.goto('/');
      const input = await layout.open(page);
      const answered = page.waitForResponse(r => isSearch(r.url(), 'nano') && r.ok());
      await input.fill('nano');
      await answered;

      // Paused from here, so the debounce fires only when the test runs it.
      await page.clock.pauseAt(Date.now() + 1000);
      await input.pressSequentially(' ');
      await debounce(page);
      await input.fill('x ');
      await debounce(page);
      // The run token is a search of its own. Once it has gone out, anything the
      // space or "x " asked for would have gone before it.
      const tokenSent = page.waitForRequest(r => isSearch(r.url(), fx.token));
      await input.fill(fx.token);
      await debounce(page);
      await tokenSent;
      expect(sent).toEqual(['nano', fx.token]);
    });
  });
}

test.describe('search results, desktop typing', () => {
  test.use({ viewport: DESKTOP.viewport });

  test('the panel shows its skeleton until results land, never "No results"', async ({ page }) => {
    const search = await holdRoute(page, '**/api/search/**');
    await page.goto('/');
    const input = await DESKTOP.open(page);
    // Watching from before the first key, so a "No results" shown for a moment counts.
    await page.evaluate(() => {
      const w = window as typeof window & { sawNoResults?: boolean };
      w.sawNoResults = false;
      new MutationObserver(() => {
        if (document.body.textContent?.includes('No results for')) w.sawNoResults = true;
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    const sawNoResults = () => page.evaluate(() => (window as typeof window & { sawNoResults?: boolean }).sawNoResults);

    await input.pressSequentially('nano');
    await search.seen;
    await expect(DESKTOP.panel(page).locator('.animate-pulse').first()).toBeVisible();
    expect(await sawNoResults()).toBe(false);

    search.release();
    await expect(rows(DESKTOP.panel(page)).first()).toContainText('Nano Suits');
    expect(await sawNoResults()).toBe(false);
  });
});

test.describe('search results, phone typing', () => {
  test.use({ viewport: PHONE.viewport });

  test('the drawer asks for a second letter when "x " is typed, since nothing is sent', async ({ page }) => {
    await page.goto('/');
    await (await PHONE.open(page)).fill('x ');
    // The status line under the field. Counting the space, it said "Searching..." for good.
    await expect(PHONE.panel(page).getByText(/^(Type at least 2 characters|Searching)\.\.\.$/))
      .toHaveText('Type at least 2 characters...');
  });
});
