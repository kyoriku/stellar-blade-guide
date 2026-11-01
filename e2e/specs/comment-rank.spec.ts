import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import {
  readFixtures, insertComment, commentRows, deleteFixtureComments, redisClient,
  setUserRole, setUserActive, userRow, type Fixtures,
} from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiDeleteUser, type TestUser } from '../helpers/auth';
import { holdRoute } from '../helpers/route';

// Comment deletion by rank (server/app/core/roles.py, mirrored by client/src/utils/roles.ts):
// you can delete your own comment, or one whose author's current role ranks below yours,
// and only the author edits. The page shows Delete only where the server would take it,
// and when the two disagree (a role changed after the page loaded), the server's refusal
// brings the page back in line. Each test signs one viewer in on its page; the other
// authors register through the test's request context, a cookie jar of its own, so the
// page keeps the viewer's session. Roles are set by SQL, as the real admin's was.

type Role = 'user' | 'moderator' | 'admin';
const ROLES: Role[] = ['user', 'moderator', 'admin'];

// Whether a viewer of each role sees Delete on someone else's comment by each role.
const CAN_DELETE: Record<Role, Record<Role, boolean>> = {
  user: { user: false, moderator: false, admin: false },
  moderator: { user: true, moderator: false, admin: false },
  admin: { user: true, moderator: true, admin: false },
};

let fx: Fixtures;

interface Account extends TestUser {
  ip: string; // its own address, for its registration and its cleanup
  id: number;
  commentId: number; // its one comment on the fixture walkthrough
}

// Every account the running test made, swept after it.
let made: Account[] = [];

// An account with the role and one comment. Registering through `request` sets that
// context's cookie, which for a viewer is the page's.
async function account(request: APIRequestContext, name: string, role: Role): Promise<Account> {
  const user = makeUser(fx.token, name);
  const ip = nextTestIp();
  const res = await request.post('/api/auth/register', { data: user, headers: { [TEST_IP_HEADER]: ip } });
  expect(res.status(), await res.text()).toBe(201);
  const row = await userRow(user.username);
  const created: Account = { ...user, ip, id: row!.id, commentId: 0 };
  made.push(created);
  if (role !== 'user') expect(await setUserRole(user.username, role)).toBe(true);
  // A minute apart, so the thread lists them in the order they were made.
  const at = new Date(Date.UTC(2026, 0, 1, 12, made.length)).toISOString();
  created.commentId = await insertComment(fx, { username: user.username, body: `E2E ${fx.token} by ${name}`, postedAt: at, changedAt: at });
  return created;
}

// Every refresh key the account has: its session families and their tokens.
async function sessionKeys(uid: number): Promise<string[]> {
  const redis = redisClient();
  try {
    const found: string[] = [];
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', `refresh:${uid}:*`, 'COUNT', 200);
      cursor = next;
      found.push(...keys);
    } while (cursor !== '0');
    return found;
  } finally {
    redis.disconnect();
  }
}

// A comment's own block is its first child; replies would come after.
const own = (page: Page, a: Account) => page.locator(`#comment-${a.commentId}`).locator(':scope > div').first();
const action = (page: Page, a: Account, name: 'Reply' | 'Edit' | 'Delete') => own(page, a).getByRole('button', { name, exact: true });
const dialog = (page: Page) => page.getByRole('alertdialog', { name: 'Delete comment' });
const confirmDelete = (page: Page) => dialog(page).getByRole('button', { name: 'Delete', exact: true });
const heading = (page: Page) => page.getByRole('heading', { name: /^Comments/ });
// Results are toasts; the toast container is the page's only role="status".
const toast = (page: Page, text: string) => page.getByRole('status').getByText(text, { exact: true });
const REFUSED = 'Cannot delete this comment';
// What the client shows for any 5xx (readError in client/src/services/api.ts).
const SERVER_ERROR = 'Something went wrong on our end. Please try again later.';

// The viewer signs in on the page from its own address. Their own Edit shows once the
// session and the thread have both loaded, so a missing Delete after it is a decision.
async function openAs(page: Page, viewer: Account): Promise<void> {
  await page.context().setExtraHTTPHeaders({ [TEST_IP_HEADER]: viewer.ip });
  await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  await page.goto(`/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`);
  await expect(action(page, viewer, 'Edit')).toBeVisible();
}

async function isDeleted(a: Account): Promise<boolean> {
  return (await commentRows([a.commentId])).get(a.commentId)!.isDeleted;
}

test.beforeAll(() => {
  fx = readFixtures();
});

test.beforeEach(async ({ context }) => {
  made = [];
  // A private address for anything the page asks before a test names its own.
  await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
});

test.afterEach(async ({ page }) => {
  await deleteFixtureComments(fx);
  const accounts = made;
  made = [];
  for (const a of accounts) {
    // A plain active account again, so its own deletion route takes it: an admin's is refused.
    await setUserRole(a.username, 'user');
    await setUserActive(a.username, true);
    await apiDeleteUser(page, a, a.ip);
  }
  // Nothing a test made outlives it: no account, and no session in Redis.
  for (const a of accounts) {
    expect(await userRow(a.username), `${a.username} was left behind`).toBeNull();
    expect(await sessionKeys(a.id), `${a.username}'s sessions were left behind`).toEqual([]);
  }
});

test.describe('who sees Delete', () => {
  for (const viewerRole of ROLES) {
    test(`${viewerRole === 'admin' ? 'an' : 'a'} ${viewerRole} sees Delete on their own comment and on those ranked below theirs, and Edit only on their own`, async ({ page, request }) => {
      const authors: Record<Role, Account> = {
        user: await account(request, 'rku', 'user'),
        moderator: await account(request, 'rkm', 'moderator'),
        admin: await account(request, 'rka', 'admin'),
      };
      const viewer = await account(page.request, `rkv${viewerRole[0]}`, viewerRole);
      await openAs(page, viewer);

      await expect(action(page, viewer, 'Delete')).toBeVisible();
      for (const role of ROLES) {
        const author = authors[role];
        // Reply shows on every comment for anyone signed in, so the row is there.
        await expect(action(page, author, 'Reply'), role).toBeVisible();
        await expect(action(page, author, 'Delete'), role).toHaveCount(CAN_DELETE[viewerRole][role] ? 1 : 0);
        await expect(action(page, author, 'Edit'), role).toHaveCount(0);
      }
    });
  }
});

test.describe('when the page and the server disagree', () => {
  test('a moderator demoted after the page loaded is refused, focus goes to the heading, and Delete goes once the session catches up', async ({ page, request }) => {
    const author = await account(request, 'rku', 'user');
    const viewer = await account(page.request, 'rkm', 'moderator');
    await openAs(page, viewer);
    await expect(action(page, author, 'Delete')).toBeVisible();

    expect(await setUserRole(viewer.username, 'user')).toBe(true);
    const refresh = await holdRoute(page, '**/api/auth/refresh');
    await action(page, author, 'Delete').click();
    await confirmDelete(page).click();
    await expect(dialog(page).getByRole('alert')).toHaveText(REFUSED);
    // The refusal asked for the session again.
    await refresh.seen;

    await dialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog(page)).toHaveCount(0);
    // Focus follows the outcome: Delete is still there while the session is held, but
    // the refresh is about to take it, so the heading has focus already.
    await expect(action(page, author, 'Delete')).toBeVisible();
    await expect(heading(page)).toBeFocused();

    refresh.release();
    await expect(action(page, author, 'Delete')).toHaveCount(0);
    await expect(heading(page)).toBeFocused();
    // Still signed in, and still free to delete their own.
    await expect(action(page, viewer, 'Delete')).toBeVisible();
    expect(await isDeleted(author)).toBe(false);
  });

  test('a refusal that lands after the browser closed the dialog is a toast, and focus goes to the heading', async ({ page, request }) => {
    const author = await account(request, 'rku', 'user');
    const viewer = await account(page.request, 'rkm', 'moderator');
    await openAs(page, viewer);
    await expect(action(page, author, 'Delete')).toBeVisible();

    expect(await setUserRole(viewer.username, 'user')).toBe(true);
    const del = await holdRoute(page, `**/api/comments/${author.commentId}`);
    const refresh = await holdRoute(page, '**/api/auth/refresh');
    await action(page, author, 'Delete').click();
    await confirmDelete(page).click();
    await del.seen;
    // Chrome's close watcher can force a close mid-delete; headless Chromium never
    // does, so the test closes it the same way.
    await dialog(page).evaluate(d => (d as HTMLDialogElement).close());
    await expect(dialog(page)).toHaveCount(0);
    await expect(action(page, author, 'Delete')).toBeFocused();

    del.release();
    await expect(toast(page, REFUSED)).toBeVisible();
    await refresh.seen;
    await expect(action(page, author, 'Delete')).toBeVisible();
    await expect(heading(page)).toBeFocused();

    refresh.release();
    await expect(action(page, author, 'Delete')).toHaveCount(0);
    await expect(heading(page)).toBeFocused();
    expect(await isDeleted(author)).toBe(false);
  });

  test("a user promoted after the page loaded is refused to a moderator, and the reloaded thread drops their Delete", async ({ page, request }) => {
    const author = await account(request, 'rku', 'user');
    const viewer = await account(page.request, 'rkm', 'moderator');
    await openAs(page, viewer);
    await expect(action(page, author, 'Delete')).toBeVisible();
    await expect(own(page, author).getByText('moderator', { exact: true })).toHaveCount(0);

    expect(await setUserRole(author.username, 'moderator')).toBe(true);
    await action(page, author, 'Delete').click();
    await confirmDelete(page).click();
    await expect(dialog(page).getByRole('alert')).toHaveText(REFUSED);
    // The refusal reloads the thread: the author's new badge shows and their Delete
    // goes, while the dialog stays open on its error.
    await expect(own(page, author).getByText('moderator', { exact: true })).toBeVisible();
    await expect(action(page, author, 'Delete')).toHaveCount(0);
    await expect(dialog(page)).toBeVisible();

    await dialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(heading(page)).toBeFocused();
    expect(await isDeleted(author)).toBe(false);
  });

  test('a refusal still sends focus to the heading when a second try in the same dialog fails another way', async ({ page, request }) => {
    const author = await account(request, 'rku', 'user');
    const viewer = await account(page.request, 'rkm', 'moderator');
    await openAs(page, viewer);
    await expect(action(page, author, 'Delete')).toBeVisible();

    expect(await setUserRole(viewer.username, 'user')).toBe(true);
    const refresh = await holdRoute(page, '**/api/auth/refresh');
    await action(page, author, 'Delete').click();
    await confirmDelete(page).click();
    await expect(dialog(page).getByRole('alert')).toHaveText(REFUSED);

    // The second try meets a server error instead.
    await page.route(`**/api/comments/${author.commentId}`, route => route.fulfill({ status: 500, json: { detail: 'boom' } }));
    await confirmDelete(page).click();
    await expect(dialog(page).getByRole('alert')).toHaveText(SERVER_ERROR);
    await dialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog(page)).toHaveCount(0);
    // The first refusal's refresh is still to land and take Delete away.
    await expect(action(page, author, 'Delete')).toBeVisible();
    await expect(heading(page)).toBeFocused();

    refresh.release();
    await expect(action(page, author, 'Delete')).toHaveCount(0);
    await expect(heading(page)).toBeFocused();
  });

  test("a dialog opened again before the refusal's refresh lands gives focus to the heading once that refresh takes Delete", async ({ page, request }) => {
    const author = await account(request, 'rku', 'user');
    const viewer = await account(page.request, 'rkm', 'moderator');
    await openAs(page, viewer);
    await expect(action(page, author, 'Delete')).toBeVisible();

    expect(await setUserRole(viewer.username, 'user')).toBe(true);
    const refresh = await holdRoute(page, '**/api/auth/refresh');
    await action(page, author, 'Delete').click();
    await confirmDelete(page).click();
    await expect(dialog(page).getByRole('alert')).toHaveText(REFUSED);
    await dialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(heading(page)).toBeFocused();

    // Opened again while the session is held. The refresh then takes Delete away under
    // the open dialog, which no longer remembers the refusal.
    await action(page, author, 'Delete').click();
    await expect(dialog(page)).toBeVisible();
    refresh.release();
    await expect(action(page, author, 'Delete')).toHaveCount(0);
    await dialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(heading(page)).toBeFocused();
  });

  test('a refusal that lands after the browser closed the dialog leaves focus where the user moved it', async ({ page, request }) => {
    const author = await account(request, 'rku', 'user');
    const viewer = await account(page.request, 'rkm', 'moderator');
    await openAs(page, viewer);
    await expect(action(page, author, 'Delete')).toBeVisible();

    expect(await setUserRole(viewer.username, 'user')).toBe(true);
    const del = await holdRoute(page, `**/api/comments/${author.commentId}`);
    await action(page, author, 'Delete').click();
    await confirmDelete(page).click();
    await del.seen;
    await dialog(page).evaluate(d => (d as HTMLDialogElement).close());
    await expect(dialog(page)).toHaveCount(0);
    // While it runs, they start writing a comment; the refusal must not pull them away.
    const box = page.getByPlaceholder('Share your thoughts, tips, or questions...');
    await box.click();
    await expect(box).toBeFocused();

    del.release();
    await expect(toast(page, REFUSED)).toBeVisible();
    await expect(action(page, author, 'Delete')).toHaveCount(0);
    await expect(box).toBeFocused();
  });
});

test("a moderator deletes a user's comment", async ({ page, request }) => {
  const author = await account(request, 'rku', 'user');
  const viewer = await account(page.request, 'rkm', 'moderator');
  await openAs(page, viewer);

  await action(page, author, 'Delete').click();
  await confirmDelete(page).click();
  await expect(dialog(page)).toHaveCount(0);
  // It had no replies, so it leaves the thread.
  await expect(page.locator(`#comment-${author.commentId}`)).toHaveCount(0);
  await expect(heading(page)).toBeFocused();
  const row = (await commentRows([author.commentId])).get(author.commentId)!;
  expect([row.isDeleted, row.body]).toEqual([true, '[deleted]']);
});

test('a delete that fails another way keeps focus on Delete and asks for nothing again', async ({ page, request }) => {
  const author = await account(request, 'rku', 'user');
  const viewer = await account(page.request, 'rkm', 'moderator');
  await openAs(page, viewer);
  const asked: string[] = [];
  page.on('request', r => {
    const path = new URL(r.url()).pathname;
    if (path === '/api/auth/refresh' || path.startsWith('/api/comments/walkthrough/')) asked.push(`${r.method()} ${path}`);
  });

  // A server error, then a comment someone else deleted meanwhile.
  for (const [status, shown] of [[500, SERVER_ERROR], [404, 'Comment not found']] as const) {
    await page.route(`**/api/comments/${author.commentId}`, route => route.fulfill({ status, json: { detail: 'Comment not found' } }), { times: 1 });
    await action(page, author, 'Delete').click();
    await confirmDelete(page).click();
    await expect(dialog(page).getByRole('alert'), String(status)).toHaveText(shown);
    await dialog(page).getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(action(page, author, 'Delete'), String(status)).toBeFocused();
  }
  // A refusal asks for the session and the thread again before its error shows.
  expect(asked).toEqual([]);
  expect(await isDeleted(author)).toBe(false);
});

test('the role badge shows only for moderators and admins, so a role typed by hand shows none', async ({ page, request }) => {
  const plain = await account(request, 'rku', 'user');
  const mod = await account(request, 'rkm', 'moderator');
  const admin = await account(request, 'rka', 'admin');
  const typed = await account(request, 'rkt', 'user');
  expect(await setUserRole(typed.username, 'Admin')).toBe(true);

  // Signed out: everyone sees the badges.
  await page.goto(`/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`);
  await expect(own(page, typed)).toBeVisible();
  const badge = (a: Account, text: string) => own(page, a).getByText(text, { exact: true });
  await expect(badge(mod, 'moderator')).toBeVisible();
  await expect(badge(admin, 'admin')).toBeVisible();
  await expect(badge(plain, 'user')).toHaveCount(0);
  await expect(badge(typed, 'Admin')).toHaveCount(0);
});
