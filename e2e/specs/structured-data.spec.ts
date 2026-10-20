import { test, expect, type Page } from '@playwright/test';
import { readFixtures, FIXTURE_DESCRIPTION_TEXT, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';
import { stripLinks } from '../../client/src/utils/descriptionText';

type ListItem = { name: string; description?: string };
type Crumb = { name: string; item: string };

const SITE = 'https://stellarbladeguide.com';

// Home, then each [name, path] pair, as the BreadcrumbList lists them.
function trail(...crumbs: [string, string][]): Crumb[] {
  return [['Home', '/'] as [string, string], ...crumbs].map(([name, path]) => ({ name, item: `${SITE}${path}` }));
}

// The page's BreadcrumbList, or null when it has none. Re-renders re-append the
// scripts, so callers read this inside a poll.
async function breadcrumbs(page: Page): Promise<Crumb[] | null> {
  for (const text of await page.locator('head script[type="application/ld+json"]').allTextContents()) {
    try {
      const schema = JSON.parse(text);
      if (schema['@type'] === 'BreadcrumbList') {
        return (schema.itemListElement as Crumb[]).map(({ name, item }) => ({ name, item }));
      }
    } catch {
      // A script caught mid-update; the poll reads again.
    }
  }
  return null;
}

// The page's ItemList items. Re-renders re-append the scripts, so callers
// read this inside a poll.
async function itemListItems(page: Page): Promise<ListItem[]> {
  for (const text of await page.locator('head script[type="application/ld+json"]').allTextContents()) {
    try {
      const schema = JSON.parse(text);
      if (schema['@type'] === 'ItemList') return schema.itemListElement as ListItem[];
    } catch {
      // A script caught mid-update; the poll reads again.
    }
  }
  return [];
}

let fx: Fixtures;

test.describe('structured data', () => {
  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('walkthrough page carries BreadcrumbList + WebPage + Article ld+json', async ({ page }) => {
    await page.goto(`/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`);
    // Scripts are only injected after the walkthrough query resolves.
    await expect(page.getByText(fx.walkthroughTitle).first()).toBeVisible();

    const scripts = page.locator('head script[type="application/ld+json"]');
    await expect(scripts).toHaveCount(3);

    // The page re-appends all scripts on re-render (inline extraSchemas identity),
    // so parse inside a polling assertion rather than once.
    await expect
      .poll(async () => {
        const texts = await scripts.allTextContents();
        return texts
          .map((t) => {
            try {
              return (JSON.parse(t) as { '@type': string })['@type'];
            } catch {
              return 'unparseable';
            }
          })
          .sort();
      })
      .toEqual(['Article', 'BreadcrumbList', 'WebPage']);
  });

  // Every crumb names the page it points at the way that page's h1 does, never as
  // its URL title-cased ("Gift For A Fishing Maniac", "Nier Dlc").
  test('a walkthrough page ends its crumbs on its own title', async ({ page }) => {
    const path = `/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`;
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(fx.walkthroughTitle);
    await expect.poll(() => breadcrumbs(page)).toEqual(trail(
      ['Walkthroughs', '/walkthroughs'], ['E2e Fixture', '/walkthroughs/e2e-fixture'], [fx.walkthroughTitle, path],
    ));
  });

  test("a walkthrough category's crumb is its heading", async ({ page }) => {
    await page.goto('/walkthroughs/nier-dlc');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('NieR: Automata DLC');
    await expect.poll(() => breadcrumbs(page)).toEqual(trail(
      ['Walkthroughs', '/walkthroughs'], ['NieR: Automata DLC', '/walkthroughs/nier-dlc'],
    ));
  });

  for (const [category, name, slug, title] of [
    ['bulletin-board-requests', 'Bulletin Board Requests', 'gift-for-a-fishing-maniac', 'A Gift for a Fishing Maniac'],
    ['fishing', 'Fishing', 'bait-and-fishing-data', 'Bait and Fishing Data'],
  ]) {
    test(`${title} keeps its title's own capitals in its crumbs`, async ({ page }) => {
      const path = `/walkthroughs/${category}/${slug}`;
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
      await expect.poll(() => breadcrumbs(page)).toEqual(trail(
        ['Walkthroughs', '/walkthroughs'], [name, `/walkthroughs/${category}`], [title, path],
      ));
    });
  }

  // These already matched under the URL-derived builder; they guard the rest of
  // the site against the rewrite.
  test('index, level and type pages name each crumb as its heading, and home has none', async ({ page }) => {
    await page.goto('/walkthroughs');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Walkthroughs');
    await expect.poll(() => breadcrumbs(page)).toEqual(trail(['Walkthroughs', '/walkthroughs']));

    await page.goto('/levels/eidos-7');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Eidos 7');
    await expect.poll(() => breadcrumbs(page)).toEqual(trail(['Levels', '/levels'], ['Eidos 7', '/levels/eidos-7']));

    await page.goto('/upgrades/weapon-cores');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Weapon Cores');
    await expect.poll(() => breadcrumbs(page)).toEqual(trail(['Upgrades', '/upgrades'], ['Weapon Cores', '/upgrades/weapon-cores']));

    await page.goto('/');
    await expect(page.locator('head script[type="application/ld+json"]').first()).toBeAttached();
    expect(await breadcrumbs(page)).toBeNull();
  });

  test('level page ItemList gives a description as the text a reader sees', async ({ page }) => {
    await page.goto('/levels/eidos-7');
    await expect(page.getByText(fx.collectibleTitle).first()).toBeVisible();
    await expect
      .poll(async () => (await itemListItems(page)).find((i) => i.name === fx.collectibleTitle)?.description)
      .toBe(FIXTURE_DESCRIPTION_TEXT);
  });

  test('type page ItemList descriptions carry no link markup', async ({ page }) => {
    const res = await page.request.get('/api/collectibles/memorysticks');
    expect(res.ok()).toBe(true);
    type Level = { locations: { collectibles: { description?: { content?: string } }[] }[] };
    const stored = ((await res.json()) as Level[])
      .flatMap((l) => l.locations.flatMap((loc) => loc.collectibles))
      .map((c) => c.description?.content);
    test.skip(!stored.some((d) => d?.includes('[[')), 'no linked Memorystick description in the dev DB');
    const plain = stored.map((d) => (d ? stripLinks(d) : d));

    await page.goto('/collectibles/memorysticks');
    await expect.poll(async () => (await itemListItems(page)).map((i) => i.description)).toEqual(plain);
  });
});
