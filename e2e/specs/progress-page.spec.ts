import { test, expect, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { BULK_COPY } from '../../client/src/constants/bulkProgressCopy';

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
    headers: { [TEST_IP_HEADER]: ip },
  });
  if (res.status() !== 200) {
    throw new Error(`login failed: ${res.status()} ${await res.text()}`);
  }
  return ((await res.json()) as { access_token: string }).access_token;
}

// React runs what a press set off, its effects included, within two message turns.
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise(resolve => {
    const ch = new MessageChannel();
    let turns = 0;
    ch.port1.onmessage = () => (++turns === 2 ? resolve(null) : ch.port2.postMessage(null));
    ch.port2.postMessage(null);
  }));
}

test.describe('progress page auth gate', () => {
  test('guest is redirected to login', async ({ page, context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
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
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
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
    // Things are marked on level and type pages; a category (Collectibles, Upgrades,
    // Cosmetics) is a group of types.
    await expect(page.getByText('Mark collectibles as found on any level or type page to start tracking.', { exact: true })).toBeVisible();
  });

  test('a completed collectible is reflected in the hero', async ({ page }) => {
    const token = await apiLoginToken(page, user, ip);
    const put = await page.request.put(`/api/progress/${fx.collectibleId}`, {
      headers: { Authorization: `Bearer ${token}`, [TEST_IP_HEADER]: ip },
    });
    expect(put.status()).toBe(200);

    await gotoProgressAuthed(page);
    await expect(page.getByText(/^1 of [\d.,\s]+ collectibles found$/)).toBeVisible();
  });

  test("cards follow the Manage progress picker's order", async ({ page }) => {
    await gotoProgressAuthed(page);
    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      'Levels', 'Collectibles', 'Upgrades', 'Cosmetics', 'Other Sources', 'Cycles', BULK_COPY.heading,
    ]);
  });

  test('Escape after Ctrl+K from the Scope select in the open Manage progress card gives focus back to the select', async ({ page }) => {
    await gotoProgressAuthed(page);
    // Away from the nav's menus, which open under a resting pointer.
    await page.mouse.move(5, 700);
    // The card's toggle names its panel, which opening the search leaves open.
    const toggle = page.getByRole('button', { name: BULK_COPY.heading, exact: true });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const select = page.getByLabel(BULK_COPY.scopeLabel, { exact: true });
    const panelId = await toggle.getAttribute('aria-controls');
    expect(await select.evaluate((el, id) => !!id && !!document.getElementById(id)?.contains(el), panelId),
      'the toggle names the panel holding the select').toBe(true);
    await select.focus();
    await expect(select).toBeFocused();
    // The bar's search box, the nav's only input.
    const searchBox = page.locator('nav input');
    await page.keyboard.press('Control+k');
    await expect(searchBox).toBeFocused();
    // An opener scrolled away, or under the navbar, would rightly give way to the Search button.
    const barBottom = await searchBox.evaluate(el => el.closest('nav')!.getBoundingClientRect().bottom);
    expect(await select.evaluate((el, barBottom) => {
      const r = el.getBoundingClientRect();
      return r.top >= barBottom && r.bottom <= window.innerHeight;
    }, barBottom), 'the select, below the navbar and inside the window').toBe(true);
    // Each element focus lands on from here on: the select, or anything else by its name.
    await select.evaluate(el => {
      const w = window as unknown as { landed: string[] };
      w.landed = [];
      document.addEventListener('focusin', e => {
        const t = e.target as Element;
        w.landed.push(t === el ? 'the select' : t.getAttribute('aria-label') ?? t.textContent?.trim() ?? t.tagName);
      }, true);
    });
    await page.keyboard.press('Escape');
    await expect(searchBox).toHaveCount(0);
    await expect(select, 'focus back on the select').toBeFocused();
    await settle(page);
    await expect(select, 'still on the select').toBeFocused();
    expect(await page.evaluate(() => (window as unknown as { landed: string[] }).landed), 'one focus, on the select').toEqual(['the select']);
    await expect(toggle, 'the card, still open').toHaveAttribute('aria-expanded', 'true');
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
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    userA = makeUser(fx.token, 'swa');
    userB = makeUser(fx.token, 'swb');
    // A registers through the page's jar (its refresh cookie drives the page
    // session); B through the standalone request fixture so B's cookie never
    // displaces A's in the page context.
    await apiRegister(page, userA, ip);
    const regB = await request.post('/api/auth/register', {
      data: userB,
      headers: { [TEST_IP_HEADER]: ip },
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
      headers: { Authorization: `Bearer ${token}`, [TEST_IP_HEADER]: ip },
    });
    expect(put.status()).toBe(200);

    await gotoProgressAuthed(page);
    await expect(page.getByText(/^1 of [\d.,\s]+ collectibles found$/)).toBeVisible();

    // UI logout — ProtectedRoute bounces the now-guest tab to /login.
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login/);

    // SPA-internal login as B; login returns to state.from (/stats), which
    // must render B's zero progress, not A's cached set.
    const statsLoaded = page.waitForResponse(
      (r) => r.url().endsWith('/api/users/me/stats') && r.status() === 200
    );
    await page.getByLabel('Email').fill(userB.email);
    await page.getByLabel('Password', { exact: true }).fill(userB.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await statsLoaded;
    await expect(page.getByText(/^0 of [\d.,\s]+ collectibles found$/)).toBeVisible();
  });
});
