import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// The Contents list lights the section in the active band (useActiveSection), on level,
// type and walkthrough pages. Above the first section nothing is lit, after a load, a
// scroll back up or a filter change alike. Below it, a filter or a sort rebuilds the list
// under the light, which has to follow: the elements a filter brings back get observed,
// and a light left with nothing in the band moves to the section at the band. On Eidos 7,
// NG+ keeps 3 of the 8 sections: All, NG+, All keeps Flooded Commercial Sector's element
// and gives Memory Tower a new one.

const LEVEL = '/levels/eidos-7';
const TYPE = '/cosmetics/nano-suits';
const WALKTHROUGH = '/walkthroughs/main-story/eye-of-the-hurricane';
const KEPT = 'flooded-commercial-sector';
const BROUGHT_BACK = 'memory-tower';

const pill = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
// The sidebar's entries under a group: the floating Contents holds hidden copies from lg up.
const ENTRIES = 'aside ul ul a[href^="#"]';
const entry = (page: Page, id: string) => page.locator(`aside ul ul a[href="#${id}"]`);

// The lit entry is the one marked as the current location.
const lit = (page: Page) => page.evaluate((entries) =>
  [...document.querySelectorAll(`${entries}[aria-current="location"]`)]
    .map((a) => a.getAttribute('href')!.slice(1)), ENTRIES);

// An absence can't be polled for, so this gives the observer two frames to report first.
const expectNothingLit = async (page: Page) => {
  await page.evaluate(() => new Promise((done) =>
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 100)))));
  expect(await lit(page)).toEqual([]);
};

const sections = (page: Page) => page.locator('section[id]:has(article[id])');
const firstSection = async (page: Page) => (await sections(page).first().getAttribute('id'))!;

// Puts an element's top 90px down: inside the band, which runs from 80px to a fifth of
// the viewport.
const intoBand = (page: Page, selector: string) => page.evaluate((selector) => {
  const el = document.querySelector(selector)!;
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 90);
}, selector);
const toTop = (page: Page) => page.evaluate(() => window.scrollTo(0, 0));

test.describe('scroll-spy', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('a level page lights a section the cycle filter brought back', async ({ page }) => {
    await page.goto(LEVEL);
    await expect(page.locator(`section#${BROUGHT_BACK} article[id]`).first()).toBeVisible();

    await pill(page, 'NG+').click();
    await expect(page.locator(`section#${BROUGHT_BACK}`)).toHaveCount(0);
    await expect(page.locator(`section#${KEPT} article[id]`).first()).toBeVisible();
    await pill(page, 'All').click();
    await expect(page.locator(`section#${BROUGHT_BACK} article[id]`).first()).toBeVisible();

    // A section whose element stayed lights up either way, so the band and the clicks work.
    await entry(page, KEPT).click();
    await expect.poll(() => lit(page)).toEqual([KEPT]);

    // The scroll to the next section moves the light only if its new element is observed.
    await entry(page, BROUGHT_BACK).click();
    await expect.poll(() => lit(page)).toEqual([BROUGHT_BACK]);
  });

  test('the top of a level page lights nothing after a load, a scroll back up or a filter change', async ({ page }) => {
    await page.goto(LEVEL);
    await expect(sections(page).first()).toBeVisible();
    await expectNothingLit(page);

    await pill(page, 'NG+').click();
    await expect(page.locator(`section#${BROUGHT_BACK}`)).toHaveCount(0);
    await expectNothingLit(page);

    // Into the first NG+ section, then back up to the filters.
    await intoBand(page, `#${KEPT}`);
    await expect.poll(() => lit(page)).toEqual([KEPT]);
    await toTop(page);
    await expect.poll(() => lit(page)).toEqual([]);

    await pill(page, 'All').click();
    await expect(page.locator(`section#${BROUGHT_BACK} article[id]`).first()).toBeVisible();
    await expectNothingLit(page);
  });

  test('a level page lights the section at the band after a filter change mid-list', async ({ page }) => {
    await page.goto(LEVEL);
    await expect(sections(page).first()).toBeVisible();
    await intoBand(page, '#parking-tower');
    await expect.poll(() => lit(page)).toEqual(['parking-tower']);

    // A press on a pill already on screen: dispatched, so nothing scrolls to it first.
    await pill(page, 'NG+').dispatchEvent('click');
    await expect(page.locator('section#parking-tower')).toHaveCount(0);

    // The section covering the band, or the last one above it when the band is past the
    // list (the shorter page scrolls back to its end).
    const atBand = () => page.evaluate(() => {
      const lower = window.innerHeight * 0.2;
      const rects = [...document.querySelectorAll('section[id]')]
        .map((el) => ({ id: el.id, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.height > 0);
      const covering = rects.filter(({ r }) => r.top < lower && r.bottom > 80);
      const above = rects.filter(({ r }) => r.top < lower);
      return (covering.at(-1) ?? above.at(-1))?.id;
    });
    await expect.poll(async () => {
      const [now, expected] = [await lit(page), await atBand()];
      return now.length === 1 && now[0] === expected ? 'matches' : `${now} vs ${expected}`;
    }).toBe('matches');
  });

  test('the top of a type page lights nothing either', async ({ page }) => {
    await page.goto(TYPE);
    await expect(sections(page).first()).toBeVisible();
    const allFirst = await firstSection(page);

    await pill(page, 'DLC').click();
    await expect.poll(() => firstSection(page)).not.toBe(allFirst);
    await expectNothingLit(page);
    const dlcFirst = await firstSection(page);
    await intoBand(page, `#${dlcFirst}`);
    await expect.poll(() => lit(page)).toEqual([dlcFirst]);
    await toTop(page);
    await expect.poll(() => lit(page)).toEqual([]);

    await pill(page, 'All').click();
    await expect.poll(() => firstSection(page)).toBe(allFirst);
    await expectNothingLit(page);
  });

  test('A–Z lights nothing above its list and the card at the band inside it', async ({ page }) => {
    await page.goto(TYPE);
    await expect(sections(page).first()).toBeVisible();
    await pill(page, 'A–Z').click();
    await expect(pill(page, 'A–Z')).toHaveAttribute('aria-pressed', 'true');
    await expectNothingLit(page);

    const third = (await page.locator(ENTRIES).nth(2).getAttribute('href'))!.slice(1);
    await intoBand(page, `article[id="${third}"]`);
    await expect.poll(() => lit(page)).toEqual([third]);
    await toTop(page);
    await expect.poll(() => lit(page)).toEqual([]);
  });

  test('the top of a walkthrough page lights nothing either', async ({ page }) => {
    await page.goto(WALKTHROUGH);
    const second = page.locator(ENTRIES).nth(1);
    await expect(second).toBeVisible();
    await expectNothingLit(page);

    const id = (await second.getAttribute('href'))!.slice(1);
    await second.click();
    await expect.poll(() => lit(page)).toEqual([id]);
    await toTop(page);
    await expect.poll(() => lit(page)).toEqual([]);
  });

  test("the phone's floating Contents marks the lit section too", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(LEVEL);
    await expect(sections(page).first()).toBeVisible();
    await intoBand(page, '#parking-tower');

    await page.getByRole('button', { name: 'Open table of contents' }).click();
    // The sidebar's copy is hidden below lg.
    const current = page.locator('a[aria-current="location"]').filter({ visible: true });
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute('href', '#parking-tower');
  });
});
