import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';
import { buildSlugMap, slugifyTitle } from '../../client/src/utils/slugify';

// A type page numbers duplicate titles over the whole page, as search and usePrefetch do, so a
// card keeps its id under every filter: a search result's anchor finds it, and the A-Z Contents
// links the id a fresh, unfiltered page has. The cards come from the live catalogue.

const DOCUMENTS = '/collectibles/documents';
const OFFSET = 97; // the scroll-anchor margin from md up

type Card = { id: number; title: string; subtype?: string | null };

async function pageCards(page: Page): Promise<Card[]> {
  const res = await page.request.get(`/api${DOCUMENTS}`);
  expect(res.status()).toBe(200);
  const levels = (await res.json()) as { locations: { collectibles: Card[] }[] }[];
  return levels.flatMap(l => l.locations.flatMap(loc => loc.collectibles));
}

// A numbered card whose id no card would get if only its subtype were numbered.
async function splitDuplicate(page: Page): Promise<{ card: Card; anchor: string }> {
  const cards = await pageCards(page);
  const ids = buildSlugMap(cards);
  for (const card of cards) {
    if (!card.subtype || !/-\d+$/.test(ids.get(card.id)!)) continue;
    const shown = cards.filter(c => c.subtype === card.subtype);
    if (![...buildSlugMap(shown).values()].includes(ids.get(card.id)!)) return { card, anchor: ids.get(card.id)! };
  }
  throw new Error('Documents must hold a duplicate title whose subtype splits it');
}

const subtypeSelect = (page: Page) => page.locator('select[title$="of a specific subtype"]');

test.describe('type page anchors', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('a duplicate title keeps its page-wide number under the subtype filter, A-Z included', async ({ page }) => {
    const { card, anchor } = await splitDuplicate(page);
    await page.goto(DOCUMENTS);
    await page.locator('section[id] article[id]').first().waitFor();
    await subtypeSelect(page).selectOption(card.subtype!);
    await expect(page.locator(`article[id="${anchor}"]`)).toHaveCount(1);
    await expect(page.locator(`article[id="${slugifyTitle(card.title)}"]`)).toHaveCount(0);

    await page.getByRole('button', { name: 'A–Z', exact: true }).click();
    await expect(page.locator(`article[id="${anchor}"]`)).toHaveCount(1);
    await expect(page.locator(`aside a[href="#${anchor}"]`)).toHaveCount(1);
  });

  test('a search result for that card lands on it under the filter', async ({ page }) => {
    const { card, anchor } = await splitDuplicate(page);
    await page.route('**/api/search/**', route => route.fulfill({
      json: { query: 'e2e', total: 1, results: [{ kind: 'collectibles', id: card.id, title: card.title, snippet: null, navigation_url: `${DOCUMENTS}#${anchor}`, score: 4 }] },
    }));
    await page.goto(DOCUMENTS);
    await page.locator('section[id] article[id]').first().waitFor();
    await subtypeSelect(page).selectOption(card.subtype!);
    await page.keyboard.press('Control+k');
    await page.getByPlaceholder('Search…').fill('e2e');
    await page.locator('.animate-drop-in a').first().click();
    await expect(async () => {
      const top = await page.evaluate((id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const section = el.closest('section[id]');
        return Math.round((section?.querySelector('article') === el ? section! : el).getBoundingClientRect().top);
      }, anchor);
      expect(top, `#${anchor} on the page`).not.toBeNull();
      expect(Math.abs(top! - OFFSET)).toBeLessThanOrEqual(1);
    }).toPass({ timeout: 10_000 });
  });
});
