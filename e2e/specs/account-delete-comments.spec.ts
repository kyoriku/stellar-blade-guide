import { test, expect, type Page } from '@playwright/test';
import { readFixtures, insertComment, commentRows, deleteFixtureComments, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';

// Deleting an account erases each of its comments as deleting that comment would:
// the text goes, a comment with a reply still up shows as "[deleted]", any other
// leaves the page, and each keeps its own last-changed time. Before, the text stayed,
// and deleting the user had SQLAlchemy clear user_id with an UPDATE that the column's
// onupdate stamped with one time, the moment of deletion, which tied them together in
// the comment data anyone can load.

let fx: Fixtures;

type Listed = { id: number; body: string; user: { username: string } | null; replies?: { id: number; body: string }[] };

test.describe('deleting an account', () => {
  let ipA: string;
  let ipB: string;
  let a: TestUser;
  let b: TestUser;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ipA = nextTestIp();
    ipB = nextTestIp();
    // The page's own requests count against b's address; each API call below names its own.
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ipB });
    a = makeUser(fx.token, 'erasea');
    b = makeUser(fx.token, 'eraseb');
    await apiRegister(page, a, ipA);
    await apiRegister(page, b, ipB);
  });

  test.afterEach(async ({ page }) => {
    await deleteFixtureComments(fx);
    await apiDeleteUser(page, a, ipA); // already gone unless the test failed before deleting it
    await apiDeleteUser(page, b, ipB);
  });

  // A comment's own block is its first child; its replies come after.
  const own = (page: Page, id: number) => page.locator(`#comment-${id}`).locator(':scope > div').first();

  test('erases its comments, and each keeps its own last-changed time', async ({ page }) => {
    const text = (name: string) => `E2E ${fx.token} ${name}`;
    const at = (day: number, hour: number) => `2026-01-0${day}T${hour}:00:00Z`;
    const thread = await insertComment(fx, { username: a.username, body: text('a thread'), postedAt: at(1, 12), changedAt: at(1, 13) });
    const lone = await insertComment(fx, { username: a.username, body: text('a lone'), postedAt: at(2, 12), changedAt: at(2, 14) });
    const bTop = await insertComment(fx, { username: b.username, body: text('b top'), postedAt: at(3, 12), changedAt: at(3, 15) });
    const bReply = await insertComment(fx, { username: b.username, body: text('b reply'), parentId: thread, postedAt: at(4, 12), changedAt: at(4, 16) });
    const aReply = await insertComment(fx, { username: a.username, body: text('a reply'), parentId: bTop, postedAt: at(5, 12), changedAt: at(5, 17) });
    const aIds = [thread, lone, aReply];
    const bIds = [bTop, bReply];
    const before = await commentRows([...aIds, ...bIds]);
    expect(before.get(lone)!.body).toBe(text('a lone'));

    expect(await apiDeleteUser(page, a, ipA)).toBe(true);

    // Stored: a's comments erased and linked to no account, each time as it was; b's untouched.
    const after = await commentRows([...aIds, ...bIds]);
    for (const id of aIds) {
      expect(after.get(id), `comment ${id}`).toEqual({ ...before.get(id)!, userId: null, isDeleted: true, body: '[deleted]' });
    }
    for (const id of bIds) expect(after.get(id), `comment ${id}`).toEqual(before.get(id));

    // The comment data anyone can load: a's comment that b replied to shows "[deleted]"
    // with no author, and the reply stays; a's lone comment and a's reply are gone.
    const res = await page.request.get(`/api/comments/walkthrough/${fx.walkthroughId}`, {
      headers: { [TEST_IP_HEADER]: ipB },
    });
    expect(res.status()).toBe(200);
    const listed = (await res.json()) as Listed[];
    const shape = listed.map(c => [c.id, c.body, c.user?.username ?? null, (c.replies ?? []).map(r => [r.id, r.body])]);
    expect(shape).toEqual([
      [thread, '[deleted]', null, [[bReply, text('b reply')]]],
      [bTop, text('b top'), b.username, []],
    ]);
    const raw = JSON.stringify(listed);
    for (const name of ['a thread', 'a lone', 'a reply']) expect(raw).not.toContain(text(name));

    // The page.
    await page.goto(`/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`);
    await expect(own(page, thread).locator('p', { hasText: '[deleted]' })).toBeVisible();
    await expect(own(page, bReply)).toContainText(text('b reply'));
    await expect(own(page, bTop)).toContainText(text('b top'));
    await expect(page.locator(`#comment-${lone}`)).toHaveCount(0);
    await expect(page.locator(`#comment-${aReply}`)).toHaveCount(0);
    for (const name of ['a thread', 'a lone', 'a reply']) await expect(page.getByText(text(name))).toHaveCount(0);
  });

  test("the deleting browser doesn't keep showing the account's comments from its cache", async ({ page }) => {
    // A comment list stays fresh in the cache for five minutes, so going back to a page
    // read just before the deletion would show the comments as they were, text and all.
    const text = (name: string) => `E2E ${fx.token} ${name}`;
    const thread = await insertComment(fx, { username: a.username, body: text('a thread'), postedAt: '2026-01-01T12:00:00Z', changedAt: '2026-01-01T13:00:00Z' });
    const bReply = await insertComment(fx, { username: b.username, body: text('b reply'), parentId: thread, postedAt: '2026-01-02T12:00:00Z', changedAt: '2026-01-02T13:00:00Z' });
    // Signed in as a: the login sets a's refresh cookie, and the hint makes the page use it.
    const login = await page.request.post('/api/auth/login', {
      data: { email: a.email, password: a.password },
      headers: { [TEST_IP_HEADER]: ipA },
    });
    expect(login.status()).toBe(200);
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));

    await page.goto(`/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`);
    await expect(own(page, thread)).toContainText(text('a thread'));

    // To Settings and back with no reload, as someone checking their comments would go.
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('link', { name: 'Settings' }).filter({ visible: true }).click();
    await page.getByLabel(`Type ${a.username} to confirm`, { exact: true }).fill(a.username);
    const signedOut = page.waitForResponse(r => new URL(r.url()).pathname === '/api/auth/logout');
    await page.getByRole('button', { name: 'Delete my account' }).click();
    await signedOut;
    // The deletion lands on the home page in place of Settings, so one step back is the
    // thread, with no reload.
    await expect(page).toHaveURL('/');
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/walkthroughs/e2e-fixture/${fx.walkthroughSlug}$`));

    await expect(own(page, thread).locator('p', { hasText: '[deleted]' })).toBeVisible();
    await expect(own(page, bReply)).toContainText(text('b reply'));
    await expect(page.getByText(text('a thread'))).toHaveCount(0);
  });
});
