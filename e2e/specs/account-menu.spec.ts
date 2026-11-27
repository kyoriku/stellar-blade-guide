import { test, expect, type Locator, type Page } from '@playwright/test';
import { readFixtures, setUserRole, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { ADMIN_COPY } from '../../client/src/constants/adminCopy';
import { expectBusyPattern } from '../helpers/busy';
import { pressAsSafari } from '../helpers/safari';

// The navbar's account menu (desktop) runs on the WAI-ARIA menu button pattern, as the
// admin page's row menus do (client/src/hooks/useMenuButton.ts): the button opens it
// on its first item (Enter, Space, a click or Down) or its last (Up); the arrows move
// with wrap-around, Home and End jump to the ends, Escape closes it and gives focus
// back to the button, Tab closes it and lets focus move on, and a press outside
// closes it. The panel stays mounted and fades in, so an item can only take focus once
// it is visible: the hook tries again each frame until it is.

let fx: Fixtures;
let ip: string;
let user: TestUser;
let seq = 0;

const trigger = (page: Page) => page.getByRole('button', { name: 'Account menu' });
const menu = (page: Page) => page.getByRole('menu', { name: 'Account menu' });
// Any menu at all, named or not: a closed one is hidden from everyone.
const anyMenu = (page: Page) => page.getByRole('menu');
const item = (page: Page, name: string | RegExp) => page.getByRole('menuitem', { name, exact: typeof name === 'string' });
// Its accessible name carries the completion ring's percentage once stats load.
const PROGRESS = /^Progress/;
const navSignIn = (page: Page) => page.locator('nav').getByRole('link', { name: 'Sign in' }).filter({ visible: true });
// Sign out's live region, after the drawer toggle, which is hidden from lg; the region
// itself shows at every width.
const signOutLive = (page: Page) => page.locator('button[aria-controls="mobile-menu"] ~ span[aria-live="polite"]');
// The menu's panel, which fades, found open or closed.
const accountPanel = (page: Page) => page.locator('[role="menu"][aria-label="Account menu"]').locator('xpath=..');
// The desktop search's box; the drawer's sits outside the bar.
const searchBox = (page: Page) => page.locator('nav input');
const LEVEL = '/levels/eidos-7';
// The level page's own Next link, to the level after it.
const nextLink = (page: Page) => page.locator('main a').filter({ hasText: /^Next/ });
const focusOnPage = (page: Page) => page.evaluate(() => document.activeElement === document.body);

// A level page has rendered in full: its heading, then its cards. The address changes before
// the page does, so a wait on the address alone would find the last page.
async function showsLevel(page: Page, name: string) {
  await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
  await expect(page.locator('section[id] article[id]').first()).toBeVisible();
}

// Counts focus events on the drawer's menu button from here on. It stays mounted across pages.
async function countMenuButtonFocus(page: Page) {
  await page.getByRole('button', { name: 'Toggle menu' }).evaluate(button => {
    const w = window as unknown as { menuButtonFocus?: number };
    if (w.menuButtonFocus === undefined) button.addEventListener('focus', () => { w.menuButtonFocus! += 1; });
    w.menuButtonFocus = 0;
  });
  return () => page.evaluate(() => (window as unknown as { menuButtonFocus: number }).menuButtonFocus);
}

// Holds every sign-out request until release(), then lets the server answer it.
async function holdSignOut(page: Page) {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let arrived!: () => void;
  const seen = new Promise<void>(resolve => { arrived = resolve; });
  let sent = 0;
  await page.route('**/api/auth/logout', async route => {
    sent += 1;
    arrived();
    await gate;
    await route.fulfill({ response: await route.fetch() });
  });
  return { release: () => release(), seen, sent: () => sent };
}

// A second sign-out sent while the first was out would wait behind it for the refresh
// lock (sb_auth_refresh, utils/refreshLock.ts) and go once it landed. Everything queued
// for the lock has run by the time this turn at it comes.
async function expectNoSecondSignOut(page: Page, hold: { sent: () => number }): Promise<void> {
  await page.evaluate(() => navigator.locks.request('sb_auth_refresh', () => undefined));
  expect(hold.sent(), 'still one sign-out once the first has landed').toBe(1);
}

// React runs what a press set off, its effects included, within two message turns.
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise(resolve => {
    const ch = new MessageChannel();
    let turns = 0;
    ch.port1.onmessage = () => (++turns === 2 ? resolve(null) : ch.port2.postMessage(null));
    ch.port2.postMessage(null);
  }));
}

// Counts focus events on the bar's Sign in link from here on. It mounts again with each sign-out,
// so they are counted by what they land on.
async function countSignInFocus(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { signInFocus?: number };
    if (w.signInFocus === undefined) {
      document.addEventListener('focusin', e => {
        if (e.target instanceof Element && e.target.matches('nav a[href="/login"]')) w.signInFocus! += 1;
      }, true);
    }
    w.signInFocus = 0;
  });
  return () => page.evaluate(() => (window as unknown as { signInFocus: number }).signInFocus);
}

// Chooses Sign out from the menu by its keys, which leaves focus on it while it is out.
async function chooseSignOutByKeys(page: Page) {
  await page.mouse.move(5, 700);
  await trigger(page).focus();
  await page.keyboard.press('ArrowUp');
  await expect(item(page, 'Sign out')).toBeFocused();
  await page.keyboard.press('Enter');
}

const bell = (page: Page) => page.getByRole('button', { name: /^Notifications/ });

// Answers the bell's list with one unread reply, so its panel holds Mark all read.
async function oneUnread(page: Page) {
  await page.route('**/api/notifications', route => route.request().method() === 'GET'
    ? route.fulfill({ json: { items: [{
      id: 1, type: 'comment_reply', actor_username: null, label: 'EVE Protocol', url: '/walkthroughs/main-story/eve-protocol#comment-1',
      content_type: 'walkthrough', content_id: 1, is_read: false, created_at: new Date().toISOString(),
    }], unread_count: 1 } })
    : route.fallback());
}

// From here on, the bell's panel holds its fade from the moment it closes, so it still shows and
// focus can stay in it. Reading the animations applies the closed style, which starts the fade.
async function holdBellFadeOnClose(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { bellFade: { held: number; visibility: string } | null };
    w.bellFade = null;
    const button = document.querySelector<HTMLElement>('button[aria-label^="Notifications"]')!;
    const panel = document.getElementById(button.getAttribute('aria-controls')!)!;
    const observer = new MutationObserver(() => {
      if (button.getAttribute('aria-expanded') !== 'false') return;
      observer.disconnect();
      const fade = panel.getAnimations({ subtree: true });
      fade.forEach(a => a.pause());
      w.bellFade = { held: fade.length, visibility: getComputedStyle(panel).visibility };
    });
    observer.observe(button, { attributes: true, attributeFilter: ['aria-expanded'] });
  });
  return () => page.evaluate(() => (window as unknown as { bellFade: { held: number; visibility: string } | null }).bellFade);
}

test.beforeAll(() => {
  fx = readFixtures();
});

test.beforeEach(async ({ page, context }) => {
  ip = nextTestIp();
  await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
  user = makeUser(fx.token, `acct${++seq}`);
  // Registering sets the refresh cookie, so the page signs in as this account.
  await apiRegister(page, user, ip);
  await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  // Desktop: below lg the drawer holds these links instead.
  await page.setViewportSize({ width: 1280, height: 800 });
});

test.afterEach(async ({ page }) => {
  // An admin account refuses its own deletion route.
  await setUserRole(user.username, 'user');
  await apiDeleteUser(page, user, ip);
});

async function home(page: Page): Promise<Locator> {
  await page.goto('/');
  await expect(trigger(page)).toBeVisible();
  return trigger(page);
}

// Records each element focus lands on, by its name, from the next Escape on.
async function recordLandings(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { landed: string[] | null };
    w.landed = null;
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') w.landed ??= [];
    }, true);
    document.addEventListener('focusin', e => {
      const el = e.target as Element;
      w.landed?.push(el.getAttribute('aria-label') ?? el.textContent?.trim() ?? '');
    }, true);
  });
  return () => page.evaluate(() => (window as unknown as { landed: string[] | null }).landed);
}

test('the keys open it on its first or last item and move between its items as a menu does', async ({ page }) => {
  const button = await home(page);
  await expect(button).toHaveAttribute('aria-haspopup', 'menu');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).not.toHaveAttribute('aria-controls', /./);
  // Closed, it is hidden from everyone.
  await expect(anyMenu(page)).toHaveCount(0);

  // Enter opens it on the first item.
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(item(page, PROGRESS)).toBeFocused();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(button).toHaveAttribute('aria-controls', (await menu(page).getAttribute('id'))!);
  await expect(menu(page).getByRole('menuitem')).toHaveText([PROGRESS, 'Settings', 'Sign out']);
  // The name and email say whose menu it is, from outside the menu itself.
  await expect(menu(page)).not.toContainText(user.username);
  await expect(menu(page).locator('xpath=..')).toContainText(user.username);

  // The arrows wrap; Home and End jump to the ends.
  for (const [key, name] of [
    ['ArrowDown', 'Settings'],
    ['ArrowDown', 'Sign out'],
    ['ArrowDown', PROGRESS],
    ['ArrowUp', 'Sign out'],
    ['Home', PROGRESS],
    ['End', 'Sign out'],
  ] as const) {
    await page.keyboard.press(key);
    await expect(item(page, name), key).toBeFocused();
  }
  // Escape closes it and gives focus back to the button.
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();
  await expect(anyMenu(page)).toHaveCount(0);

  // Up opens it on the last item, Down on the first, and Space on the first.
  await page.keyboard.press('ArrowUp');
  await expect(item(page, 'Sign out')).toBeFocused();
  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowDown');
  await expect(item(page, PROGRESS)).toBeFocused();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Space');
  await expect(item(page, PROGRESS)).toBeFocused();

  // Tab closes it and lets focus move on; Shift+Tab closes it with focus on the button.
  await page.keyboard.press('Tab');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).not.toBeFocused();
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(item(page, PROGRESS)).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();
});

test('choosing an item from the keys runs it: Enter and Space follow a link, and Sign out signs out', async ({ page }) => {
  const button = await home(page);

  // Enter on a link follows it; the menu closes, and focus stays on the button. Each
  // key waits for the focus the last one moved: the first item takes it a frame or two
  // after the menu opens, once the panel's fade has begun.
  await button.focus();
  await page.keyboard.press('ArrowDown');
  await expect(item(page, PROGRESS)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(item(page, 'Settings')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/settings');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();

  // Space follows a link too.
  await page.keyboard.press('ArrowDown');
  await expect(item(page, PROGRESS)).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page).toHaveURL('/progress');
  await expect(button).toHaveAttribute('aria-expanded', 'false');

  // Sign out, the last item.
  await button.focus();
  await page.keyboard.press('ArrowUp');
  await expect(item(page, 'Sign out')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(navSignIn(page)).toBeVisible();
  await expect(trigger(page)).toHaveCount(0);
});

test('a click opens it on its first item, a press outside closes it, and a press on its header keeps focus in it', async ({ page }) => {
  const button = await home(page);

  await button.click();
  await expect(item(page, PROGRESS)).toBeFocused();
  // The header (name and email) and the menu's own padding take no focus, so the keys
  // still work after a press there.
  await menu(page).locator('xpath=..').getByText(user.username, { exact: true }).click();
  await expect(item(page, PROGRESS)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(item(page, 'Settings')).toBeFocused();

  // The button closes it again, and keeps focus.
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();

  // A press outside closes it.
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await page.mouse.click(8, 500);
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(anyMenu(page)).toHaveCount(0);
});

test('a page change underneath it closes it', async ({ page }) => {
  const button = await home(page);
  // A page of the app's own, so Back stays in this document.
  await button.click();
  await item(page, 'Settings').click();
  await expect(page).toHaveURL('/settings');

  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  // Focus in the menu first, so the close below starts from there.
  await expect(item(page, PROGRESS)).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(anyMenu(page)).toHaveCount(0);
  // Focus goes back to the button, rather than staying on an item about to hide.
  await expect(button).toBeFocused();
  // And the next mouse open and close take one press each, even after a Tab.
  await page.keyboard.press('Tab');
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
});

test('Down pressed while the page chosen from it is still rendering reopens it, and it stays open', async ({ page }) => {
  const button = await home(page);
  await button.focus();
  await page.keyboard.press('ArrowDown');
  await expect(item(page, PROGRESS)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(item(page, 'Settings')).toBeFocused();
  // In one task: choose Settings, let React commit the menu's close (a microtask), and
  // press Down on the button while the Settings page, which React Router renders as a
  // transition, is still to come. The location effect used to close the menu again
  // when that page committed.
  await page.evaluate(async () => {
    const settings = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(el => el.textContent?.trim() === 'Settings')!;
    settings.click();
    await Promise.resolve();
    document.querySelector<HTMLElement>('button[aria-label="Account menu"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  });
  await expect(page.getByRole('heading', { level: 1, name: 'Account Settings' })).toBeVisible();
  // The page has rendered, and the menu is still open, with the keys working in it.
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(item(page, PROGRESS)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(item(page, 'Settings')).toBeFocused();
});

test('Escape straight after Ctrl+K from an item in the account menu gives focus to the Account menu button, which keeps it once the menu has faded', async ({ page }) => {
  const button = await home(page);
  await page.mouse.move(5, 700);
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(item(page, PROGRESS)).toBeFocused();
  // Faded in first: Ctrl+K during that fade would reverse it and shorten the fade out.
  await expect.poll(() => accountPanel(page).evaluate(el => el.getAnimations().length)).toBe(0);
  const landings = await recordLandings(page);
  // In one go, so the menu is still fading out: Ctrl+K, then Escape once the box has focus.
  const atEscape = await page.evaluate(async () => {
    const press = (init: KeyboardEventInit) =>
      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
    const box = () => document.querySelector('nav input');
    press({ key: 'k', ctrlKey: true });
    // The box takes focus from a timer.
    for (let i = 0; i < 50 && document.activeElement !== box(); i++) await new Promise(resolve => setTimeout(resolve, 0));
    const panel = document.querySelector('[role="menu"][aria-label="Account menu"]')!.parentElement!;
    const state = {
      boxFocused: document.activeElement === box(),
      fading: getComputedStyle(panel).visibility === 'visible' && panel.getAnimations().length > 0,
    };
    press({ key: 'Escape' });
    return state;
  });
  expect(atEscape, 'Escape came from the box, with the menu still fading out').toEqual({ boxFocused: true, fading: true });
  await expect(button).toBeFocused();
  await expect.poll(() => accountPanel(page).evaluate(el => getComputedStyle(el).visibility)).toBe('hidden');
  await expect(button).toBeFocused();
  expect(await landings(), 'one focus, on the Account menu button').toEqual(['Account menu']);
});

test('Escape after Ctrl+K from an item in the account menu, once the menu has faded, gives focus to the Account menu button', async ({ page }) => {
  const button = await home(page);
  await page.mouse.move(5, 700);
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(item(page, PROGRESS)).toBeFocused();
  await page.keyboard.press('Control+k');
  await expect(searchBox(page)).toBeFocused();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(() => accountPanel(page).evaluate(el => getComputedStyle(el).visibility)).toBe('hidden');
  const landings = await recordLandings(page);
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();
  await settle(page);
  expect(await landings(), 'one focus, on the Account menu button').toEqual(['Account menu']);
});

test('Sign out shows the busy pattern in the menu, which stays open until it lands, and a second press sends nothing', async ({ page }) => {
  const button = await home(page);
  const hold = await holdSignOut(page);
  await button.click();
  const signOut = item(page, 'Sign out');
  await expectBusyPattern(signOut, {
    name: 'Sign out', busyText: 'Signing out…', live: signOutLive(page),
    press: () => signOut.click(), seen: hold.seen,
  });
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(signOut).toBeFocused();
  await signOut.click();
  await settle(page);
  expect(hold.sent(), 'one sign-out, however often it was pressed').toBe(1);
  hold.release();
  await expect(navSignIn(page)).toBeVisible();
  await expect(trigger(page)).toHaveCount(0);
  await expectNoSecondSignOut(page, hold);
});

for (const [how, choose] of [
  ['the keyboard', async (page: Page) => {
    await trigger(page).focus();
    await page.keyboard.press('ArrowUp');
    await expect(item(page, 'Sign out')).toBeFocused();
    await page.keyboard.press('Enter');
  }],
  ['a click', async (page: Page) => {
    await trigger(page).click();
    await item(page, 'Sign out').click();
  }],
] as const) {
  test(`Sign out chosen by ${how} gives focus to Sign in once it lands`, async ({ page }) => {
    await home(page);
    const hold = await holdSignOut(page);
    await choose(page);
    await hold.seen;
    await expect(item(page, 'Sign out'), 'still on Sign out while it is out').toBeFocused();
    hold.release();
    await expect(navSignIn(page)).toBeFocused();
    await expect(trigger(page)).toHaveCount(0);
  });
}

for (const [where, inPanel] of [['to the bell', false], ["into the bell's panel", true]] as const) {
  test(`Sign out chosen from the account menu, with focus moved ${where} while it is out, gives focus to Sign in once it lands`, async ({ page }) => {
    await oneUnread(page);
    await home(page);
    const hold = await holdSignOut(page);
    await chooseSignOutByKeys(page);
    await hold.seen;
    // Shift+Tab closes the menu with focus on its button, and again reaches the bell.
    await page.keyboard.press('Shift+Tab');
    await expect(trigger(page)).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(bell(page)).toBeFocused();
    if (inPanel) {
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Mark all read', exact: true })).toBeFocused();
    }
    hold.release();
    await expect(navSignIn(page)).toBeFocused();
    // The bell went with the signed-in navbar, as the account menu did.
    await expect(trigger(page)).toHaveCount(0);
    await expect(bell(page)).toHaveCount(0);
  });
}

test('Sign out leaves focus where it was moved while it was out', async ({ page }) => {
  await home(page);
  const hold = await holdSignOut(page);
  await trigger(page).click();
  await item(page, 'Sign out').click();
  await hold.seen;
  const search = page.getByRole('button', { name: 'Search (Ctrl+K)', exact: true });
  await search.focus();
  const focuses = await countSignInFocus(page);
  hold.release();
  await expect(navSignIn(page)).toBeVisible();
  await settle(page);
  await expect(search).toBeFocused();
  expect(await focuses(), 'Sign in took no focus').toBe(0);
});

test('a sign-out from another tab afterwards leaves focus where it is', async ({ page, context }) => {
  await home(page);
  await trigger(page).click();
  await item(page, 'Sign out').click();
  await expect(navSignIn(page)).toBeFocused();

  // Signed in again, from the link, and in a second tab of this browser.
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(trigger(page)).toBeVisible();
  const other = await context.newPage();
  const restored = other.waitForResponse(r => r.url().includes('/api/auth/refresh') && r.status() === 200);
  await other.goto('/');
  await restored;

  // The other tab signs out, which signs this one out as well, with focus on nothing here.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const focuses = await countSignInFocus(page);
  await trigger(other).click();
  await item(other, 'Sign out').click();
  await expect(navSignIn(page)).toBeVisible();
  await settle(page);
  expect(await page.evaluate(() => document.activeElement === document.body), 'focus still on nothing').toBe(true);
  expect(await focuses(), 'Sign in took no focus').toBe(0);
});

test('Sign out from the account menu that lands after a page link was followed leaves focus on the page', async ({ page }) => {
  await page.goto(LEVEL);
  await showsLevel(page, 'Eidos 7');
  const hold = await holdSignOut(page);
  await chooseSignOutByKeys(page);
  await hold.seen;
  const focuses = await countSignInFocus(page);
  // As Safari presses it, focusing nothing: the link Chromium's click focuses
  // can live on as Xion's Next link.
  await pressAsSafari(nextLink(page));
  await showsLevel(page, 'Xion');
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(() => focusOnPage(page), 'focus on the page once the link has been followed').toBe(true);
  hold.release();
  await expect(navSignIn(page)).toBeVisible();
  await settle(page);
  expect(await focusOnPage(page), 'focus still on the page').toBe(true);
  expect(await focuses(), 'Sign in took no focus').toBe(0);
});

test("Sign out from the account menu that lands after a notification was followed from the bell's panel leaves focus on the page", async ({ page }) => {
  await oneUnread(page);
  await home(page);
  const hold = await holdSignOut(page);
  await chooseSignOutByKeys(page);
  await hold.seen;
  // Shift+Tab closes the menu with focus on its button, and again reaches the bell.
  await page.keyboard.press('Shift+Tab');
  await expect(trigger(page)).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(bell(page)).toBeFocused();
  // Into the panel, past Mark all read to the notification.
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const link = page.locator(`[id="${await bell(page).getAttribute('aria-controls')}"]`).getByRole('link');
  await expect(link).toBeFocused();
  // The link closes the panel on its way to the comment. The fade is held, so the panel still
  // shows, with focus on the link, as the sign-out lands.
  const fade = await holdBellFadeOnClose(page);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#comment-1$/);
  await expect(bell(page)).toHaveAttribute('aria-expanded', 'false');
  const held = await fade();
  expect(held?.held, 'the fade held').toBeGreaterThan(0);
  expect(held?.visibility, 'the closing panel, still shown').toBe('visible');
  await expect(link, 'focus still on the link').toBeFocused();
  const focuses = await countSignInFocus(page);
  hold.release();
  await expect(navSignIn(page)).toBeVisible();
  await settle(page);
  expect(await focuses(), 'Sign in took no focus').toBe(0);
  expect(await focusOnPage(page), 'focus on the page').toBe(true);
});

test('Sign out from the account menu, then a press on the page while it is out, leaves focus on the page', async ({ page }) => {
  await page.goto(LEVEL);
  await showsLevel(page, 'Eidos 7');
  const hold = await holdSignOut(page);
  await chooseSignOutByKeys(page);
  await hold.seen;
  const focuses = await countSignInFocus(page);
  // The heading takes no focus, so the press drops it to the page.
  await page.getByRole('heading', { level: 1, name: 'Eidos 7', exact: true }).click();
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
  expect(await focusOnPage(page), 'focus on the page after the press').toBe(true);
  hold.release();
  await expect(navSignIn(page)).toBeVisible();
  await settle(page);
  expect(await focusOnPage(page), 'focus still on the page').toBe(true);
  expect(await focuses(), 'Sign in took no focus').toBe(0);
});

for (const [where, take] of [
  ['the bell', async (page: Page) => {
    await bell(page).focus();
    await page.keyboard.press('Enter');
    await expect(bell(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(bell(page)).toBeFocused();
  }],
  ['the account menu', async (page: Page) => {
    await trigger(page).focus();
    await page.keyboard.press('ArrowDown');
    await expect(item(page, PROGRESS)).toBeFocused();
  }],
] as const) {
  test(`after another tab's sign-out took ${where} with focus in it, Sign out from the account menu, then a press on the page while it is out, leaves focus on the page`, async ({ page, context }) => {
    await page.goto(LEVEL);
    await showsLevel(page, 'Eidos 7');
    await page.mouse.move(5, 700);
    await take(page);
    // Another tab of this browser signs out, which takes this tab's signed-in controls, and
    // focus with them.
    const other = await context.newPage();
    const restored = other.waitForResponse(r => r.url().includes('/api/auth/refresh') && r.status() === 200);
    await other.goto('/');
    await restored;
    await trigger(other).click();
    await item(other, 'Sign out').click();
    await expect(navSignIn(page)).toBeVisible();
    await other.close();
    expect(await focusOnPage(page), 'focus fell to the page').toBe(true);
    // Signed in again here, from the link: the navbar stays mounted.
    await navSignIn(page).click();
    await expect(page).toHaveURL('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await showsLevel(page, 'Eidos 7');
    await expect(trigger(page)).toBeVisible();
    const hold = await holdSignOut(page);
    await chooseSignOutByKeys(page);
    await hold.seen;
    const focuses = await countSignInFocus(page);
    // The heading takes no focus, so the press drops it to the page.
    await page.getByRole('heading', { level: 1, name: 'Eidos 7', exact: true }).click();
    expect(await focusOnPage(page), 'focus on the page after the press').toBe(true);
    hold.release();
    await expect(navSignIn(page)).toBeVisible();
    await settle(page);
    expect(await focusOnPage(page), 'focus still on the page').toBe(true);
    expect(await focuses(), 'Sign in took no focus').toBe(0);
  });
}

test('Sign out from the account menu, then Back while it is out, gives focus to Sign in once it lands', async ({ page }) => {
  await page.goto(LEVEL);
  await showsLevel(page, 'Eidos 7');
  // A page of the app's own, so Back stays in this document.
  await nextLink(page).click();
  await showsLevel(page, 'Xion');
  const hold = await holdSignOut(page);
  await chooseSignOutByKeys(page);
  await hold.seen;
  await page.goBack();
  await showsLevel(page, 'Eidos 7');
  // Back's close gives focus to the button, which goes with the signed-in navbar.
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger(page)).toBeFocused();
  hold.release();
  await expect(navSignIn(page)).toBeFocused();
  await expect(trigger(page)).toHaveCount(0);
});

test('in the drawer, Sign out shows the busy pattern, the drawer stays open until it lands, and a second press sends nothing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Toggle menu' });
  const drawer = page.locator('#mobile-menu');
  await toggle.click();
  const signOut = drawer.getByRole('button', { name: 'Sign out', exact: true });
  await expect(signOut).toBeVisible();
  const hold = await holdSignOut(page);
  await expectBusyPattern(signOut, {
    name: 'Sign out', busyText: 'Signing out…', live: signOutLive(page),
    press: () => signOut.click(), seen: hold.seen,
  });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await signOut.click();
  await settle(page);
  expect(hold.sent(), 'one sign-out, however often it was pressed').toBe(1);
  hold.release();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(drawer.getByRole('link', { name: 'Sign in', exact: true })).toBeAttached();
  await expectNoSecondSignOut(page, hold);
});

for (const [how, press] of [
  ['a click', async (signOut: Locator) => { await signOut.click(); }],
  ['the keyboard', async (signOut: Locator) => { await signOut.focus(); await signOut.press('Enter'); }],
] as const) {
  test(`in the drawer, Sign out by ${how} gives focus back to the menu button once it lands`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Toggle menu' });
    const drawer = page.locator('#mobile-menu');
    await toggle.click();
    const signOut = drawer.getByRole('button', { name: 'Sign out', exact: true });
    await expect(signOut).toBeVisible();
    const hold = await holdSignOut(page);
    await press(signOut);
    await hold.seen;
    await expect(signOut, 'still in the drawer while it is out').toBeFocused();
    hold.release();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });
}

test('in the drawer, Sign out pressed as Safari does gives focus back to the menu button once it lands', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Toggle menu' });
  const drawer = page.locator('#mobile-menu');
  await toggle.click();
  const signOut = drawer.getByRole('button', { name: 'Sign out', exact: true });
  await expect(signOut).toBeVisible();
  const hold = await holdSignOut(page);
  await pressAsSafari(signOut);
  await hold.seen;
  expect(await focusOnPage(page), 'focus on nothing while it is out').toBe(true);
  hold.release();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
});

test('in the drawer, a Sign out that lands after a drawer link has closed the drawer leaves focus on the page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(LEVEL);
  await showsLevel(page, 'Eidos 7');
  const toggle = page.getByRole('button', { name: 'Toggle menu' });
  const drawer = page.locator('#mobile-menu');
  await toggle.click();
  const signOut = drawer.getByRole('button', { name: 'Sign out', exact: true });
  await expect(signOut).toBeVisible();
  const hold = await holdSignOut(page);
  await signOut.click();
  await hold.seen;
  const focuses = await countMenuButtonFocus(page);
  await drawer.getByRole('link', { name: 'Xion', exact: true }).click();
  await showsLevel(page, 'Xion');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(() => focusOnPage(page), 'focus on the page once the link has closed the drawer').toBe(true);
  hold.release();
  await expect(drawer.getByRole('link', { name: 'Sign in', exact: true })).toBeAttached();
  await settle(page);
  expect(await focusOnPage(page), 'focus still on the page').toBe(true);
  expect(await focuses(), 'the menu button took no focus').toBe(0);
});

test('in the drawer, a Sign out pressed as Safari does, then Back while it is out, leaves focus on the page once it lands', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(LEVEL);
  await showsLevel(page, 'Eidos 7');
  // A page of the app's own, so Back stays in this document.
  await nextLink(page).click();
  await showsLevel(page, 'Xion');
  const toggle = page.getByRole('button', { name: 'Toggle menu' });
  const drawer = page.locator('#mobile-menu');
  await toggle.click();
  const signOut = drawer.getByRole('button', { name: 'Sign out', exact: true });
  await expect(signOut).toBeVisible();
  const hold = await holdSignOut(page);
  await pressAsSafari(signOut);
  await hold.seen;
  expect(await focusOnPage(page), 'focus on nothing while it is out').toBe(true);
  const focuses = await countMenuButtonFocus(page);
  await page.goBack();
  await showsLevel(page, 'Eidos 7');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  hold.release();
  await expect(drawer.getByRole('link', { name: 'Sign in', exact: true })).toBeAttached();
  await settle(page);
  expect(await focusOnPage(page), 'focus still on the page').toBe(true);
  expect(await focuses(), 'the menu button took no focus').toBe(0);
});

test("an admin's menu holds Admin between Settings and Sign out, and the keys reach it", async ({ page }) => {
  expect(await setUserRole(user.username, 'admin')).toBe(true);
  const button = await home(page);

  await button.focus();
  await page.keyboard.press('ArrowUp');
  await expect(item(page, 'Sign out')).toBeFocused();
  await expect(menu(page).getByRole('menuitem')).toHaveText([PROGRESS, 'Settings', ADMIN_COPY.navLink, 'Sign out']);
  await page.keyboard.press('ArrowUp');
  await expect(item(page, ADMIN_COPY.navLink)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/admin');
  await expect(page.getByRole('heading', { level: 1, name: ADMIN_COPY.pageHeading, exact: true })).toBeVisible();
});

test('the item with focus shows it, the current page included, and forced colors still outline it', async ({ page }) => {
  await page.goto('/settings');
  await expect(trigger(page)).toBeVisible();
  // Colours as they settle: the items fade between looks over 200ms.
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
  const look = (name: string | RegExp) => item(page, name).evaluate(el => {
    const s = getComputedStyle(el);
    return {
      text: s.color, bar: s.borderLeftColor, fill: s.backgroundColor,
      outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`, offset: s.outlineOffset,
    };
  });

  await trigger(page).focus();
  await page.keyboard.press('ArrowDown');
  await expect(item(page, PROGRESS)).toBeFocused();
  // Focus lights an item as hover does: its text, its bar and its fill all change, and
  // no outline is drawn.
  const idle = await look('Sign out');
  const focused = await look(PROGRESS);
  expect(focused.text, 'text').not.toBe(idle.text);
  expect(focused.bar, 'bar').not.toBe(idle.bar);
  expect(focused.fill, 'fill').not.toBe(idle.fill);
  expect(focused.outline).toMatch(/^none /);

  // The current page's item, Settings here, already wears the highlight: focus draws
  // a white ring inside it and turns its text white, keeping its cyan bar.
  const current = await look('Settings');
  expect(current.outline).toMatch(/^none /);
  await page.keyboard.press('ArrowDown');
  await expect(item(page, 'Settings')).toBeFocused();
  const currentFocused = await look('Settings');
  expect(currentFocused.outline).toBe('solid 2px rgb(255, 255, 255)');
  expect(currentFocused.offset, 'inside the item, clear of its bar').toBe('-4px');
  expect(currentFocused.text).toBe('rgb(255, 255, 255)');
  expect(currentFocused.bar, 'bar').toBe(current.bar);

  // outline-hidden, not outline-none: forced colors still outlines the other items.
  await page.keyboard.press('ArrowUp');
  await expect(item(page, PROGRESS)).toBeFocused();
  // It sits inside the item, where the panel's overflow-hidden can't clip its sides.
  await page.emulateMedia({ forcedColors: 'active' });
  expect(await item(page, PROGRESS).evaluate(el => {
    const s = getComputedStyle(el);
    return [s.outlineStyle, s.outlineWidth, s.outlineOffset];
  })).toEqual(['solid', '2px', '-4px']);
});
