import { test, expect, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import {
  CURRENT_PASSWORD_MAX_LENGTH,
  CURRENT_PASSWORD_TOO_LONG,
  NEW_PASSWORD_MAX_LENGTH,
  NEW_PASSWORD_TOO_LONG,
} from '../../client/src/utils/validatePassword';

// Each form refuses a password the server would refuse for its length, in the server's
// words and without sending anything, and sends one at the limit untouched. The server
// counts characters, so the at-limit cases use emoji: two UTF-16 units each, one character.
// Requests are intercepted, never answered by the server: one over the limit is aborted
// and counted, one at the limit gets a 400 sentinel (never a 401, which would make
// Settings refresh and resend, and never a 2xx, whose success paths change state).

const EMOJI = String.fromCodePoint(0x1f600);
const SENTINEL = 'e2e: the request reached the route';

let fx: Fixtures;
let ip: string;
let seq = 0;

async function refuseAll(page: Page, path: string): Promise<() => number> {
  let count = 0;
  await page.route(`**${path}`, (route) => {
    count += 1;
    return route.abort();
  });
  return () => count;
}

async function answerWithSentinel(page: Page, path: string): Promise<unknown[]> {
  const bodies: unknown[] = [];
  await page.route(`**${path}`, (route) => {
    bodies.push(route.request().postDataJSON());
    return route.fulfill({ status: 400, json: { detail: SENTINEL } });
  });
  return bodies;
}

test.describe('password length limits', () => {
  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
  });

  test.describe('register', () => {
    const submit = (page: Page) => page.getByRole('button', { name: 'Create account', exact: true });

    async function fill(page: Page, password: string): Promise<void> {
      seq += 1;
      await page.goto('/register');
      await page.getByLabel('Email').fill(`e2e-${fx.token}-pwlimit${seq}@sbg-e2e-suite.dev`);
      await page.getByLabel('Username').fill(`e2e_${fx.token}_pwlimit${seq}`);
      await page.getByLabel('Password').fill(password);
    }

    test('refuses a new password over its limit without sending it', async ({ page }) => {
      const sent = await refuseAll(page, '/api/auth/register');
      await fill(page, 'p'.repeat(NEW_PASSWORD_MAX_LENGTH + 1));
      await submit(page).click();
      await expect(page.locator('form div.text-red-400')).toHaveText(NEW_PASSWORD_TOO_LONG);
      expect(sent()).toBe(0);
      await expect(submit(page)).toBeEnabled();
    });

    test('sends a new password at its limit untruncated', async ({ page }) => {
      const bodies = await answerWithSentinel(page, '/api/auth/register');
      const password = EMOJI.repeat(NEW_PASSWORD_MAX_LENGTH);
      await fill(page, password);
      await submit(page).click();
      await expect(page.locator('form div.text-red-400')).toHaveText(SENTINEL);
      expect(bodies).toHaveLength(1);
      expect((bodies[0] as { password: string }).password).toBe(password);
    });
  });

  test.describe('login', () => {
    const submit = (page: Page) => page.getByRole('button', { name: 'Sign in', exact: true });

    async function fill(page: Page, password: string): Promise<void> {
      await page.goto('/login');
      await page.getByLabel('Email').fill(`e2e-${fx.token}-nobody@sbg-e2e-suite.dev`);
      await page.getByLabel('Password').fill(password);
    }

    test('refuses a password over the stored limit without sending it', async ({ page }) => {
      const sent = await refuseAll(page, '/api/auth/login');
      await fill(page, 'p'.repeat(CURRENT_PASSWORD_MAX_LENGTH + 1));
      await submit(page).click();
      await expect(page.locator('form div.text-red-400')).toHaveText(CURRENT_PASSWORD_TOO_LONG);
      expect(sent()).toBe(0);
      await expect(submit(page)).toBeEnabled();
    });

    test('sends a password at the stored limit untruncated', async ({ page }) => {
      const bodies = await answerWithSentinel(page, '/api/auth/login');
      const password = EMOJI.repeat(CURRENT_PASSWORD_MAX_LENGTH);
      await fill(page, password);
      await submit(page).click();
      await expect(page.locator('form div.text-red-400')).toHaveText(SENTINEL);
      expect(bodies).toHaveLength(1);
      expect((bodies[0] as { password: string }).password).toBe(password);
    });
  });

  test.describe('reset', () => {
    const submit = (page: Page) => page.getByRole('button', { name: 'Update password', exact: true });

    async function fill(page: Page, password: string): Promise<void> {
      await page.goto('/reset-password?token=e2e');
      await page.getByLabel('New password').fill(password);
    }

    test('refuses a new password over its limit without sending it', async ({ page }) => {
      const sent = await refuseAll(page, '/api/auth/reset-password');
      await fill(page, 'p'.repeat(NEW_PASSWORD_MAX_LENGTH + 1));
      await submit(page).click();
      await expect(page.locator('form div.text-red-400')).toHaveText(NEW_PASSWORD_TOO_LONG);
      expect(sent()).toBe(0);
      await expect(submit(page)).toBeEnabled();
    });

    test('sends a new password at its limit untruncated', async ({ page }) => {
      const bodies = await answerWithSentinel(page, '/api/auth/reset-password');
      const password = EMOJI.repeat(NEW_PASSWORD_MAX_LENGTH);
      await fill(page, password);
      await submit(page).click();
      await expect(page.locator('form div.text-red-400')).toHaveText(SENTINEL);
      expect(bodies).toEqual([{ token: 'e2e', new_password: password }]);
    });
  });

  test.describe('settings', () => {
    let user: TestUser;

    const form = (page: Page) =>
      page.locator('form').filter({ has: page.getByRole('button', { name: 'Update password', exact: true }) });
    const submit = (page: Page) => form(page).getByRole('button', { name: 'Update password', exact: true });

    test.beforeEach(async ({ page, context }) => {
      seq += 1;
      user = makeUser(fx.token, `pwlimit${seq}`);
      await apiRegister(page, user, ip);
      // Registration set a refresh cookie; sign in through the form, as a user would.
      await context.clearCookies();
      await page.goto('/login');
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Password').fill(user.password);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();
      await page.goto('/settings');
    });

    test.afterEach(async ({ page }) => {
      await apiDeleteUser(page, user, ip);
    });

    test('refuses a current password over the stored limit without sending it', async ({ page }) => {
      const sent = await refuseAll(page, '/api/auth/change-password');
      await page.getByLabel('Current password').fill('p'.repeat(CURRENT_PASSWORD_MAX_LENGTH + 1));
      await page.getByLabel('New password').fill('a-new-password-1');
      await submit(page).click();
      await expect(form(page).locator('div.text-red-400')).toHaveText(CURRENT_PASSWORD_TOO_LONG);
      expect(sent()).toBe(0);
      await expect(submit(page)).toBeEnabled();
    });

    test('refuses a new password over its limit without sending it', async ({ page }) => {
      const sent = await refuseAll(page, '/api/auth/change-password');
      await page.getByLabel('Current password').fill(user.password);
      await page.getByLabel('New password').fill('p'.repeat(NEW_PASSWORD_MAX_LENGTH + 1));
      await submit(page).click();
      await expect(form(page).locator('div.text-red-400')).toHaveText(NEW_PASSWORD_TOO_LONG);
      expect(sent()).toBe(0);
      await expect(submit(page)).toBeEnabled();
    });

    test('sends both passwords at their limits untruncated', async ({ page }) => {
      const bodies = await answerWithSentinel(page, '/api/auth/change-password');
      const current = EMOJI.repeat(CURRENT_PASSWORD_MAX_LENGTH);
      const next = EMOJI.repeat(NEW_PASSWORD_MAX_LENGTH);
      await page.getByLabel('Current password').fill(current);
      await page.getByLabel('New password').fill(next);
      await submit(page).click();
      await expect(form(page).locator('div.text-red-400')).toHaveText(SENTINEL);
      expect(bodies).toEqual([{ current_password: current, new_password: next }]);
    });
  });
});
