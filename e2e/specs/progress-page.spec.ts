import { test, expect, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';

let fx: Fixtures;

/**
 * Navigate to /progress and wait for the authenticated stats aggregate — the
 * hero also needs the progress query, but Playwright's auto-retrying
 * expectations absorb that; the stats response is the gate that proves the
 * page took the authenticated path (ProtectedRoute did not bounce us).
 *
 * Never assert the literal catalog total: global-setup adds a fixture
 * collectible, so the denominator is baseline+1, not the seeded count.
 */
async function gotoProgressAuthed(page: Page): Promise<void> {
  const statsLoaded = page.waitForResponse(
    (r) => r.url().endsWith('/api/users/me/stats') && r.status() === 200
  );
  await page.goto('/progress');
  await statsLoaded;
}

async function apiLoginToken(page: Page, user: TestUser, ip: string): Promise<string> {
  const res = await page.request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
    headers: { 'x-real-ip': ip },
  });
  if (res.status() !== 200) {
    throw new Error(`login failed: ${res.status()} ${await res.text()}`);
  }
  return ((await res.json()) as { access_token: string }).access_token;
}

test.describe('progress page auth gate', () => {
  test('guest is redirected to login', async ({ page, context }) => {
    await context.setExtraHTTPHeaders({ 'x-real-ip': nextTestIp() });
    await page.goto('/progress');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('authenticated stats', () => {
  let ip: string;
  let user: TestUser;
  let seq = 0;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ 'x-real-ip': ip });
    user = makeUser(fx.token, `st${++seq}`);
    // Register via API (sets the refresh cookie on this context) and plant the
    // session hint so the app self-restores on load.
    await apiRegister(page, user, ip);
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  });

  test.afterEach(async ({ page }) => {
    await apiDeleteUser(page, user, ip);
  });

  test('fresh user sees zero completion in the hero', async ({ page }) => {
    await gotoProgressAuthed(page);
    await expect(page.getByText(/^0 of [\d.,\s]+ collectibles found$/)).toBeVisible();
  });

  test('a completed collectible is reflected in the hero', async ({ page }) => {
    const token = await apiLoginToken(page, user, ip);
    const put = await page.request.put(`/api/progress/${fx.collectibleId}`, {
      headers: { Authorization: `Bearer ${token}`, 'x-real-ip': ip },
    });
    expect(put.status()).toBe(200);

    await gotoProgressAuthed(page);
    await expect(page.getByText(/^1 of [\d.,\s]+ collectibles found$/)).toBeVisible();
  });
});

test.describe('account switch', () => {
  // Regression for the logout cache-clear: the switch must be SPA-internal
  // (UI logout → UI login, no page.goto in between) so the in-memory query
  // cache survives — without removeQueries(['progress']) on logout, user B
  // inherits A's completion set for up to its 5-minute staleTime.
  let ip: string;
  let userA: TestUser;
  let userB: TestUser;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context, request }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ 'x-real-ip': ip });
    userA = makeUser(fx.token, 'swa');
    userB = makeUser(fx.token, 'swb');
    // A registers through the page's jar (its refresh cookie drives the page
    // session); B through the standalone request fixture so B's cookie never
    // displaces A's in the page context.
    await apiRegister(page, userA, ip);
    const regB = await request.post('/api/auth/register', {
      data: userB,
      headers: { 'x-real-ip': ip },
    });
    if (regB.status() !== 201) throw new Error(`register B failed: ${regB.status()}`);
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  });

  test.afterEach(async ({ page }) => {
    await apiDeleteUser(page, userA, ip);
    await apiDeleteUser(page, userB, ip);
  });

  test("signing out and in as another account shows that account's stats", async ({ page }) => {
    const token = await apiLoginToken(page, userA, ip);
    const put = await page.request.put(`/api/progress/${fx.collectibleId}`, {
      headers: { Authorization: `Bearer ${token}`, 'x-real-ip': ip },
    });
    expect(put.status()).toBe(200);

    await gotoProgressAuthed(page);
    await expect(page.getByText(/^1 of [\d.,\s]+ collectibles found$/)).toBeVisible();

    // UI logout — ProtectedRoute bounces the now-guest tab to /login.
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('button', { name: 'Sign out' }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/login/);

    // SPA-internal login as B; login returns to state.from (/stats), which
    // must render B's zero progress, not A's cached set.
    const statsLoaded = page.waitForResponse(
      (r) => r.url().endsWith('/api/users/me/stats') && r.status() === 200
    );
    await page.getByLabel('Email').fill(userB.email);
    await page.getByLabel('Password').fill(userB.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await statsLoaded;
    await expect(page.getByText(/^0 of [\d.,\s]+ collectibles found$/)).toBeVisible();
  });
});
