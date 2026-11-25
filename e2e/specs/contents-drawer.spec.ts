import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// The phone Contents drawer (FloatingTOC) slides out of view when it closes. Inert keeps
// its links out of the tab order then, its close button has a name, and closing it from
// the keyboard gives focus back to the Contents button instead of dropping it. Like the
// lightbox, it closes at once on any navigation (Back and Forward keep the page mounted when
// the other entry's data is cached), unless it was opened for the page still rendering.

const LEVEL = '/levels/eidos-7';
const SECTION = 'parking-tower';
// Its cards link each other, which makes two entries of one page.
const TYPE = '/cosmetics/nano-suits';

const contents = (page: Page) => page.getByRole('button', { name: 'Open table of contents', exact: true });
const closeButton = (page: Page) => page.getByRole('button', { name: 'Close table of contents', exact: true });
// The drawer's copy of an entry: the sidebar's copy is display:none below lg.
const drawerEntry = (page: Page) => page.locator(`a[href="#${SECTION}"]:not(aside a)`);
// The drawer itself: the panel whose header holds the close button.
const DRAWER = 'div:has(> div > button[aria-label="Close table of contents"])';
const drawer = (page: Page) => page.locator(DRAWER);
// The level page's own Next link, to the level after it.
const nextLink = (page: Page) => page.locator('main a').filter({ hasText: /^Next/ });

// Where the focused element sits, against the viewport: the closed drawer is below it.
const focusedBox = (page: Page) => page.evaluate(() => {
  const r = document.activeElement!.getBoundingClientRect();
  return { top: Math.round(r.top), viewport: window.innerHeight };
});

const openByKeyboard = async (page: Page) => {
  await contents(page).focus();
  await page.keyboard.press('Enter');
  await expect(drawer(page)).not.toHaveAttribute('inert');
};

// Opens the drawer with a click, which leaves focus on the Contents button, and waits out the slide.
const openByClick = async (page: Page) => {
  await contents(page).click();
  await expect(drawer(page)).not.toHaveAttribute('inert');
  await drawer(page).evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));
};

// A level page has rendered in full: its heading, then its cards. The address changes before
// the page does, so a wait on the address alone would find the last page.
const showsLevel = async (page: Page, name: string) => {
  await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
  await expect(page.locator('section[id] article[id]').first()).toBeVisible();
};

// Eidos 7's Next link, to Xion: a second page of the same route.
const toXion = async (page: Page) => {
  await nextLink(page).click();
  await showsLevel(page, 'Xion');
};

// Back (-1) or Forward (1) with the drawer open, read in the first frame after it, where a
// drawer still sliding away would be on screen with its transition running. `kept` says the
// page stayed mounted.
const travel = (page: Page, delta: -1 | 1) => page.evaluate(({ delta, selector }) =>
  new Promise<{ wasOpen: boolean; kept: boolean; inert: boolean; onScreen: boolean; transitions: number }>(resolve => {
    const before = document.querySelector(selector)!;
    const wasOpen = !before.hasAttribute('inert');
    addEventListener('popstate', () => requestAnimationFrame(() => {
      const panel = document.querySelector(selector)!;
      resolve({
        wasOpen,
        kept: panel === before,
        inert: panel.hasAttribute('inert'),
        onScreen: panel.getBoundingClientRect().top < innerHeight,
        transitions: panel.getAnimations().length,
      });
    }), { once: true });
    history.go(delta);
  }), { delta, selector: DRAWER });
const PUT_AWAY = { wasOpen: true, kept: true, inert: true, onScreen: false, transitions: 0 };

// Counts focus events on the Contents button from here on.
const countFocus = async (page: Page) => {
  await contents(page).evaluate(button => {
    const w = window as unknown as { contentsFocus?: number };
    if (w.contentsFocus === undefined) button.addEventListener('focus', () => { w.contentsFocus! += 1; });
    w.contentsFocus = 0;
  });
  return () => page.evaluate(() => (window as unknown as { contentsFocus: number }).contentsFocus);
};

// Counts the transitions the drawer itself starts from here on: one per slide.
const countSlides = async (page: Page) => {
  await drawer(page).evaluate(panel => {
    const w = window as unknown as { drawerSlides: number };
    w.drawerSlides = 0;
    panel.addEventListener('transitionrun', e => { if (e.target === panel) w.drawerSlides += 1; });
  });
  return () => page.evaluate(() => (window as unknown as { drawerSlides: number }).drawerSlides);
};

// React Router's key for the entry the browser is on, as the drawer reads it.
const entryKey = (page: Page) => page.evaluate(() => {
  const key = (history.state as { key?: unknown } | null)?.key;
  return typeof key === 'string' ? key : 'default';
});

// Follows the level page's Next link to `path` and presses Contents while React renders that
// page, before it commits: StructuredData turns the new page's crumbs into JSON as it renders
// (as in filter-pills.spec.ts), and a press queued then lands when React next yields. Records
// the heading the drawer opened under, and whether the press was made. With `thenBack`, Back
// follows the press before the page can commit, and `headings` records each heading shown, from
// the one on screen now.
const pressWhileRendering = (page: Page, path: string, thenBack = false) => page.evaluate(({ path, thenBack, selector }) => {
  const w = window as unknown as { pressed: boolean; openedUnder: string | null; headings: string[] };
  w.pressed = false;
  w.openedUnder = null;
  w.headings = [document.querySelector('main h1')?.textContent ?? ''];
  const panel = document.querySelector(selector)!;
  new MutationObserver((_, observer) => {
    if (panel.hasAttribute('inert')) return;
    w.openedUnder = document.querySelector('main h1')?.textContent ?? '';
    observer.disconnect();
  }).observe(panel, { attributes: true, attributeFilter: ['inert'] });
  if (thenBack) {
    new MutationObserver(() => {
      const heading = document.querySelector('main h1')?.textContent ?? '';
      if (w.headings.at(-1) !== heading) w.headings.push(heading);
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  }
  const press = document.querySelector<HTMLElement>('button[aria-label="Open table of contents"]')!;
  const stringify = JSON.stringify;
  JSON.stringify = function (this: JSON, ...args: Parameters<typeof JSON.stringify>) {
    const [value] = args;
    if (Array.isArray(value) && value.some(crumb => (crumb as { path?: string } | null)?.path === path)) {
      JSON.stringify = stringify;
      queueMicrotask(() => {
        w.pressed = true;
        press.click();
        if (thenBack) setTimeout(() => history.back(), 0);
      });
    }
    return stringify.apply(this, args);
  } as typeof JSON.stringify;
  Array.from(document.querySelectorAll<HTMLAnchorElement>(`main a[href="${path}"]`))
    .find(a => /^Next/.test(a.textContent ?? ''))!.click();
}, { path, thenBack, selector: DRAWER });

// Back while React renders `path`, the page a link is taking the browser to: StructuredData turns
// that page's crumbs into JSON as it renders, after the drawer has rendered. Records the drawer in
// the first frame after Back, and each heading shown, from the one on screen now.
interface AfterBack { inert: boolean; onScreen: boolean; transitions: number }
const backWhileRendering = (page: Page, path: string) => page.evaluate(({ path, selector }) => {
  const w = window as unknown as { afterBack: AfterBack | null; headings: string[] };
  w.afterBack = null;
  w.headings = [document.querySelector('main h1')?.textContent ?? ''];
  addEventListener('popstate', () => requestAnimationFrame(() => {
    const panel = document.querySelector(selector)!;
    w.afterBack = {
      inert: panel.hasAttribute('inert'),
      onScreen: panel.getBoundingClientRect().top < innerHeight,
      transitions: panel.getAnimations().length,
    };
  }), { once: true });
  new MutationObserver(() => {
    const heading = document.querySelector('main h1')?.textContent ?? '';
    if (w.headings.at(-1) !== heading) w.headings.push(heading);
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
  const stringify = JSON.stringify;
  JSON.stringify = function (this: JSON, ...args: Parameters<typeof JSON.stringify>) {
    const [value] = args;
    if (Array.isArray(value) && value.some(crumb => (crumb as { path?: string } | null)?.path === path)) {
      JSON.stringify = stringify;
      setTimeout(() => history.back(), 0);
    }
    return stringify.apply(this, args);
  } as typeof JSON.stringify;
}, { path, selector: DRAWER });

// A same-page wikilink on a card the default view shows.
async function samePageLink(page: Page): Promise<string> {
  await page.locator('section[id] article[id]').first().waitFor();
  const href = await page.evaluate((path) => {
    for (const a of document.querySelectorAll<HTMLAnchorElement>(`article a[href^="${path}#"]`)) {
      const href = a.getAttribute('href')!;
      if (document.getElementById(decodeURIComponent(href.slice(href.indexOf('#') + 1)))) return href;
    }
    return null;
  }, TYPE);
  expect(href, `a card on ${TYPE} links another card on it`).not.toBeNull();
  return href!;
}

test.describe('the phone Contents drawer', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ context, page }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
    await page.goto(LEVEL);
    await expect(page.locator('section[id] article[id]').first()).toBeVisible();
  });

  test('keeps its links out of the tab order while closed', async ({ page }) => {
    await drawerEntry(page).focus();
    await expect(drawerEntry(page)).not.toBeFocused();

    // The drawer follows the Contents button in the page, so Tab would enter it.
    await contents(page).focus();
    await page.keyboard.press('Tab');
    const { top, viewport } = await focusedBox(page);
    expect(top, 'the next stop is on screen, not in the hidden drawer').toBeLessThan(viewport);
  });

  test('names its close button and hands focus back on each way out', async ({ page }) => {
    await openByKeyboard(page);
    await page.keyboard.press('Tab');
    await expect(closeButton(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(contents(page)).toBeFocused();

    await openByKeyboard(page);
    await drawerEntry(page).focus();
    await page.keyboard.press('Escape');
    await expect(contents(page)).toBeFocused();

    // Choosing an entry jumps to it, and focus still comes back to the button.
    await openByKeyboard(page);
    await drawerEntry(page).focus();
    await page.keyboard.press('Enter');
    await expect(contents(page)).toBeFocused();
    await expect.poll(() => page.evaluate((id) =>
      Math.round(document.getElementById(id)!.getBoundingClientRect().top), SECTION)).toBe(81);
  });

  test('Back and Forward between two levels put it away at once', async ({ page }) => {
    await toXion(page);
    await openByClick(page);
    expect(await travel(page, -1)).toEqual(PUT_AWAY);
    await expect(page).toHaveURL(new RegExp(`${LEVEL}$`));

    await openByClick(page);
    expect(await travel(page, 1)).toEqual(PUT_AWAY);
    await expect(page).toHaveURL(/\/levels\/xion$/);
  });

  test('Back while it slides shut ends the slide', async ({ page }) => {
    // In Chromium, listeners on window run in the order they were added, capture or not, so one
    // added before the app's own reads the slide as Back lands, before React Router hands React
    // the other page.
    await page.addInitScript(() => {
      addEventListener('popstate', () => (window as unknown as { onBack?: () => void }).onBack?.());
    });
    await page.goto(LEVEL);
    await expect(page.locator('section[id] article[id]').first()).toBeVisible();
    await toXion(page);
    await openByClick(page);
    const shut = await page.evaluate((selector) =>
      new Promise<{ sliding: boolean; onScreen: boolean; transitions: number }>(resolve => {
        const w = window as unknown as { onBack?: () => void };
        const panel = document.querySelector(selector)!;
        w.onBack = () => {
          w.onBack = undefined;
          const sliding = panel.getAnimations().length > 0;
          requestAnimationFrame(() => resolve({
            sliding,
            onScreen: panel.getBoundingClientRect().top < innerHeight,
            transitions: panel.getAnimations().length,
          }));
        };
        document.querySelector<HTMLElement>('button[aria-label="Close table of contents"]')!.click();
        requestAnimationFrame(() => history.back());
      }), DRAWER);
    expect(shut).toEqual({ sliding: true, onScreen: false, transitions: 0 });
  });

  test('Back between two entries of one page puts it away at once', async ({ page }) => {
    await page.goto(TYPE);
    const href = await samePageLink(page);
    await page.locator(`article a[href="${href}"]`).first().evaluate(a => (a as HTMLElement).click());
    // The new entry has rendered once its jump hands focus to the card's heading.
    const id = decodeURIComponent(href.slice(href.indexOf('#') + 1));
    await expect(page.locator(`[id="${id}"] h2`)).toBeFocused();

    await openByClick(page);
    expect(await travel(page, -1)).toEqual(PUT_AWAY);
    expect(await page.evaluate(() => location.hash)).toBe('');
  });

  test('Back with focus in it hands focus to the Contents button', async ({ page }) => {
    await toXion(page);
    await openByKeyboard(page);
    const link = drawer(page).locator('a[href="#main-gate"]');
    await link.focus();
    const focused = (await link.elementHandle())!;
    const focuses = await countFocus(page);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${LEVEL}$`));
    await expect(drawer(page)).toHaveAttribute('inert');
    expect(await focused.evaluate(a => a.isConnected), 'the focused link stayed in the page').toBe(true);
    await expect(contents(page)).toBeFocused();
    expect(await focuses(), 'one move, from the drawer').toBe(1);
  });

  test('Back hands focus to the Contents button though the focused link goes with the page', async ({ page }) => {
    await toXion(page);
    await openByKeyboard(page);
    const link = drawer(page).locator('a[href="#burning-xion"]');
    await link.focus();
    const focused = (await link.elementHandle())!;
    const focuses = await countFocus(page);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${LEVEL}$`));
    await expect(drawer(page)).toHaveAttribute('inert');
    expect(await focused.evaluate(a => a.isConnected), 'Back took the focused link out of the page').toBe(false);
    await expect(contents(page)).toBeFocused();
    expect(await focuses(), 'one move, from the drawer').toBe(1);
  });

  test('Back with focus outside it leaves focus where it is', async ({ page }) => {
    await toXion(page);
    await openByClick(page);
    const menu = page.getByRole('button', { name: 'Toggle menu', exact: true });
    await menu.focus();
    const focuses = await countFocus(page);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${LEVEL}$`));
    await expect(drawer(page)).toHaveAttribute('inert');
    await expect(menu).toBeFocused();
    expect(await focuses(), 'the Contents button took no focus').toBe(0);
  });

  test('slides again once a navigation has put it away', async ({ page }) => {
    await toXion(page);
    await openByClick(page);
    expect(await travel(page, -1)).toEqual(PUT_AWAY);

    const slides = await countSlides(page);
    await contents(page).click();
    await expect.poll(slides, 'the open slides').toBe(1);
    await closeButton(page).click();
    await expect.poll(slides, 'the close slides').toBe(2);
    await expect(drawer(page)).toHaveAttribute('inert');
  });

  test('a link pressed from the keyboard behind it puts it away and keeps focus', async ({ page }) => {
    await toXion(page);
    await page.goBack();
    await showsLevel(page, 'Eidos 7');
    await openByClick(page);
    // The drawer has no focus trap, so the keyboard reaches the page's own links behind it.
    await nextLink(page).focus();
    const focuses = await countFocus(page);
    await page.keyboard.press('Enter');
    await showsLevel(page, 'Xion');
    await expect(drawer(page)).toHaveAttribute('inert');
    await expect(nextLink(page)).toBeFocused();
    expect(await focuses(), 'the Contents button took no focus').toBe(0);
  });

  test('a typed fragment puts it away', async ({ page }) => {
    // The visit's first entry and a typed fragment's both have the key 'default'.
    expect(await entryKey(page), "the visit's first entry").toBe('default');
    await openByClick(page);
    await page.evaluate((id) => { location.hash = `#${id}`; }, SECTION);
    await expect(page).toHaveURL(new RegExp(`${LEVEL}#${SECTION}$`));
    expect(await entryKey(page), "the fragment's entry").toBe('default');
    await expect(drawer(page)).toHaveAttribute('inert');
  });

  test("a Contents press while a link's page still renders keeps it open on that page", async ({ page }) => {
    // Xion first, so its data is cached and the move back renders it in full, across React's yields.
    await toXion(page);
    await page.goBack();
    await showsLevel(page, 'Eidos 7');

    await pressWhileRendering(page, '/levels/xion');
    await showsLevel(page, 'Xion');
    const race = await page.evaluate(() => {
      const w = window as unknown as { pressed: boolean; openedUnder: string | null };
      return { pressed: w.pressed, openedUnder: w.openedUnder };
    });
    expect(race, 'the press landed, and the drawer opened, while Eidos 7 was still on screen')
      .toEqual({ pressed: true, openedUnder: 'Eidos 7' });
    await expect(drawer(page)).not.toHaveAttribute('inert');
    await expect(drawer(page).locator('a[href="#burning-xion"]'), "it lists Xion's places").toHaveCount(1);
  });

  test("a Back that cancels a link's page still rendering puts it away", async ({ page }) => {
    // Eidos 7 reached by Back, so the Back that cancels Xion hands React Router the location it
    // already had: only the drawer's popstate listener sees it.
    await toXion(page);
    await page.goBack();
    await showsLevel(page, 'Eidos 7');

    await pressWhileRendering(page, '/levels/xion', true);
    await expect(page).toHaveURL(new RegExp(`${LEVEL}$`));
    await expect.poll(() => page.evaluate(() => (window as unknown as { openedUnder: string | null }).openedUnder),
      'the drawer opened while Eidos 7 was on screen').toBe('Eidos 7');
    await expect(drawer(page)).toHaveAttribute('inert');
    await showsLevel(page, 'Eidos 7');
    const race = await page.evaluate(() => {
      const w = window as unknown as { pressed: boolean; headings: string[] };
      return { pressed: w.pressed, headings: w.headings };
    });
    expect(race, 'the press landed, and Xion never showed').toEqual({ pressed: true, headings: ['Eidos 7'] });
  });

  test('a Back that cancels a link followed from behind it puts it away', async ({ page }) => {
    // The check in Xion's render closes the drawer, though that render never commits, and the Back
    // hands React Router the location it already had: the popstate listener's close must apply.
    await toXion(page);
    await page.goBack();
    await showsLevel(page, 'Eidos 7');
    await openByClick(page);
    // A render of the drawer since it opened, as when another section lights up: until one, what
    // React kept of the open made it take the listener's close as a change.
    const lit = drawer(page).locator('[aria-current="location"]');
    await expect(lit, 'a section lit at the foot of Eidos 7').toHaveCount(1);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(lit, 'none lit at the top').toHaveCount(0);
    await nextLink(page).focus();
    await backWhileRendering(page, '/levels/xion');
    await page.keyboard.press('Enter');
    const afterBack = () => page.evaluate(() => (window as unknown as { afterBack: AfterBack | null }).afterBack);
    await expect.poll(afterBack, 'Back landed').not.toBeNull();
    await expect(page).toHaveURL(new RegExp(`${LEVEL}$`));
    expect(await afterBack(), 'put away at once').toEqual({ inert: true, onScreen: false, transitions: 0 });
    await showsLevel(page, 'Eidos 7');
    expect(await page.evaluate(() => (window as unknown as { headings: string[] }).headings), 'Xion never showed')
      .toEqual(['Eidos 7']);
  });
});
