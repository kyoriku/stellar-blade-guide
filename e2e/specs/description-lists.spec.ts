import { test, expect, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';
import { holdRoute } from '../helpers/route';

// A collectible's text description and a walkthrough's text, tip and warning share one
// rule (client/src/utils/textBlocks.ts): blank lines separate blocks, and a block of two or
// more lines that all start with "- " is a bulleted list. Each test puts list text into a
// real API response, so no seed row has to hold one.

type Collectible = { id: number; description: { type: string; content?: string; items?: string[] } };
type Location = { collectibles: Collectible[] };
type ListItem = { name: string; description?: string };

const LIST_TEXT = 'Fixture lead-in by the [[levels/eidos-7|Eidos 7 page]]:\n\n' +
  '- First item\n- Second item by the [[levels/xion|Xion page]]\n- Third item\n\nFixture closing line.';
// The same description as plain text, links as their labels: what the ItemList carries.
const LIST_PLAIN = 'Fixture lead-in by the Eidos 7 page: First item, Second item by the Xion page, ' +
  'Third item Fixture closing line.';

// Gives one collectible new text in a level response (a list of locations) or a type
// response (a list of levels holding locations).
function withContent(body: string, pick: (c: Collectible) => boolean, content: string): string {
  const json = JSON.parse(body) as (Location & { locations?: Location[] })[];
  const all = json.flatMap((entry) => entry.collectibles ?? (entry.locations ?? []).flatMap((loc) => loc.collectibles));
  const target = all.find(pick);
  if (!target) throw new Error('no collectible to give the text to');
  target.description = { type: 'text', content };
  return JSON.stringify(json);
}

// The page's ItemList items. Re-renders re-append the scripts, so callers read this
// inside a poll.
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

test.describe('lists in description text', () => {
  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test("a collectible's list renders as a list on its level page", async ({ page }) => {
    const api = await holdRoute(page, '**/api/levels/eidos-7',
      (body) => withContent(body, (c) => c.id === fx.collectibleId, LIST_TEXT));
    api.release();
    await page.goto('/levels/eidos-7');

    // The description only: the gallery adds a <p> of its own once an image loads.
    const description = page.locator(`#collectible-${fx.collectibleId} div.mb-5`);
    await expect(description.locator('p')).toHaveText(['Fixture lead-in by the Eidos 7 page:', 'Fixture closing line.']);
    await expect(description.locator('ul > li > span.flex-1'))
      .toHaveText(['First item', 'Second item by the Xion page', 'Third item']);
    await expect(description.locator('ul a')).toHaveAttribute('href', '/levels/xion');
    // A regex, not a string: a string is trimmed to "-", which "lead-in" holds.
    await expect(description).not.toContainText(/- /);
    await expect
      .poll(async () => (await itemListItems(page)).find((i) => i.name === fx.collectibleTitle)?.description)
      .toBe(LIST_PLAIN);
  });

  test('a single "- " line stays text', async ({ page }) => {
    const api = await holdRoute(page, '**/api/levels/eidos-7',
      (body) => withContent(body, (c) => c.id === fx.collectibleId, 'Fixture lead-in.\n\n- Only one'));
    api.release();
    await page.goto('/levels/eidos-7');

    const description = page.locator(`#collectible-${fx.collectibleId} div.mb-5`);
    await expect(description.locator('p')).toHaveText(['Fixture lead-in.', '- Only one']);
    await expect(description.locator('ul')).toHaveCount(0);
  });

  test("a type page renders a collectible's list the same way", async ({ page }) => {
    const lead = 'Type page lead-in:';
    const api = await holdRoute(page, '**/api/upgrades/weapon-cores',
      (body) => withContent(body, () => true, `${lead}\n\n- Alpha item\n- Beta item`));
    api.release();
    await page.goto('/upgrades/weapon-cores');

    const description = page.locator('article div.mb-5', { hasText: lead });
    await expect(description.locator('p')).toHaveText([lead]);
    await expect(description.locator('ul > li > span.flex-1')).toHaveText(['Alpha item', 'Beta item']);
  });

  test("a walkthrough's text, tip and warning keep their lists", async ({ page }) => {
    const api = await holdRoute(page, `**/api/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`, (body) => {
      const json = JSON.parse(body);
      json.content[0] = {
        ...json.content[0],
        text: 'Section lead-in.\n\n- Text one\n- Text two',
        tip: '- Tip one\n- Tip two',
        warning: '- Warning one\n- Warning two',
      };
      return JSON.stringify(json);
    });
    api.release();
    await page.goto(`/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`);

    const section = page.locator('div.walkthrough-content > article', { hasText: 'Section lead-in.' });
    await expect(section.locator('ul')).toHaveCount(3);
    await expect(section.locator('ul > li > span.flex-1'))
      .toHaveText(['Text one', 'Text two', 'Tip one', 'Tip two', 'Warning one', 'Warning two']);
    await expect(section).not.toContainText(/- /);
  });
});
