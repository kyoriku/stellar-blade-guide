import { test, expect, type Page } from '@playwright/test';
import { readFixtures, FIXTURE_DESCRIPTION_TEXT, type Fixtures } from '../helpers/db';
import { nextTestIp } from '../helpers/auth';
import { stripLinks } from '../../client/src/utils/descriptionText';

type ListItem = { name: string; description?: string };

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
    await context.setExtraHTTPHeaders({ 'x-real-ip': nextTestIp() });
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
