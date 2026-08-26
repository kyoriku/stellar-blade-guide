import { test, expect, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';

let fx: Fixtures;

const toggleBtn = (page: Page) =>
  page.locator(`article#collectible-${fx.collectibleId}`).getByRole('button', { name: /Mark as/ });

/**
 * Navigate to the fixture's level page and wait until the authenticated
 * progress query has resolved — before that, a click would take the GUEST
 * (localStorage) path because isAuthenticated only flips after the silent
 * refresh completes.
 */
async function gotoLevelAuthed(page: Page): Promise<void> {
  const progressLoaded = page.waitForResponse(
    (r) => r.url().endsWith('/api/progress') && r.request().method() === 'GET' && r.status() === 200
  );
  await page.goto('/levels/eidos-7');
  await progressLoaded;
}

async function clickAndAwaitWrite(page: Page, method: 'PUT' | 'DELETE'): Promise<void> {
  const write = page.waitForResponse(
    (r) =>
      r.url().includes(`/api/progress/${fx.collectibleId}`) &&
      r.request().method() === method &&
      r.status() === 200
  );
  await toggleBtn(page).click();
  await write;
}

test.describe('authenticated progress toggling', () => {
  let ip: string;
  let user: TestUser;
  let seq = 0;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ 'x-real-ip': ip });
    user = makeUser(fx.token, `p${++seq}`);
    // Register via API (sets the refresh cookie on this context) and plant the
    // session hint so the app self-restores on load — the same code path the
    // changed mount-refresh effect drives.
    await apiRegister(page, user, ip);
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  });

  test.afterEach(async ({ page }) => {
    await apiDeleteUser(page, user, ip);
  });

  test('toggle on persists across reload', async ({ page }) => {
    await gotoLevelAuthed(page);
    await expect(toggleBtn(page)).toHaveAccessibleName('Mark as found');

    await clickAndAwaitWrite(page, 'PUT');
    await expect(toggleBtn(page)).toHaveAccessibleName('Mark as not found');

    await gotoLevelAuthed(page); // full reload; progress GET is no-store → server truth
    await expect(toggleBtn(page)).toHaveAccessibleName('Mark as not found');
  });

  test('toggle off persists across reload', async ({ page }) => {
    await gotoLevelAuthed(page);
    await clickAndAwaitWrite(page, 'PUT');
    await clickAndAwaitWrite(page, 'DELETE');
    await expect(toggleBtn(page)).toHaveAccessibleName('Mark as found');

    await gotoLevelAuthed(page);
    await expect(toggleBtn(page)).toHaveAccessibleName('Mark as found');
  });

  test('rapid repeated toggling settles on the correct final state', async ({ page }) => {
    await gotoLevelAuthed(page);

    let writes = 0;
    page.on('response', (r) => {
      if (
        r.url().includes(`/api/progress/${fx.collectibleId}`) &&
        ['PUT', 'DELETE'].includes(r.request().method()) &&
        r.status() === 200
      ) {
        writes += 1;
      }
    });

    // As fast as the real UI permits: the button disables while its own write
    // is in flight and Playwright's actionability check waits for enabled.
    for (let i = 0; i < 5; i++) {
      await toggleBtn(page).click();
    }
    await expect.poll(() => writes, { timeout: 15_000 }).toBe(5);

    // 5 toggles from unchecked → checked.
    await expect(toggleBtn(page)).toHaveAccessibleName('Mark as not found');
    await gotoLevelAuthed(page);
    await expect(toggleBtn(page)).toHaveAccessibleName('Mark as not found');
  });
});
