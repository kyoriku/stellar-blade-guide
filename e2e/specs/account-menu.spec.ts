import { test, expect, type Locator, type Page } from '@playwright/test';
import { readFixtures, setUserRole, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { ADMIN_COPY } from '../../client/src/constants/adminCopy';
import { expectBusyPattern } from '../helpers/busy';

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
