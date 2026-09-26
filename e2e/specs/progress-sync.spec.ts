import { test, expect, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';

let fx: Fixtures;

const toggleBtn = (page: Page) =>
  page.locator(`article#collectible-${fx.collectibleId}`).getByRole('button', { name: /Mark as/ });

/**
 * The guest-to-account merge: a visitor ticks a box signed out, signs in to
 * keep it, and must see it at once. The sign-in commit fires GET /progress and
 * the stats query before the provider POSTs the guest ids, so without the
 * post-sync refetch the cached pre-merge set reads "0 of N" until its staleTime
 * lapses, on the page that just asked the user to trust it with their progress.
 */
test.describe('guest progress survives sign-in', () => {
  let ip: string;
  let user: TestUser;
  let seq = 0;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ 'x-real-ip': ip });
    user = makeUser(fx.token, `gs${++seq}`);
    await apiRegister(page, user, ip);
    // Registration set a refresh cookie; clear it so the tab starts as a guest.
    await context.clearCookies();
  });

  test.afterEach(async ({ page }) => {
    await apiDeleteUser(page, user, ip);
  });

  /** Tick the fixture as a guest, get bounced from /progress, sign in. Returns a live GET counter. */
  async function tickAsGuestThenSignIn(page: Page): Promise<() => number> {
    let progressGets = 0;
    page.on('response', (r) => {
      if (r.url().endsWith('/api/progress') && r.request().method() === 'GET' && r.status() === 200) {
        progressGets += 1;
      }
    });

    await page.goto('/levels/eidos-7');
    await toggleBtn(page).click();
    await expect(toggleBtn(page)).toHaveAccessibleName('Mark as not found');
    expect(await page.evaluate(() => localStorage.getItem('sb_progress'))).toContain(String(fx.collectibleId));
    expect(progressGets).toBe(0); // a guest fires no progress request

    // The guard bounces a guest to /login with the return path, so a sign-in lands back on /progress.
    await page.goto('/progress');
    await expect(page).toHaveURL(/\/login/);
    const synced = page.waitForResponse(
      (r) => r.url().endsWith('/api/progress/sync') && r.status() === 200
    );
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await synced;
    return () => progressGets;
  }

  async function expectMergedSetEverywhere(page: Page, gets: () => number): Promise<void> {
    await expect(page).toHaveURL(/\/progress$/);
    // Well inside the 5-minute staleTime, so only a real refetch can produce this.
    await expect(page.getByText(/^1 of [\d.,\s]+ collectibles found$/)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('sb_progress'))).toBeNull();

    // An in-app link, so the query cache survives: the level page must read the
    // merged set, which pins the progress refetch apart from the stats one.
    await page.getByRole('link', { name: 'Eidos 7', exact: true }).click();
    await expect(toggleBtn(page)).toHaveAccessibleName('Mark as not found');
    // The sign-in commit's GET plus the post-sync refetch.
    expect(gets()).toBeGreaterThanOrEqual(2);
  }

  test('the box ticked as a guest is found right after signing in, with no reload', async ({ page }) => {
    const gets = await tickAsGuestThenSignIn(page);
    await expectMergedSetEverywhere(page, gets);
  });

  test('the merged set shows even when the stale first load answers after the sync', async ({ page }) => {
    // The failure needs a precise order: the server answers the first GET before
    // it processes the sync, but the browser receives that pre-merge answer only
    // after the sync has responded and the provider has reacted to it. Without
    // the cancel, the invalidate is absorbed by that in-flight load and its stale
    // answer is then stamped fresh. Every hold below is explicit, none is timed.
    let firstGetSeen = false;
    let staleAnswerReady: () => void = () => {};
    const staleAnswer = new Promise<void>((resolve) => { staleAnswerReady = resolve; });
    let syncDone: () => void = () => {};
    const syncResponded = new Promise<void>((resolve) => { syncDone = resolve; });

    await page.route(
      (url) => url.pathname === '/api/progress/sync',
      async (route) => {
        await staleAnswer; // the server has already answered the first GET
        await route.fulfill({ response: await route.fetch() });
        syncDone();
      }
    );
    await page.route(
      (url) => url.pathname === '/api/progress',
      async (route) => {
        // Only the first GET is held; the refetch passes straight through.
        if (route.request().method() !== 'GET' || firstGetSeen) return route.continue();
        firstGetSeen = true;
        const stale = await route.fetch(); // server truth before the merge: nothing found
        staleAnswerReady();
        await syncResponded;
        // The provider clears sb_progress in the same tick it cancels and
        // invalidates, so once that is observable the stale answer can only land
        // on a cancelled load (or, without the cancel, expose the bug).
        await page.waitForFunction(() => localStorage.getItem('sb_progress') === null);
        await route.fulfill({ response: stale });
      }
    );

    const gets = await tickAsGuestThenSignIn(page);
    await expectMergedSetEverywhere(page, gets);
  });
});
