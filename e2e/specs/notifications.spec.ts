import { test, expect, type Page } from '@playwright/test';
import { readFixtures, createCommentThread, deleteFixtureComments, insertReplyNotification, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { expectBusyPattern } from '../helpers/busy';

// The bell (components/NotificationBell.tsx) says whether its panel is open. Its Mark
// all read shows the busy pattern (helpers/busy.ts) while its request is out, a second
// press meanwhile sends nothing, and a refusal is shown rather than passing silently.

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
