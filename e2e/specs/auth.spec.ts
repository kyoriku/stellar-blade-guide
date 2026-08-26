import { test, expect, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';

let fx: Fixtures;

const accountMenu = (page: Page) => page.getByRole('button', { name: 'Account menu' });
const navSignIn = (page: Page) =>
  page.locator('nav').getByRole('link', { name: 'Sign in' }).filter({ visible: true });

async function uiLogin(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

test.describe('auth', () => {
  let ip: string;
  let user: TestUser | null = null;
  let seq = 0;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ 'x-real-ip': ip });
    user = makeUser(fx.token, `a${++seq}`);
    await apiRegister(page, user, ip);
    // Registration set a refresh cookie; clear it so each test starts signed out.
    await context.clearCookies();
  });

  test.afterEach(async ({ page }) => {
    if (user) {
      await apiDeleteUser(page, user, ip);
      user = null;
    }
  });

  test('login with valid credentials shows authenticated state', async ({ page }) => {
    await uiLogin(page, user!);
    await expect(accountMenu(page)).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
    expect(await page.evaluate(() => localStorage.getItem('sb_has_session'))).toBe('1');
  });

  test('login with invalid credentials surfaces an error and no auth state', async ({ page }) => {
    await uiLogin(page, { ...user!, password: 'definitely-wrong-password' });
    // No role=alert exists in the app; the error renders as a red message div in the form.
    const error = page.locator('form div.text-red-400');
    await expect(error).toBeVisible();
    await expect(error).not.toBeEmpty();
    await expect(page).toHaveURL(/\/login/);
    await expect(accountMenu(page)).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('sb_has_session'))).toBeNull();
  });

  test('logout clears auth state', async ({ page }) => {
    await uiLogin(page, user!);
    await expect(accountMenu(page)).toBeVisible();

    await accountMenu(page).click();
    await page.getByRole('button', { name: 'Sign out' }).filter({ visible: true }).click();

    await expect(navSignIn(page)).toBeVisible();
    await expect(accountMenu(page)).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('sb_has_session'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('sb_user'))).toBeNull();
  });

  test('reload restores the session via the refresh cookie', async ({ page }) => {
    await uiLogin(page, user!);
    await expect(accountMenu(page)).toBeVisible();

    // Reload on a page that mounts useProgress — the homepage doesn't, so the
    // token-gated progress query would never fire there.
    await page.goto('/levels/eidos-7');

    // The strong restored signal: the mount effect's POST /auth/refresh succeeds
    // and the token-gated GET /api/progress fires afterwards.
    const refreshed = page.waitForResponse(
      (r) => r.url().includes('/api/auth/refresh') && r.status() === 200
    );
    const progressLoaded = page.waitForResponse(
      (r) => r.url().endsWith('/api/progress') && r.request().method() === 'GET' && r.status() === 200
    );
    await page.reload();
    await refreshed;
    await progressLoaded;
    await expect(accountMenu(page)).toBeVisible();
  });
});
