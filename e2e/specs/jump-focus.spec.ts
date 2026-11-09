import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';
import { holdRoute } from '../helpers/route';
import { buildSlugMap } from '../../client/src/utils/slugify';

// A link or a search result that lands on a card or a walkthrough section hands focus to its
// heading (useHashJump), when focus was on that link or nowhere, so the next Tab carries on
// from what was opened. Back and Forward, and focus someone moved elsewhere meanwhile, are
// left alone.

const TYPE = '/cosmetics/nano-suits';
const TYPE_API = `**/api${TYPE}`;
const WALKTHROUGH = '/walkthroughs/main-story/eye-of-the-hurricane';
const OFFSET = 97;

type Card = { id: number; title: string };

async function typeCards(page: Page, path: string): Promise<Card[]> {
  const res = await page.request.get(`/api${path}`);
  expect(res.status()).toBe(200);
  const levels = (await res.json()) as { locations: { collectibles: Card[] }[] }[];
  return levels.flatMap(l => l.locations.flatMap(loc => loc.collectibles));
}

// A same-page wikilink on a card, whose target is another card on the page.
async function samePageLink(page: Page): Promise<{ href: string; target: string }> {
  await page.locator('section[id] article[id]').first().waitFor();
  const found = await page.evaluate((path) => {
    for (const a of document.querySelectorAll<HTMLAnchorElement>(`article a[href^="${path}#"]`)) {
      const href = a.getAttribute('href')!;
      const target = decodeURIComponent(href.slice(href.indexOf('#') + 1));
      const el = document.getElementById(target);
      if (el && !el.contains(a)) return { href, target };
    }
    return null;
  }, TYPE);
  expect(found, `a card on ${TYPE} links another card on it`).not.toBeNull();
  return found!;
}

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

const cardHeading = (page: Page, id: string) => page.locator(`article[id="${id}"] h2`);
const searchButton = (page: Page) => page.getByRole('button', { name: 'Search (Ctrl+K)' });

// Has the page jumped to `id` (its card, or the section its first card takes along)?
async function expectLanded(page: Page, id: string) {
  await expect(async () => {
    const top = await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const section = el.closest('section[id]');
      return Math.round((section?.querySelector('article') === el ? section! : el).getBoundingClientRect().top);
    }, id);
    expect(top).not.toBeNull();
    expect(Math.abs(top! - OFFSET)).toBeLessThanOrEqual(1);
  }).toPass({ timeout: 10_000 });
}

test.describe('focus after a jump, desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('Enter on a same-page link hands focus to the card it lands on, and Tab carries on from there', async ({ page }) => {
    await page.goto(TYPE);
    const { href, target } = await samePageLink(page);
    const link = page.locator(`article a[href="${href}"]`).first();
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(cardHeading(page, target)).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await page.evaluate((id) => document.getElementById(id)!.contains(document.activeElement), target),
      'the next Tab stays in the card it landed on').toBe(true);
  });

  test('a click on a same-page link hands focus to the card it lands on', async ({ page }) => {
    await page.goto(TYPE);
    const { href, target } = await samePageLink(page);
    await page.locator(`article a[href="${href}"]`).first().click();
    await expect(cardHeading(page, target)).toBeFocused();
  });

  test('the same link again hands focus back to the card', async ({ page }) => {
    await page.goto(TYPE);
    const { href, target } = await samePageLink(page);
    const link = page.locator(`article a[href="${href}"]`).first();
    await link.click();
    await expect(cardHeading(page, target)).toBeFocused();
    // The address already open: a replace. The click puts focus on the link first.
    await link.click();
    await expect(cardHeading(page, target)).toBeFocused();
  });

  test('a search result hands focus to the card it lands on', async ({ page }) => {
    const cards = await typeCards(page, TYPE);
    const id = buildSlugMap(cards).get(cards[Math.floor(cards.length / 2)].id)!;
    await stubSearch(page, `${TYPE}#${id}`, 'cosmetics');
    await page.goto('/privacy');
    await chooseResult(page);
    await expectLanded(page, id);
    await expect(cardHeading(page, id)).toBeFocused();
  });

  test("a search result for a walkthrough section hands focus to the section's heading", async ({ page }) => {
    await page.goto(WALKTHROUGH);
    await page.locator('div.walkthrough-content[id] h3').first().waitFor();
    const id = await page.evaluate(() => {
      const titled = [...document.querySelectorAll('div.walkthrough-content[id]')].filter(el => el.querySelector('h3'));
      return titled[Math.floor(titled.length / 2)].id;
    });
    await stubSearch(page, `${WALKTHROUGH}#${id}`, 'walkthrough');
    await page.goto('/privacy');
    await chooseResult(page);
    await expect(page.locator(`div.walkthrough-content[id="${id}"] h3`)).toBeFocused();
  });

  test('Forward leaves focus where it is, even on nothing', async ({ page }) => {
    await page.goto(TYPE);
    const { href, target } = await samePageLink(page);
    await page.locator(`article a[href="${href}"]`).first().click();
    await expect(cardHeading(page, target)).toBeFocused();
    await page.evaluate(() => (document.activeElement as HTMLElement).blur());

    await page.goBack();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
    await page.goForward();
    await expect.poll(() => page.evaluate(() => decodeURIComponent(location.hash.slice(1)))).toBe(target);
    await expectLanded(page, target);
    expect(await page.evaluate(() => document.activeElement === document.body), 'focus still on nothing').toBe(true);
  });

  test('focus moved elsewhere while the page loaded stays there', async ({ page }) => {
    const cards = await typeCards(page, TYPE);
    const id = buildSlugMap(cards).get(cards[Math.floor(cards.length / 2)].id)!;
    const held = await holdRoute(page, TYPE_API);
    await stubSearch(page, `${TYPE}#${id}`, 'cosmetics');
    await page.goto('/privacy');
    await chooseResult(page);
    await held.seen;
    await expect(page.locator('#skeleton-1')).toBeVisible();
    await searchButton(page).focus();
    held.release();
    await expectLanded(page, id);
    await expect(searchButton(page)).toBeFocused();
  });
});

test.describe('focus after a jump, phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('a drawer search result hands focus to the card it lands on', async ({ page }) => {
    const cards = await typeCards(page, TYPE);
    const id = buildSlugMap(cards).get(cards[Math.floor(cards.length / 2)].id)!;
    await stubSearch(page, `${TYPE}#${id}`, 'cosmetics');
    await page.goto('/privacy');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.locator('#mobile-menu input[name="text"]').fill('e2e');
    await page.locator(`#mobile-menu a[href="${TYPE}#${id}"]`).click();
    await expect(cardHeading(page, id)).toBeFocused();
  });
});
