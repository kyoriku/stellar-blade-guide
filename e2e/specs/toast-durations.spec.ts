import { test, expect, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { BULK_COPY } from '../../client/src/constants/bulkProgressCopy';

/**
 * How long a toast stays: an info toast 6 s and an error toast 10 s
 * (TOAST_DURATIONS in ToastContext.tsx). The hand-clear tip has no timer at all;
 * hand-clear-tip.spec.ts pins that.
 */

let fx: Fixtures;

const toast = (page: Page, text: string) => page.getByRole('status').getByText(text, { exact: true });

test.describe('toast durations', () => {
  let ip: string;
  let user: TestUser;
  let seq = 0;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, `toast${++seq}`);
    await apiRegister(page, user, ip);
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  });

  test.afterEach(async ({ page }) => {
    await apiDeleteUser(page, user, ip);
  });

  test('an info toast stays 6 s and an error toast 10 s', async ({ page }) => {
    await page.clock.install();
    const statsLoaded = page.waitForResponse(r => r.url().endsWith('/api/users/me/stats') && r.status() === 200);
    await page.goto('/progress');
    await statsLoaded;
    await page.getByRole('button', { name: BULK_COPY.heading, exact: true }).click();
    // Paused from here, so each toast's timer starts at a known instant and only
    // moves when the test moves it.
    await page.clock.pauseAt(Date.now() + 1000);

    // Pressing Clear with no scope chosen is an info toast.
    await page.getByRole('button', { name: BULK_COPY.clearButton }).click();
    const info = toast(page, BULK_COPY.hintChooseScope);
    await expect(info).toBeVisible();
    await page.clock.runFor(5_999);
    await expect(info).toBeVisible();
    await page.clock.runFor(1);
    await expect(info).toHaveCount(0);

    // A refused count is an error toast with the card's own sentence (a 5xx would
    // show the site's generic server message instead).
    await page.route('**/api/progress/bulk/preview', route =>
      route.fulfill({ status: 422, contentType: 'application/json', body: '{"detail":"refused"}' }));
    await page.getByLabel(BULK_COPY.scopeLabel).selectOption('level:Eidos 7');
    await page.getByRole('button', { name: BULK_COPY.clearButton }).click();
    const error = toast(page, BULK_COPY.previewError);
    await expect(error).toBeVisible();
    await page.clock.runFor(9_999);
    await expect(error).toBeVisible();
    await page.clock.runFor(1);
    await expect(error).toHaveCount(0);
  });
});
