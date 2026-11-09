import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';
import { holdRoute } from '../helpers/route';
import { buildSlugMap } from '../../client/src/utils/slugify';
import { cycleLabel } from '../../client/src/constants/cycleLabels';
import { REVEAL_COPY } from '../../client/src/constants/revealCopy';

// A link or a search result to a card on its type page shows the card though a filter hides
// it: each filter that hides it goes back to All, A-Z stays, the page lands on the card and a
// screen reader hears why. Back puts back the filter the link was followed from; Back and
// Forward never reveal. Back and Forward check state, never offsets.

const TYPE = '/cosmetics/nano-suits';
const DOCUMENTS = '/collectibles/documents';
const OFFSET = 97;
const CARDS = 'section[id] article[id]';

type Card = { id: number; title: string; cycle: string; subtype?: string | null; description: { type: string; content?: string } };

async function typeCards(page: Page, path: string): Promise<Card[]> {
  const res = await page.request.get(`/api${path}`);
  expect(res.status()).toBe(200);
  const levels = (await res.json()) as { locations: { collectibles: Card[] }[] }[];
  return levels.flatMap(l => l.locations.flatMap(loc => loc.collectibles));
}

// A Nano Suits card whose description links a card of another cycle on the same page.
async function crossCyclePair(page: Page) {
  const cards = await typeCards(page, TYPE);
  const slugs = buildSlugMap(cards);
  const bySlug = new Map(cards.map(c => [slugs.get(c.id)!, c]));
  const pair = cards.flatMap(source => [...(source.description.content ?? '').matchAll(/\[\[cosmetics\/nano-suits#([^|\]]+)\|/g)]
    .map(m => ({ source, target: bySlug.get(m[1])! }))
    .filter(p => p.target && p.target.cycle !== p.source.cycle))[0];
  expect(pair, `a ${TYPE} card links a card of another cycle on the page`).toBeTruthy();
  const anchor = slugs.get(pair.target.id)!;
  return { ...pair, anchor, href: `${TYPE}#${anchor}`, slugs, cards };
}

const pill = (page: Page, label: string) => page.getByRole('button', { name: label, exact: true });
const pressed = (page: Page, label: string) => expect(pill(page, label)).toHaveAttribute('aria-pressed', 'true');
const azToggle = (page: Page) => page.getByRole('button', { name: 'A–Z', exact: true });
const note = (page: Page) => page.locator('span.sr-only[aria-live="polite"]').filter({ hasText: / set to All to show / });
const cardIds = (page: Page) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map(a => a.id), CARDS);
const press = (page: Page, href: string) => page.locator(`article a[href="${href}"]`).first().evaluate(a => (a as HTMLElement).click());

async function expectLanded(page: Page, id: string) {
  await expect(async () => {
    const top = await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const section = el.closest('section[id]');
      return Math.round((section?.querySelector('article') === el ? section! : el).getBoundingClientRect().top);
    }, id);
    expect(top, `#${id} on the page`).not.toBeNull();
    expect(Math.abs(top! - OFFSET)).toBeLessThanOrEqual(1);
  }).toPass({ timeout: 10_000 });
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

test.describe('links to hidden cards, desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('a link to a card the cycle filter hides puts the pills back to All and lands on it', async ({ page }) => {
    const { source, target, anchor, href } = await crossCyclePair(page);
    await page.goto(TYPE);
    await page.locator(CARDS).first().waitFor();
    await pill(page, cycleLabel(source.cycle)).click();
    await expect(page.locator(`article[id="${anchor}"]`)).toHaveCount(0);

    // A real click, which focuses the link as a reader's does.
    await page.locator(`article a[href="${href}"]`).first().click();
    await pressed(page, 'All');
    await expectLanded(page, anchor);
    await expect(note(page)).toHaveText(REVEAL_COPY.shown(target.title));
    await expect(page.locator(`article[id="${anchor}"] h2`)).toBeFocused();
    // A filter press clears it, so the next reveal reads out again.
    await pill(page, cycleLabel(source.cycle)).click();
    await expect(note(page)).toHaveCount(0);
  });

  test('Enter on that link does the same, with A-Z left on', async ({ page }) => {
    const { source, anchor, href } = await crossCyclePair(page);
    await page.goto(TYPE);
    await page.locator(CARDS).first().waitFor();
    await pill(page, cycleLabel(source.cycle)).click();
    await azToggle(page).click();
    await page.locator(`article a[href="${href}"]`).first().focus();
    await page.keyboard.press('Enter');
    await pressed(page, 'All');
    await expect(azToggle(page)).toHaveAttribute('aria-pressed', 'true');
    await expectLanded(page, anchor);
    await expect(page.locator(`article[id="${anchor}"] h2`)).toBeFocused();
  });

  test('a search result for a card the filter hides shows it', async ({ page }) => {
    const { source, target, anchor } = await crossCyclePair(page);
    await stubSearch(page, `${TYPE}#${anchor}`, 'cosmetics');
    await page.goto(TYPE);
    await page.locator(CARDS).first().waitFor();
    await pill(page, cycleLabel(source.cycle)).click();
    await chooseResult(page);
    await pressed(page, 'All');
    await expectLanded(page, anchor);
    await expect(note(page)).toHaveText(REVEAL_COPY.shown(target.title));
  });

  test('a result for a document the subtype filter hides puts the subtype back to All, A-Z staying on', async ({ page }) => {
    const docs = await typeCards(page, DOCUMENTS);
    const slugs = buildSlugMap(docs);
    const shownSubtype = docs.find(d => d.subtype)!.subtype!;
    const hidden = docs.find(d => d.subtype && d.subtype !== shownSubtype)!;
    await stubSearch(page, `${DOCUMENTS}#${slugs.get(hidden.id)}`, 'collectibles');
    await page.goto(DOCUMENTS);
    await page.locator(CARDS).first().waitFor();
    const select = page.locator('select[title$="of a specific subtype"]');
    await select.selectOption(shownSubtype);
    await azToggle(page).click();
    await chooseResult(page);
    await expect(select).toHaveValue('All');
    await expect(azToggle(page)).toHaveAttribute('aria-pressed', 'true');
    await expectLanded(page, slugs.get(hidden.id)!);
    await expect(note(page)).toHaveText(REVEAL_COPY.shown(hidden.title));
    // A subtype press clears it, so the next reveal reads out again.
    await select.selectOption(shownSubtype);
    await expect(note(page)).toHaveCount(0);
  });

  test('a link to a card the filter shows changes nothing', async ({ page }) => {
    const { source, slugs, cards } = await crossCyclePair(page);
    const visible = cards.filter(c => c.cycle === source.cycle);
    const card = visible[Math.floor(visible.length / 2)];
    await stubSearch(page, `${TYPE}#${slugs.get(card.id)}`, 'cosmetics');
    await page.goto(TYPE);
    await page.locator(CARDS).first().waitFor();
    await pill(page, cycleLabel(source.cycle)).click();
    await chooseResult(page);
    await expectLanded(page, slugs.get(card.id)!);
    await pressed(page, cycleLabel(source.cycle));
    await expect(note(page)).toHaveCount(0);
  });

  test('Back puts back the filter the link was followed from, and Forward the All it showed', async ({ page }) => {
    const { source, anchor, href } = await crossCyclePair(page);
    await page.goto(TYPE);
    await page.locator(CARDS).first().waitFor();
    await pill(page, cycleLabel(source.cycle)).click();
    const ids = await cardIds(page);
    await press(page, href);
    await expectLanded(page, anchor);

    await expect(note(page)).toHaveCount(1);

    await page.goBack();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
    await pressed(page, cycleLabel(source.cycle));
    expect(await cardIds(page)).toEqual(ids);
    await expect(note(page)).toHaveCount(0);
    await page.goForward();
    await expect.poll(() => page.evaluate(() => decodeURIComponent(location.hash.slice(1)))).toBe(anchor);
    await pressed(page, 'All');
    await expect(page.locator(`article[id="${anchor}"]`)).toHaveCount(1);
  });

  // Back and Forward never reveal: an entry whose own filter hides its target gets that
  // filter back.
  test('Back to an entry whose filter hides its own card keeps the filter', async ({ page }) => {
    const { source, anchor, href, slugs, cards } = await crossCyclePair(page);
    const other = cards.filter(c => c.cycle === source.cycle)[0];
    await stubSearch(page, `${TYPE}#${slugs.get(other.id)}`, 'cosmetics');
    await page.goto(TYPE);
    await page.locator(CARDS).first().waitFor();
    await press(page, href);
    await expectLanded(page, anchor);
    // On the target's entry, the source's cycle hides the target.
    await pill(page, cycleLabel(source.cycle)).click();
    await expect(page.locator(`article[id="${anchor}"]`)).toHaveCount(0);
    // A result for a card that cycle shows: a new entry, no reveal.
    await chooseResult(page);
    await expectLanded(page, slugs.get(other.id)!);
    await pressed(page, cycleLabel(source.cycle));

    await page.goBack();
    await expect.poll(() => page.evaluate(() => decodeURIComponent(location.hash.slice(1)))).toBe(anchor);
    await pressed(page, cycleLabel(source.cycle));
    await expect(page.locator(`article[id="${anchor}"]`)).toHaveCount(0);
  });

  // A fragment typed into the address bar is a new entry with no filters of its own.
  test('a typed fragment opens the full list, with nothing read out', async ({ page }) => {
    const { source, anchor } = await crossCyclePair(page);
    await page.goto(TYPE);
    await page.locator(CARDS).first().waitFor();
    await pill(page, cycleLabel(source.cycle)).click();
    await page.goto(`${TYPE}#${encodeURIComponent(anchor)}`);
    await expect.poll(() => page.evaluate(() => decodeURIComponent(location.hash.slice(1)))).toBe(anchor);
    await pressed(page, 'All');
    await expect(page.locator(`article[id="${anchor}"]`)).toHaveCount(1);
    await expect(note(page)).toHaveCount(0);
  });

  test('a result chosen while the page loads shows its card once the data is here', async ({ page }) => {
    const { source, target, anchor } = await crossCyclePair(page);
    await page.goto(TYPE);
    await page.locator(CARDS).first().waitFor();
    await pill(page, cycleLabel(source.cycle)).click();
    // A reload keeps the filter; held, its data leaves the page loading.
    const held = await holdRoute(page, `**/api${TYPE}`);
    await stubSearch(page, `${TYPE}#${anchor}`, 'cosmetics');
    await page.reload();
    await held.seen;
    await expect(page.locator('#skeleton-1')).toBeVisible();
    await chooseResult(page);
    held.release();
    await expectLanded(page, anchor);
    await pressed(page, 'All');
    await expect(note(page)).toHaveText(REVEAL_COPY.shown(target.title));
  });

  // Until the reveal has run, the entry keeps no filter, so Back and Forward meanwhile can't
  // leave it remembering the one that hides its card.
  test('Back before a waiting result shows its card leaves that entry showing it on Forward', async ({ page }) => {
    const { source, anchor } = await crossCyclePair(page);
    await page.goto(TYPE);
    await page.locator(CARDS).first().waitFor();
    await pill(page, cycleLabel(source.cycle)).click();
    const held = await holdRoute(page, `**/api${TYPE}`);
    await stubSearch(page, `${TYPE}#${anchor}`, 'cosmetics');
    await page.reload();
    await held.seen;
    await expect(page.locator('#skeleton-1')).toBeVisible();
    await chooseResult(page);
    await expect.poll(() => page.evaluate(() => decodeURIComponent(location.hash.slice(1)))).toBe(anchor);
    await page.goBack();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
    held.release();
    await page.locator(CARDS).first().waitFor();
    await pressed(page, cycleLabel(source.cycle));

    await page.goForward();
    await expect.poll(() => page.evaluate(() => decodeURIComponent(location.hash.slice(1)))).toBe(anchor);
    await pressed(page, 'All');
    await expect(page.locator(`article[id="${anchor}"]`)).toHaveCount(1);
  });
});

test.describe('links to hidden cards, phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('a drawer search result for a card the filter hides shows it', async ({ page }) => {
    const { source, anchor } = await crossCyclePair(page);
    await stubSearch(page, `${TYPE}#${anchor}`, 'cosmetics');
    await page.goto(TYPE);
    await page.locator(CARDS).first().waitFor();
    await pill(page, cycleLabel(source.cycle)).click();
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.locator('#mobile-menu input[name="text"]').fill('e2e');
    await page.locator(`#mobile-menu a[href="${TYPE}#${anchor}"]`).click();
    await pressed(page, 'All');
    await expect(page.locator(`article[id="${anchor}"] h2`)).toBeFocused();
  });
});
