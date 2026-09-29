import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { readFixtures, redisClient, type Fixtures } from '../helpers/db';
import { nextTestIp, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';

// Every tab of one browser shares the refresh cookie but keeps its own session in
// memory. Signing out in one tab must sign the others out at once, a refresh in
// flight in another tab must land before the sign-out rather than after it, and a
// sign-out elsewhere is never reported as an expired session.

// Must match REFRESH_LOCK in client/src/utils/refreshLock.ts.
const REFRESH_LOCK = 'sb_auth_refresh';
// Must match SESSION_FLAG in client/src/context/AuthContext.tsx.
const SESSION_FLAG = 'sb_has_session';
const EXPIRED_TOAST = 'Your session expired. Please log in again.';
const SIGNED_OUT_TOAST = 'You were signed out.';

let fx: Fixtures;

const accountMenu = (page: Page) => page.getByRole('button', { name: 'Account menu' });
const navSignIn = (page: Page) =>
  page.locator('nav').getByRole('link', { name: 'Sign in' }).filter({ visible: true });
const isRefresh = (url: URL) => url.pathname === '/api/auth/refresh';
const isLogout = (url: URL) => url.pathname === '/api/auth/logout';

async function uiLogin(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

async function signOut(page: Page): Promise<void> {
  await accountMenu(page).click();
  await page.getByRole('button', { name: 'Sign out' }).filter({ visible: true }).click();
}

/** A signs in through the UI; B is a second tab of the same browser, restored by its own refresh. */
async function signInTwoTabs(a: Page, context: BrowserContext, user: TestUser): Promise<Page> {
  await uiLogin(a, user);
  await expect(accountMenu(a)).toBeVisible();
  const b = await context.newPage();
  const restored = b.waitForResponse((r) => r.url().includes('/api/auth/refresh') && r.status() === 200);
  await b.goto('/');
  await restored;
  return b;
}

/** Whether some tab of this origin is waiting on the refresh lock. */
async function queuedOnLock(page: Page): Promise<boolean> {
  try {
    return await page.evaluate(async (name) => {
      const { pending = [] } = await navigator.locks.query();
      return pending.some((lock) => lock.name === name);
    }, REFRESH_LOCK);
  } catch {
    return false; // a navigation in flight; the next poll asks again
  }
}

/** Two zero-delay task hops, so React has committed what a settled fetch set. */
async function settle(page: Page): Promise<void> {
  for (let i = 0; i < 2; i++) await page.evaluate(() => new Promise<void>((r) => setTimeout(r, 0)));
}

/** Every refresh key for the user (tokens and session families) with its TTL. */
async function refreshKeys(uid: string): Promise<{ key: string; ttl: number }[]> {
  const redis = redisClient();
  try {
    const found: { key: string; ttl: number }[] = [];
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', `refresh:${uid}:*`, 'COUNT', 200);
      cursor = next;
      for (const key of keys) found.push({ key, ttl: await redis.ttl(key) });
    } while (cursor !== '0');
    return found;
  } finally {
    redis.disconnect();
  }
}

/** Keys that mean a session is still alive: a family, or a token still at its 7-day lifetime. Rotated-out tokens linger at 60 s or less. */
async function liveSessionKeys(uid: string): Promise<string[]> {
  return (await refreshKeys(uid)).filter((k) => k.key.includes(':family:') || k.ttl > 3600).map((k) => k.key);
}

async function uidFromCookie(context: BrowserContext): Promise<string> {
  const cookie = (await context.cookies()).find((c) => c.name === 'refresh_token');
  if (!cookie) throw new Error('no refresh cookie in the context');
  return cookie.value.slice(0, cookie.value.indexOf(':'));
}

test.describe('cross-tab sign-out', () => {
  let ip: string;
  let user: TestUser | null = null;
  let seq = 0;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ 'x-real-ip': ip });
    user = makeUser(fx.token, `x${++seq}`);
    await apiRegister(page, user, ip);
    // Registration signed this browser in. Sign it out through the API, not just by
    // dropping the cookie, so no session is left in Redis for the user and the only
    // sessions a test sees are the ones it made.
    const uid = await uidFromCookie(context);
    const out = await page.request.post('/api/auth/logout', { headers: { 'x-real-ip': ip } });
    expect(out.status()).toBe(204);
    expect(await liveSessionKeys(uid)).toEqual([]);
    await context.clearCookies();
  });

  test.afterEach(async ({ page }) => {
    if (user) {
      await apiDeleteUser(page, user, ip);
      user = null;
    }
  });

  test('signing out in one tab signs the other tabs out, with a neutral notice', async ({ page: a, context }) => {
    const b = await signInTwoTabs(a, context, user!);

    await signOut(a);
    await expect(navSignIn(a)).toBeVisible();

    // No reload of B: the storage event alone signs it out, and B says so without
    // claiming the session expired.
    await expect(navSignIn(b)).toBeVisible();
    await expect(accountMenu(b)).toHaveCount(0);
    await expect(b.getByText(SIGNED_OUT_TOAST)).toBeVisible();
    // One-shot: a toast lasts 5 s, so a retrying count would pass once it faded.
    expect(await b.getByText(EXPIRED_TOAST).count()).toBe(0);
    // The tab that signed out gets no storage event, so no notice either.
    expect(await a.getByText(SIGNED_OUT_TOAST).count()).toBe(0);
  });

  test('a tab that missed the storage event ends the session on its next focus', async ({ page }) => {
    await uiLogin(page, user!);
    await expect(accountMenu(page)).toBeVisible();

    // Removing the hint in this tab fires no storage event here, which is how a tab
    // restored from the back-forward cache meets another tab's sign-out: the hint
    // is gone and nothing told it. Focus recovery has to notice.
    await page.evaluate((flag) => localStorage.removeItem(flag), SESSION_FLAG);
    await expect(accountMenu(page)).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));

    await expect(navSignIn(page)).toBeVisible();
    await expect(page.getByText(SIGNED_OUT_TOAST)).toBeVisible();
  });

  test('a refresh in flight in another tab lands before the sign-out, so it cannot sign that tab back in', async ({
    page: a,
    context,
  }) => {
    const b = await signInTwoTabs(a, context, user!);
    const uid = await uidFromCookie(context);

    // No hold is timed: the gate opens on evidence.
    const events: string[] = [];
    let release: () => void = () => {};
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    // B's refresh reaches the server now, so the cookie is rotated, but its answer
    // is held back from the page until the gate opens. route.fetch() goes through
    // the context's own request context, which writes the answer's Set-Cookie into
    // the browser jar at once; putting the old cookie back makes the jar change only
    // when the page is given the answer, as for a real response still in transit.
    let heldBack = '';
    await context.route(isRefresh, async (route) => {
      const before = (await context.cookies()).filter((c) => c.name === 'refresh_token');
      const response = await route.fetch();
      await context.addCookies(before);
      heldBack = before[0]?.value ?? '';
      events.push('refresh reached the server');
      await released;
      await route.fulfill({ response });
      events.push('refresh answered');
    });
    await context.route(isLogout, async (route) => {
      events.push('logout reached the network');
      await route.continue();
    });

    try {
      const bRefreshed = b.waitForResponse((r) => r.url().includes('/api/auth/refresh') && r.status() === 200);
      await b.reload();
      await expect
        .poll(() => events.includes('refresh reached the server'), { intervals: [50], timeout: 20_000 })
        .toBe(true);
      // The server has rotated the cookie, and the browser still holds the old one.
      expect(heldBack).not.toBe('');
      expect((await context.cookies()).filter((c) => c.name === 'refresh_token').map((c) => c.value)).toEqual([
        heldBack,
      ]);

      await signOut(a);
      // Without the lock the sign-out goes out at once; with it, A waits behind B's refresh.
      await expect
        .poll(async () => events.includes('logout reached the network') || (await queuedOnLock(a)), {
          intervals: [50],
          timeout: 20_000,
        })
        .toBe(true);

      release();
      await bRefreshed;
      await expect
        .poll(() => events.includes('logout reached the network'), { intervals: [50], timeout: 20_000 })
        .toBe(true);

      // The refresh was answered before the sign-out left this browser.
      expect(events).toEqual(['refresh reached the server', 'refresh answered', 'logout reached the network']);
      // Both tabs end signed out, and nothing of the session survives: a token the
      // sign-out never saw would still be at its 7-day lifetime here.
      await expect(navSignIn(a)).toBeVisible();
      await expect(accountMenu(b)).toHaveCount(0);
      await expect(navSignIn(b)).toBeVisible();
      expect((await context.cookies()).some((c) => c.name === 'refresh_token')).toBe(false);
      expect(await liveSessionKeys(uid)).toEqual([]);
    } finally {
      release();
      await context.unrouteAll({ behavior: 'ignoreErrors' });
    }
  });

  test("a refresh queued behind another tab's sign-out ends without a toast", async ({ page: a, context }) => {
    const b = await signInTwoTabs(a, context, user!);

    let logoutHeld = false;
    let release: () => void = () => {};
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    await context.route(isLogout, async (route) => {
      logoutHeld = true;
      await released;
      await route.continue();
    });

    try {
      // A now holds the lock while its sign-out waits at the network.
      await signOut(a);
      await expect.poll(() => logoutHeld, { intervals: [50], timeout: 20_000 }).toBe(true);

      const bRefused = b.waitForResponse((r) => r.url().includes('/api/auth/refresh') && r.status() === 401);
      // Only to commit: B's lock wait (4 s) starts at mount, and waiting for load
      // (the hero image) would spend it before the poll below could see B queued.
      await b.reload({ waitUntil: 'commit' });
      // B's restore is queued behind A's sign-out.
      await expect.poll(() => queuedOnLock(a), { intervals: [50], timeout: 20_000 }).toBe(true);

      release();
      await bRefused;
      await settle(b);
      await expect(navSignIn(b)).toBeVisible();
      // One-shot: a toast lasts 5 s, so a retrying count would pass once it faded.
      expect(await b.getByText(EXPIRED_TOAST).count()).toBe(0);
    } finally {
      release();
      await context.unrouteAll({ behavior: 'ignoreErrors' });
    }
  });
});
