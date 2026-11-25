import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// The image viewer (PageLightbox, run by usePageLightbox) closes at once, without its fade, on
// any navigation, which can bring other slides: Back and Forward keep the page mounted when the
// other entry's data is cached.

const LEVEL = '/levels/eidos-7';
// The viewer: yarl's portal, the dialog it adds to the body while open.
const VIEWER = '.yarl__portal';
const viewer = (page: Page) => page.locator(VIEWER);
// The level page's own Next link, to the level after it.
const nextLink = (page: Page) => page.locator('main a').filter({ hasText: /^Next/ });

// A level page has rendered in full: its heading, then its cards. The address changes before
// the page does, so a wait on the address alone would find the last page. An open viewer hides
// the page from the accessibility tree, so this finds the heading only once it has closed.
const showsLevel = async (page: Page, name: string) => {
  await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
  await expect(page.locator('section[id] article[id]').first()).toBeVisible();
};

// Eidos 7 reached by Back from Xion, so Xion's data is cached and the move there renders it in
// full, across React's yields.
const eidos7ByBack = async (page: Page) => {
  await nextLink(page).click();
  await showsLevel(page, 'Xion');
  await page.goBack();
  await showsLevel(page, 'Eidos 7');
};

interface Race {
  pressed: boolean;
  // With Back after a restart: whether React rendered the page again after the press.
  restarted: boolean;
  // Each heading shown, from the one on screen before the press.
  headings: string[];
  // Each heading the viewer was seen under.
  viewerUnder: string[];
  // With Back: whether the viewer was on screen in the first frame after it.
  openAfterBack: boolean | null;
}
const raceOf = (page: Page) => page.evaluate(() => (window as unknown as { race: Race }).race);

// Follows the level page's Next link to `path` and, while React renders that page, presses the
// last thumbnail on the page still on screen. StructuredData turns the new page's crumbs into
// JSON as it renders (as in filter-pills.spec.ts), and a press queued then lands when React next
// yields. With `back`, Back follows the press before the new page can commit: 'now', or 'after
// restart', once React renders that page again, since the press set aside the render under way.
type Back = 'none' | 'now' | 'after restart';
const pressWhileRendering = (page: Page, path: string, back: Back = 'none') => page.evaluate(({ path, back, selector }) => {
  const heading = () => document.querySelector('main h1')?.textContent ?? '';
  const race: Race = { pressed: false, restarted: false, headings: [heading()], viewerUnder: [], openAfterBack: null };
  (window as unknown as { race: Race }).race = race;
  new MutationObserver(() => {
    const shown = heading();
    if (race.headings.at(-1) !== shown) race.headings.push(shown);
    if (document.querySelector(selector) && !race.viewerUnder.includes(shown)) race.viewerUnder.push(shown);
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
  if (back !== 'none') {
    addEventListener('popstate', () => requestAnimationFrame(() => {
      race.openAfterBack = !!document.querySelector(selector);
    }), { once: true });
  }
  const thumbnails = document.querySelectorAll<HTMLElement>('section[id] article[id] button[type="button"]:has(img)');
  const thumbnail = thumbnails[thumbnails.length - 1];
  const stringify = JSON.stringify;
  let seen = false;
  JSON.stringify = function (this: JSON, ...args: Parameters<typeof JSON.stringify>) {
    const [value] = args;
    if (Array.isArray(value) && value.some(crumb => (crumb as { path?: string } | null)?.path === path)) {
      if (!seen) {
        seen = true;
        if (back !== 'after restart') JSON.stringify = stringify;
        queueMicrotask(() => {
          race.pressed = true;
          thumbnail.click();
          if (back === 'now') setTimeout(() => history.back(), 0);
        });
      } else if (race.pressed) {
        // The first time after the press: StrictMode's second render of the first pass comes before it.
        JSON.stringify = stringify;
        race.restarted = true;
        setTimeout(() => history.back(), 0);
      }
    }
    return stringify.apply(this, args);
  } as typeof JSON.stringify;
  Array.from(document.querySelectorAll<HTMLAnchorElement>(`main a[href="${path}"]`))
    .find(a => /^Next/.test(a.textContent ?? ''))!.click();
}, { path, back, selector: VIEWER });

test.describe('the image viewer', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ context, page }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
    await page.goto(LEVEL);
    await showsLevel(page, 'Eidos 7');
  });

  test("a thumbnail pressed while a link's page still renders closes as that page commits", async ({ page }) => {
    await eidos7ByBack(page);
    await pressWhileRendering(page, '/levels/xion');
    // By its markup: a viewer still open would hide the heading from getByRole.
    await expect(page.locator('main h1')).toHaveText('Xion');
    const race = await raceOf(page);
    expect({ pressed: race.pressed, openedUnder: race.viewerUnder[0] ?? null },
      'the press landed, and the viewer opened while Eidos 7 was on screen')
      .toEqual({ pressed: true, openedUnder: 'Eidos 7' });
    await expect(viewer(page)).toHaveCount(0);
    expect((await raceOf(page)).viewerUnder, 'it never showed over Xion').toEqual(['Eidos 7']);
    await showsLevel(page, 'Xion');
  });

  test("a Back that cancels a link's page still rendering closes it", async ({ page }) => {
    // The Back hands React Router the location it already had, as Eidos 7 was reached by Back
    // too: only the viewer's popstate listener sees it.
    await eidos7ByBack(page);
    await pressWhileRendering(page, '/levels/xion', 'now');
    await expect(page).toHaveURL(new RegExp(`${LEVEL}$`));
    await expect.poll(async () => (await raceOf(page)).openAfterBack !== null, 'Back landed').toBe(true);
    const race = await raceOf(page);
    expect({ pressed: race.pressed, headings: race.headings, viewerUnder: race.viewerUnder },
      'the press landed, the viewer opened over Eidos 7, and Xion never showed')
      .toEqual({ pressed: true, headings: ['Eidos 7'], viewerUnder: ['Eidos 7'] });
    await expect(viewer(page)).toHaveCount(0);
    expect(race.openAfterBack, 'gone in the first frame after Back, without the fade').toBe(false);
    await showsLevel(page, 'Eidos 7');
  });

  test("a Back once React has restarted that page's render still closes it", async ({ page }) => {
    // The check in the restarted render closes the viewer, though that render never commits: the
    // listener's close must still apply when Back lands after it.
    await eidos7ByBack(page);
    await pressWhileRendering(page, '/levels/xion', 'after restart');
    await expect(page).toHaveURL(new RegExp(`${LEVEL}$`));
    await expect.poll(async () => (await raceOf(page)).openAfterBack !== null, 'Back landed').toBe(true);
    const race = await raceOf(page);
    expect({ pressed: race.pressed, restarted: race.restarted, headings: race.headings, viewerUnder: race.viewerUnder },
      'the press landed, React rendered Xion again, the viewer opened over Eidos 7, and Xion never showed')
      .toEqual({ pressed: true, restarted: true, headings: ['Eidos 7'], viewerUnder: ['Eidos 7'] });
    await expect(viewer(page)).toHaveCount(0);
    expect(race.openAfterBack, 'gone in the first frame after Back').toBe(false);
    await showsLevel(page, 'Eidos 7');
  });
});
