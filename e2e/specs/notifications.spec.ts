import { test, expect, type Locator, type Page } from '@playwright/test';
import { readFixtures, createCommentThread, deleteFixtureComments, insertReplyNotification, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { expectBusyPattern } from '../helpers/busy';
import { holdRoute } from '../helpers/route';
import { pressAsSafari } from '../helpers/safari';

// The bell (components/NotificationBell.tsx) says whether its panel is open. Its Mark
// all read shows the busy pattern (helpers/busy.ts) while its request is out, a second
// press meanwhile sends nothing, a refusal is shown rather than passing silently, and a
// success is read out, with focus kept in the panel as the button goes. The panel closes
// on Back, Forward, a typed fragment and Escape, focus in it going back to the bell, and
// when focus lands on something outside it, from the panel or from the page, but not when
// focus goes nowhere. Opening the search closes it too, and a session that ends takes it down.

let fx: Fixtures;
const REFUSED = 'e2e: Mark all read refused';

// React runs what a press set off, its effects included, within two message turns.
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise(resolve => {
    const ch = new MessageChannel();
    let turns = 0;
    ch.port1.onmessage = () => (++turns === 2 ? resolve(null) : ch.port2.postMessage(null));
    ch.port2.postMessage(null);
  }));
}

const bellButton = (page: Page) => page.getByRole('button', { name: 'Notifications (1 unread)', exact: true });

// The panel the bell names.
async function bellPanel(page: Page): Promise<Locator> {
  return page.locator(`[id="${await bellButton(page).getAttribute('aria-controls')}"]`);
}

type InPanel = 'Mark all read' | 'the notification';

// Opens the panel from the keys and Tabs into it, to Mark all read or on to the notification.
async function focusInPanel(page: Page, target: InPanel): Promise<void> {
  await bellButton(page).focus();
  await page.keyboard.press('Enter');
  await expect(bellButton(page)).toHaveAttribute('aria-expanded', 'true');
  const panel = await bellPanel(page);
  await page.keyboard.press('Tab');
  if (target === 'the notification') await page.keyboard.press('Tab');
  await expect(target === 'Mark all read'
    ? panel.getByRole('button', { name: 'Mark all read', exact: true })
    : panel.getByRole('link')).toBeFocused();
}

// Answers the bell's list with nothing in it, so its panel holds only text.
async function noNotifications(page: Page): Promise<void> {
  await page.route('**/api/notifications', route => route.request().method() === 'GET'
    ? route.fulfill({ json: { items: [], unread_count: 0 } })
    : route.fallback());
}

const focusOnPage = (page: Page) => page.evaluate(() => document.activeElement === document.body);

// A level page has rendered in full: its heading, then its cards.
async function showsLevel(page: Page, name: string): Promise<void> {
  await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
  await expect(page.locator('section[id] article[id]').first()).toBeVisible();
}

interface AtBack { open: string | null; focus: string; heading: string }

// Follows Eidos 7's Next link with a click that moves no focus and, while React renders Xion,
// opens the bell, puts focus on `target` in its panel and presses Back before Xion can commit:
// StructuredData turns Xion's crumbs into JSON as it renders (contents-drawer.spec.ts). Records
// what Back found, and each heading shown, from the one on screen now.
const openWhileRendering = (page: Page, target: InPanel) => page.evaluate((target) => {
  const w = window as unknown as { atBack: AtBack | null; headings: string[]; headingObserver?: MutationObserver };
  w.atBack = null;
  w.headings = [document.querySelector('main h1')?.textContent ?? ''];
  w.headingObserver?.disconnect();
  w.headingObserver = new MutationObserver(() => {
    const heading = document.querySelector('main h1')?.textContent ?? '';
    if (w.headings.at(-1) !== heading) w.headings.push(heading);
  });
  w.headingObserver.observe(document.body, { subtree: true, childList: true, characterData: true });
  const bell = document.querySelector<HTMLElement>('button[aria-label^="Notifications"]')!;
  const stringify = JSON.stringify;
  JSON.stringify = function (this: JSON, ...args: Parameters<typeof JSON.stringify>) {
    const [value] = args;
    if (Array.isArray(value) && value.some(crumb => (crumb as { path?: string } | null)?.path === '/levels/xion')) {
      JSON.stringify = stringify;
      queueMicrotask(() => {
        bell.click();
        setTimeout(() => {
          const panel = document.getElementById(bell.getAttribute('aria-controls')!)!;
          panel.querySelector<HTMLElement>(target === 'Mark all read' ? 'button' : 'a')?.focus();
          const active = document.activeElement;
          w.atBack = {
            open: bell.getAttribute('aria-expanded'),
            focus: active && panel.contains(active) ? (active.tagName === 'A' ? 'the notification' : 'Mark all read') : 'outside the panel',
            heading: document.querySelector('main h1')?.textContent ?? '',
          };
          history.back();
        }, 0);
      });
    }
    return stringify.apply(this, args);
  } as typeof JSON.stringify;
  Array.from(document.querySelectorAll<HTMLAnchorElement>('main a[href="/levels/xion"]'))
    .find(a => /^Next/.test(a.textContent ?? ''))!.click();
}, target);

// The bell and the search box (the nav's only input) as the search opens.
interface AtOpen { open: string | null; box: boolean; boxFocused: boolean }

// From here on, each Ctrl+K records the bell and the box in the key's own task, before the box
// takes focus, which closes the panel by itself. Added after the search's own listener, it runs
// once React has committed what that one set.
const recordCtrlK = (page: Page) => page.evaluate(() => {
  const w = window as unknown as { atCtrlK: AtOpen[] };
  w.atCtrlK = [];
  window.addEventListener('keydown', e => {
    if (!e.ctrlKey || e.key !== 'k') return;
    const box = document.querySelector('nav input');
    w.atCtrlK.push({
      open: document.querySelector('button[aria-label^="Notifications"]')?.getAttribute('aria-expanded') ?? null,
      box: !!box,
      boxFocused: !!box && document.activeElement === box,
    });
  });
});
const atCtrlK = (page: Page) => page.evaluate(() => (window as unknown as { atCtrlK: AtOpen[] }).atCtrlK);

// From here on, logs each element that takes focus.
const logFocus = (page: Page) => page.evaluate(() => {
  const w = window as unknown as { focusLog: string[] };
  w.focusLog = [];
  document.addEventListener('focusin', e => {
    const el = e.target as HTMLElement;
    w.focusLog.push(el.tagName === 'INPUT' ? 'the search box' : el.getAttribute('aria-label') ?? el.textContent ?? '');
  }, true);
});
const focusLog = (page: Page) => page.evaluate(() => (window as unknown as { focusLog: string[] }).focusLog);

// From here on, the panel's fade is held from the moment it closes, the panel still shown and its
// controls still able to take focus, until fadeEnds. Records how many animations it held.
const holdFadeOnClose = (page: Page) => page.evaluate(() => {
  const w = window as unknown as { fadeHeld: { held: number; visibility: string } | null };
  w.fadeHeld = null;
  const bell = document.querySelector<HTMLElement>('button[aria-label^="Notifications"]')!;
  const panel = document.getElementById(bell.getAttribute('aria-controls')!)!;
  const observer = new MutationObserver(() => {
    if (bell.getAttribute('aria-expanded') !== 'false') return;
    observer.disconnect();
    // Reading the animations applies the closed style, which starts the fade.
    const fade = panel.getAnimations({ subtree: true });
    fade.forEach(a => a.pause());
    w.fadeHeld = { held: fade.length, visibility: getComputedStyle(panel).visibility };
  });
  observer.observe(bell, { attributes: true, attributeFilter: ['aria-expanded'] });
});
const fadeHeld = (page: Page) => page.evaluate(() => (window as unknown as { fadeHeld: { held: number; visibility: string } | null }).fadeHeld);

// Lets a held fade run on, or waits for a running one, until the panel no longer shows.
async function fadeEnds(panel: Locator): Promise<void> {
  await panel.evaluate(el => Promise.all(el.getAnimations({ subtree: true }).map(a => { a.play(); return a.finished; })).then(() => undefined));
  await expect.poll(() => panel.evaluate(el => getComputedStyle(el).visibility)).toBe('hidden');
}

test.describe('notifications', () => {
  let ip: string;
  let user: TestUser;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, 'bell');
    await apiRegister(page, user, ip);
    const { replyId } = await createCommentThread(fx, user.username);
    await insertReplyNotification(fx, user.username, replyId);
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
    // The bell shows from lg.
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test.afterEach(async ({ page }) => {
    await deleteFixtureComments(fx);
    await apiDeleteUser(page, user, ip);
  });

  test('Mark all read shows the busy pattern while its request is out, and a second press sends nothing', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Notifications (1 unread)', exact: true }).click();
    const markAll = page.getByRole('button', { name: 'Mark all read', exact: true });

    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    let arrived!: () => void;
    const seen = new Promise<void>(resolve => { arrived = resolve; });
    let sent = 0;
    await page.route('**/api/notifications/read-all', async route => {
      sent += 1;
      arrived();
      await gate;
      await route.fulfill({ response: await route.fetch() });
    });

    await expectBusyPattern(markAll, {
      name: 'Mark all read', busyText: 'Marking all read…',
      live: markAll.locator('xpath=following-sibling::span[@aria-live="polite"][1]'),
      press: () => markAll.click(), seen,
    });
    await markAll.click();
    await settle(page);
    expect(sent, 'one request, however often it was pressed').toBe(1);

    release();
    await expect(page.getByRole('button', { name: 'Notifications', exact: true })).toBeVisible();
    await expect(markAll).toHaveCount(0);
    expect(sent).toBe(1);
  });

  test('a Mark all read that lands reads out its result, and leaves focus in the panel', async ({ page }) => {
    await page.goto('/');
    const bell = page.getByRole('button', { name: 'Notifications (1 unread)', exact: true });
    await bell.click();
    const panel = page.locator(`[id="${await bell.getAttribute('aria-controls')}"]`);
    const markAll = panel.getByRole('button', { name: 'Mark all read', exact: true });
    const live = panel.locator('span[aria-live="polite"]');
    const hold = await holdRoute(page, '**/api/notifications/read-all');

    // Counts the heading's focus events. A ref cleanup that ran on every render would send
    // focus there and back while the button stays (React puts focus back after a commit).
    const heading = panel.getByText('Notifications', { exact: true });
    await heading.evaluate(el => {
      const w = window as unknown as { headingFocus: number };
      w.headingFocus = 0;
      el.addEventListener('focus', () => { w.headingFocus += 1; });
    });
    const headingFocus = () => page.evaluate(() => (window as unknown as { headingFocus: number }).headingFocus);

    await markAll.focus();
    await page.keyboard.press('Enter');
    await hold.seen;
    // Focus stays on the button while it is busy and re-rendering.
    await expect(markAll).toHaveAttribute('aria-busy', 'true');
    await expect(live).toHaveText('Marking all read…');
    await expect(markAll).toBeFocused();
    expect(await headingFocus(), 'the heading took no focus while the button stayed').toBe(0);

    hold.release();
    // Nothing is left unread, so the button goes, and focus moves to the panel's heading
    // rather than dropping to the page.
    await expect(markAll).toHaveCount(0);
    await expect(heading).toBeFocused();
    expect(await headingFocus()).toBe(1);
    await expect(live).toHaveText('All marked read.');

    // Closing the panel clears the result, so reopening it reads nothing again. The bell
    // no longer counts anything unread.
    const read = page.getByRole('button', { name: 'Notifications', exact: true });
    await read.click();
    await expect(read).toHaveAttribute('aria-expanded', 'false');
    await expect(live).toHaveText('');
    await read.click();
    await expect(read).toHaveAttribute('aria-expanded', 'true');
    await expect(live).toHaveText('');
  });

  test('the bell says whether its panel is open, and which panel it opens', async ({ page }) => {
    await page.goto('/');
    const bell = page.getByRole('button', { name: 'Notifications (1 unread)', exact: true });
    await expect(bell).toHaveAttribute('aria-expanded', 'false');
    const panel = page.locator(`[id="${await bell.getAttribute('aria-controls')}"]`);
    await expect(panel).toBeHidden();

    await bell.click();
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
    await expect(panel.getByRole('button', { name: 'Mark all read', exact: true })).toBeVisible();
    await bell.click();
    await expect(bell).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();

    // A press outside closes it too.
    await bell.click();
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('heading', { level: 1 }).click();
    await expect(bell).toHaveAttribute('aria-expanded', 'false');
  });

  test("the panel's controls can take focus in the frame it opens", async ({ page }) => {
    await page.goto('/');
    const bell = page.getByRole('button', { name: 'Notifications (1 unread)', exact: true });
    await bell.waitFor();
    // All in one task: the press, React's commit (a microtask), then the reads, before any
    // frame runs. With visibility in its fade the panel stayed hidden until the fade's
    // first step, so a Tab straight after opening skipped Mark all read and the links.
    const seen = await bell.evaluate(async el => {
      el.click();
      await Promise.resolve();
      await Promise.resolve();
      const panel = document.getElementById(el.getAttribute('aria-controls')!)!;
      const first = panel.querySelector<HTMLElement>('button')!;
      first.focus();
      return { expanded: el.getAttribute('aria-expanded'), visibility: getComputedStyle(panel).visibility, focused: document.activeElement === first, name: first.textContent };
    });
    expect(seen).toEqual({ expanded: 'true', visibility: 'visible', focused: true, name: 'Mark all read' });
  });

  test('a refused Mark all read says so, and the notification stays unread', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Notifications (1 unread)', exact: true }).click();
    const markAll = page.getByRole('button', { name: 'Mark all read', exact: true });
    await page.route('**/api/notifications/read-all', route =>
      route.fulfill({ status: 400, json: { detail: REFUSED } }));

    await markAll.click();
    await expect(page.getByText(REFUSED, { exact: true })).toBeVisible();
    await expect(markAll).toHaveAttribute('aria-busy', 'false');
    await expect(page.getByRole('button', { name: 'Notifications (1 unread)', exact: true })).toBeVisible();
  });

  test('Back, Forward and a typed fragment close the panel, focus in it going back to the bell', async ({ page }) => {
    // A page of the app's own, so Back stays in this document. No entry's fragment names an
    // element: Chromium clears focus after landing on one.
    await page.goto('/');
    await page.locator('nav[aria-label="Footer"]').getByRole('link', { name: 'Terms', exact: true }).click();
    await expect(page).toHaveURL('/terms');
    const bell = bellButton(page);
    const panel = await bellPanel(page);
    const rounds: [string, InPanel, () => Promise<unknown>, string][] = [
      ['Back', 'Mark all read', () => page.goBack(), '/'],
      ['Forward', 'the notification', () => page.goForward(), '/terms'],
      ['Back', 'the notification', () => page.goBack(), '/'],
      ['Forward', 'Mark all read', () => page.goForward(), '/terms'],
      ['a typed fragment', 'Mark all read', () => page.evaluate(() => { location.hash = 'probe-fragment'; }), '/terms#probe-fragment'],
      ['a typed fragment', 'the notification', () => page.evaluate(() => { location.hash = 'probe-fragment-2'; }), '/terms#probe-fragment-2'],
    ];
    for (const [how, from, go, url] of rounds) {
      await focusInPanel(page, from);
      await go();
      await expect(page).toHaveURL(url);
      await expect(bell, `${how} from ${from} closes it`).toHaveAttribute('aria-expanded', 'false');
      await expect(panel).toBeHidden();
      await expect(bell, `${how} from ${from} gives focus back to the bell`).toBeFocused();
    }
  });

  test('a Back that cancels a page still rendering closes the panel opened meanwhile, focus in it going back to the bell', async ({ page }) => {
    // Eidos 7 reached by Back, so the Back that cancels Xion hands React Router the location it
    // already had. Xion first, so its data is cached and its render takes React's yields.
    await page.goto('/levels/eidos-7');
    await showsLevel(page, 'Eidos 7');
    await page.locator('main a').filter({ hasText: /^Next/ }).click();
    await showsLevel(page, 'Xion');
    await page.goBack();
    await showsLevel(page, 'Eidos 7');
    const bell = bellButton(page);
    // openWhileRendering takes the bell from the page without waiting: the session and its
    // notification first.
    await expect(bell).toBeVisible();
    const atBack = () => page.evaluate(() => (window as unknown as { atBack: AtBack | null }).atBack);
    for (const from of ['Mark all read', 'the notification'] as const) {
      await openWhileRendering(page, from);
      await expect.poll(atBack, 'Back was pressed').not.toBeNull();
      expect(await atBack(), `the panel open with focus on ${from}, while Eidos 7 was still on screen`)
        .toEqual({ open: 'true', focus: from, heading: 'Eidos 7' });
      await expect(page).toHaveURL('/levels/eidos-7');
      await expect(bell, `Back from ${from} closes it`).toHaveAttribute('aria-expanded', 'false');
      await expect(bell, `Back from ${from} gives focus back to the bell`).toBeFocused();
      await showsLevel(page, 'Eidos 7');
      expect(await page.evaluate(() => (window as unknown as { headings: string[] }).headings), 'Xion never showed')
        .toEqual(['Eidos 7']);
    }
  });

  test('a typed fragment naming a section closes the panel too', async ({ page }) => {
    await page.goto('/privacy');
    await focusInPanel(page, 'Mark all read');
    await page.evaluate(() => { location.hash = 'cookies'; });
    await expect(page).toHaveURL('/privacy#cookies');
    await expect(bellButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(await bellPanel(page)).toBeHidden();
  });

  test('Escape closes the panel from Mark all read, from the notification and after a click that left focus on the page, focus going back to the bell', async ({ page }) => {
    await page.goto('/');
    const bell = bellButton(page);
    for (const from of ['Mark all read', 'the notification'] as const) {
      await focusInPanel(page, from);
      await page.keyboard.press('Escape');
      await expect(bell, `Escape from ${from} closes it`).toHaveAttribute('aria-expanded', 'false');
      await expect(bell, `Escape from ${from} gives focus back to the bell`).toBeFocused();
    }

    // Safari's click takes focus off the bell and gives it to nothing, so the panel never holds
    // focus to hear the key.
    await pressAsSafari(bell);
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
    expect(await focusOnPage(page), 'the click left focus on the page').toBe(true);
    await page.keyboard.press('Escape');
    await expect(bell, 'Escape after the click closes it').toHaveAttribute('aria-expanded', 'false');
    await expect(bell, 'Escape after the click gives focus to the bell').toBeFocused();
  });

  test('Escape with focus on the bell closes the panel and leaves focus on the bell', async ({ page }) => {
    await page.goto('/');
    const bell = bellButton(page);
    await bell.focus();
    await page.keyboard.press('Enter');
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
    // Counts the bell's focus events from here: focus moved away and back would count one.
    await bell.evaluate(el => {
      const w = window as unknown as { bellFocus: number };
      w.bellFocus = 0;
      el.addEventListener('focus', () => { w.bellFocus += 1; });
    });
    await page.keyboard.press('Escape');
    await expect(bell).toHaveAttribute('aria-expanded', 'false');
    await expect(bell).toBeFocused();
    expect(await page.evaluate(() => (window as unknown as { bellFocus: number }).bellFocus), 'focus never left the bell').toBe(0);
  });

  test('with focus on nothing after a Safari-style click on the bell, Escape closes the panel and leaves a menu hover opened open', async ({ page }) => {
    await page.goto('/');
    const bell = bellButton(page);
    await page.mouse.move(5, 700);
    await pressAsSafari(bell);
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
    expect(await focusOnPage(page), 'the click left focus on the page').toBe(true);
    // Hovering a menu leaves the panel open: the Collectibles label.
    const arrow = page.getByRole('button', { name: 'Toggle collectibles menu', exact: true });
    await arrow.locator('xpath=preceding-sibling::a').hover();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await expect(bell, 'the panel, still open').toHaveAttribute('aria-expanded', 'true');
    // The panel's Escape runs first and gives focus to the bell.
    await page.keyboard.press('Escape');
    await expect(bell, 'Escape closes the panel').toHaveAttribute('aria-expanded', 'false');
    await expect(bell, 'Escape gives focus to the bell').toBeFocused();
    await settle(page);
    await expect(arrow, 'the menu, still open').toHaveAttribute('aria-expanded', 'true');
  });

  test('focus moving on out of the panel closes it, so one panel shows at a time', async ({ page }) => {
    await page.goto('/');
    // Away from the nav's menus, which open under a resting pointer.
    await page.mouse.move(5, 700);
    const bell = bellButton(page);
    const account = page.getByRole('button', { name: 'Account menu' });

    // Tab past the panel's last control, to the account menu's button, which then opens alone.
    await focusInPanel(page, 'the notification');
    await page.keyboard.press('Tab');
    await expect(account).toBeFocused();
    await expect(bell).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: /^Progress/ })).toBeFocused();
    await expect(bell).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Escape');

    // Shift+Tab from the bell, to the Search button.
    await bell.focus();
    await page.keyboard.press('Enter');
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Search (Ctrl+K)', exact: true })).toBeFocused();
    await expect(bell).toHaveAttribute('aria-expanded', 'false');
  });

  test('with no notifications, a Safari-style click on the bell and then Tab closes the panel, with focus on the Account menu button', async ({ page }) => {
    await noNotifications(page);
    await page.goto('/');
    // Away from the nav's menus, which open under a resting pointer.
    await page.mouse.move(5, 700);
    const bell = page.getByRole('button', { name: 'Notifications', exact: true });
    await pressAsSafari(bell);
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('No notifications yet.', { exact: true })).toBeVisible();
    expect(await focusOnPage(page), 'the click left focus on the page').toBe(true);

    // Nothing in the panel takes focus, so Tab goes from the page to the account menu's button.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Account menu' })).toBeFocused();
    await expect(bell, 'focus landing outside from the page closes it').toHaveAttribute('aria-expanded', 'false');
    // Which then opens alone.
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: /^Progress/ })).toBeFocused();
    await expect(bell).toHaveAttribute('aria-expanded', 'false');
  });

  test("with no notifications, a press on the panel's text and then Tab closes the panel", async ({ page }) => {
    await noNotifications(page);
    await page.goto('/');
    await page.mouse.move(5, 700);
    const bell = page.getByRole('button', { name: 'Notifications', exact: true });
    await bell.focus();
    await page.keyboard.press('Enter');
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
    // The text can't take focus: the press leaves focus on the page, and the panel open.
    await page.getByText('No notifications yet.', { exact: true }).click();
    expect(await focusOnPage(page), 'the press left focus on the page').toBe(true);
    await expect(bell).toHaveAttribute('aria-expanded', 'true');

    // Nothing after the text takes focus in the panel, so Tab lands outside it.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Account menu' })).toBeFocused();
    await expect(bell, 'focus landing outside from the page closes it').toHaveAttribute('aria-expanded', 'false');
  });

  test("a press on the panel's padding keeps it open, and Escape still closes it", async ({ page }) => {
    await page.goto('/');
    const bell = bellButton(page);
    await focusInPanel(page, 'Mark all read');
    const panel = await bellPanel(page);
    // In the header's padding, clear of the heading and the button: focus goes nowhere.
    const box = (await panel.boundingBox())!;
    await page.mouse.click(box.x + 6, box.y + 6);
    expect(await focusOnPage(page), 'the press left focus on the page').toBe(true);
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(bell).toHaveAttribute('aria-expanded', 'false');
    await expect(bell).toBeFocused();
  });

  test('Ctrl+K closes the panel as it opens the search, even after a click that left focus on the page', async ({ page }) => {
    await page.goto('/');
    const bell = bellButton(page);
    const searchBox = page.getByPlaceholder('Search…', { exact: true });

    // Safari's click focuses nothing. The box takes focus a task after the key, which would close
    // the panel by itself, so the key's own task is read: the box is there, not yet focused.
    await pressAsSafari(bell);
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
    expect(await focusOnPage(page), 'the click left focus on the page').toBe(true);
    await recordCtrlK(page);
    await page.keyboard.press('Control+k');
    await expect(searchBox).toBeFocused();
    expect((await atCtrlK(page))[0], 'Ctrl+K after the click closes it in its own task')
      .toEqual({ open: 'false', box: true, boxFocused: false });
    await expect(bell, 'Ctrl+K after the click closes it').toHaveAttribute('aria-expanded', 'false');
    await expect(await bellPanel(page), 'nothing drawn over the results').toBeHidden();

    // And from inside the panel.
    await page.keyboard.press('Escape');
    await expect(searchBox).toHaveCount(0);
    await focusInPanel(page, 'Mark all read');
    await page.keyboard.press('Control+k');
    await expect(searchBox).toBeFocused();
    expect((await atCtrlK(page))[1], 'Ctrl+K from the panel closes it in its own task')
      .toEqual({ open: 'false', box: true, boxFocused: false });
    await expect(bell, 'Ctrl+K from the panel closes it').toHaveAttribute('aria-expanded', 'false');
  });

  test('Escape straight after Ctrl+K from Mark all read gives focus to the bell, which keeps it once the panel has faded', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(5, 700);
    const bell = bellButton(page);
    await focusInPanel(page, 'Mark all read');
    const panel = await bellPanel(page);
    // Held from the moment the panel closes, its fade can't end before the Escape, however long
    // the steps between take: Mark all read could still take focus.
    await holdFadeOnClose(page);
    await logFocus(page);
    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder('Search…', { exact: true })).toBeFocused();
    const held = await fadeHeld(page);
    expect(held?.held, 'the panel closed, its fade held').toBeGreaterThan(0);
    expect(held?.visibility, 'the closed panel still shows').toBe('visible');

    await page.keyboard.press('Escape');
    await expect(bell, 'Escape gives focus to the bell, not to Mark all read in the closing panel').toBeFocused();
    await fadeEnds(panel);
    await expect(bell, 'the bell keeps focus once the panel has faded').toBeFocused();
    expect(await focusLog(page), 'nothing in the panel took focus after Ctrl+K').toEqual(['the search box', 'Notifications (1 unread)']);
  });

  test('Escape after Ctrl+K from Mark all read, once the panel has faded, gives focus to the bell', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(5, 700);
    const bell = bellButton(page);
    await focusInPanel(page, 'Mark all read');
    const panel = await bellPanel(page);
    await logFocus(page);
    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder('Search…', { exact: true })).toBeFocused();
    // Once the fade ends, Mark all read can no longer take focus.
    await fadeEnds(panel);

    await page.keyboard.press('Escape');
    await expect(bell, 'Escape gives focus to the bell, not to the Search button').toBeFocused();
    expect(await focusLog(page), 'nothing else took focus after Ctrl+K').toEqual(['the search box', 'Notifications (1 unread)']);
  });

  test('the Search button closes the panel as it opens the search, even pressed by a click that moves no focus', async ({ page }) => {
    await page.goto('/');
    const bell = bellButton(page);
    await pressAsSafari(bell);
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
    // A script's click moves no focus and presses nothing outside the panel, so only the button
    // itself can close it before the box takes focus a task later, which would close it anyway.
    const atOpen: AtOpen = await page.evaluate(async () => {
      document.querySelector<HTMLElement>('button[aria-label="Search (Ctrl+K)"]')!.click();
      // React commits the click in a microtask; the box takes focus in a later task.
      await Promise.resolve();
      await Promise.resolve();
      const box = document.querySelector('nav input');
      return {
        open: document.querySelector('button[aria-label^="Notifications"]')?.getAttribute('aria-expanded') ?? null,
        box: !!box,
        boxFocused: !!box && document.activeElement === box,
      };
    });
    expect(atOpen, 'the press closes it in its own task').toEqual({ open: 'false', box: true, boxFocused: false });
    await expect(page.getByPlaceholder('Search…', { exact: true })).toBeFocused();
    await expect(bell).toHaveAttribute('aria-expanded', 'false');
    await expect(await bellPanel(page)).toBeHidden();
  });

  test('a panel open in a tab whose session another tab ends comes back closed with the session', async ({ page: a, context }) => {
    const account = (p: Page) => p.getByRole('button', { name: 'Account menu' });
    await a.goto('/');
    await expect(account(a)).toBeVisible();
    // B, a second tab of the same browser, restored by its own refresh, opens its panel.
    const b = await context.newPage();
    await b.setViewportSize({ width: 1280, height: 800 });
    await b.goto('/');
    await bellButton(b).click();
    await expect(bellButton(b)).toHaveAttribute('aria-expanded', 'true');

    // A signs out, which signs B out at once, with B's panel still open.
    await account(a).click();
    await expect(bellButton(b), 'still open as A signs out').toHaveAttribute('aria-expanded', 'true');
    await a.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(b.getByRole('button', { name: /^Notifications/ })).toHaveCount(0);

    // A signs in again, and B, with no page change between, recovers on its next focus: its
    // panel went with the session, so it comes back closed.
    await a.locator('nav').getByRole('link', { name: 'Sign in' }).filter({ visible: true }).click();
    await a.getByLabel('Email').fill(user.email);
    await a.getByLabel('Password', { exact: true }).fill(user.password);
    await a.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(account(a)).toBeVisible();
    await b.bringToFront();
    await b.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(bellButton(b)).toBeVisible();
    await expect(bellButton(b)).toHaveAttribute('aria-expanded', 'false');
  });
});
