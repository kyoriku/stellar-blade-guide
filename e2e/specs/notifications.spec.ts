import { test, expect, type Page } from '@playwright/test';
import { readFixtures, createCommentThread, deleteFixtureComments, insertReplyNotification, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { expectBusyPattern } from '../helpers/busy';
import { holdRoute } from '../helpers/route';

// The bell (components/NotificationBell.tsx) says whether its panel is open. Its Mark
// all read shows the busy pattern (helpers/busy.ts) while its request is out, a second
// press meanwhile sends nothing, a refusal is shown rather than passing silently, and a
// success is read out, with focus kept in the panel as the button goes.

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
});
