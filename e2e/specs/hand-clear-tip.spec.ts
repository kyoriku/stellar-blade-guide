import { test, expect, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { BULK_COPY } from '../../client/src/constants/bulkProgressCopy';
import { BULK_DONE_KEY, TIP_SHOWN_KEY } from '../../client/src/utils/handClearTip';

/**
 * The one-time tip for someone clearing their progress by hand: ten different items
 * unticked within two minutes, signed in, on a level or type page. It points at
 * Manage progress, stays up until its action or Dismiss, and shows once per browser,
 * never to a guest and never in a browser that has completed a bulk action.
 */

// Counts in the copy are formatted by the page; pin the locale the spec formats with.
test.use({ locale: 'en-US' });

let fx: Fixtures;

type Item = { id: number; cycle: string; quantity: number };
type Locations = { collectibles: Item[] }[];

// Ids come from the live catalog, never literals: content edits must not break this.
async function levelItems(page: Page, slug: string): Promise<Item[]> {
  const res = await page.request.get(`/api/levels/${slug}`);
  expect(res.status()).toBe(200);
  return ((await res.json()) as Locations).flatMap(l => l.collectibles);
}

async function typeItems(page: Page, slug: string): Promise<Item[]> {
  const res = await page.request.get(`/api/collectibles/${slug}`);
  expect(res.status()).toBe(200);
  return ((await res.json()) as { locations: Locations }[]).flatMap(l => l.locations.flatMap(loc => loc.collectibles));
}

// Kept local, as progress-bulk.spec.ts keeps its own.
async function apiLoginToken(page: Page, user: TestUser, ip: string): Promise<string> {
  const res = await page.request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
    headers: { [TEST_IP_HEADER]: ip },
  });
  if (res.status() !== 200) throw new Error(`login failed: ${res.status()} ${await res.text()}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function tick(page: Page, token: string, ip: string, ids: number[]): Promise<void> {
  for (const id of ids) {
    const res = await page.request.put(`/api/progress/${id}`, {
      headers: { Authorization: `Bearer ${token}`, [TEST_IP_HEADER]: ip },
    });
    expect(res.status()).toBe(200);
  }
}

// Before GET /api/progress lands every click is a PUT, so wait for it.
async function gotoSignedIn(page: Page, path: string): Promise<void> {
  const progressLoaded = page.waitForResponse(
    r => r.url().endsWith('/api/progress') && r.request().method() === 'GET' && r.status() === 200,
  );
  await page.goto(path);
  await progressLoaded;
}

const box = (page: Page, id: number) =>
  page.locator(`article#collectible-${id}`).getByRole('button', { name: /Mark as/ });

const deleted = (page: Page, id?: number) =>
  page.waitForResponse(r =>
    r.request().method() === 'DELETE' &&
    (id === undefined ? /\/api\/progress\/\d+$/.test(r.url()) : r.url().endsWith(`/api/progress/${id}`)) &&
    r.status() === 200);

// Ticks each item on a level page, waiting for its PUT to land.
async function tickInPage(page: Page, ids: number[]): Promise<void> {
  for (const id of ids) {
    await expect(box(page, id)).toHaveAccessibleName('Mark as found');
    const write = page.waitForResponse(r =>
      r.request().method() === 'PUT' && r.url().endsWith(`/api/progress/${id}`) && r.status() === 200);
    await box(page, id).click();
    await write;
    await expect(box(page, id)).toHaveAccessibleName('Mark as not found');
  }
}

// Unticks each item on a level page, waiting for its DELETE to land.
async function untick(page: Page, ids: number[]): Promise<void> {
  for (const id of ids) {
    await expect(box(page, id)).toHaveAccessibleName('Mark as not found');
    const write = deleted(page, id);
    await box(page, id).click();
    await write;
    await expect(box(page, id)).toHaveAccessibleName('Mark as found');
  }
}

const tipAction = (page: Page) => page.getByRole('status').getByRole('button', { name: BULK_COPY.handClearAction });

// Counts every tip that appears from now until the next full page load. A second
// show would be a new node; a tip still on screen would swallow it as a repeat.
const watchTips = (page: Page, label: string) =>
  page.evaluate((tip) => {
    const w = window as unknown as { __tipsShown: number };
    w.__tipsShown = 0;
    new MutationObserver(records => records.forEach(r => r.addedNodes.forEach(n => {
      if (n.textContent?.includes(tip)) w.__tipsShown += 1;
    }))).observe(document.querySelector('[role="status"]')!, { childList: true });
  }, BULK_COPY.handClearTip(label));
const tipsShown = (page: Page) => page.evaluate(() => (window as unknown as { __tipsShown: number }).__tipsShown);

const stored = (page: Page, key: string) => page.evaluate(k => localStorage.getItem(k), key);

// Exact: the tip's own "Open Manage progress" would match too.
const manageToggle = (page: Page) => page.getByRole('button', { name: BULK_COPY.heading, exact: true });
const scopeSelect = (page: Page) => page.getByLabel(BULK_COPY.scopeLabel);

// Found items with no quantity, so counts read the same in both units; never the fixture's.
async function pick(page: Page, n: number): Promise<number[]> {
  const ids = (await levelItems(page, 'eidos-7'))
    .filter(c => c.quantity === 1 && c.id !== fx.collectibleId)
    .slice(0, n)
    .map(c => c.id);
  expect(ids).toHaveLength(n);
  return ids;
}

test.describe('the hand-clear tip, signed in', () => {
  let ip: string;
  let user: TestUser;
  let token: string;
  let seq = 0;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, `tip${++seq}`);
    await apiRegister(page, user, ip);
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
    token = await apiLoginToken(page, user, ip);
  });

  test.afterEach(async ({ page }) => {
    await apiDeleteUser(page, user, ip);
  });

  test('shows once on the tenth untick, takes no focus, and stays up until dismissed', async ({ page }) => {
    // Installed before any toast exists, so a toast timer would be a fake one the
    // fast-forward below fires.
    await page.clock.install();
    const ids = await pick(page, 12);
    await gotoSignedIn(page, '/levels/eidos-7');
    await watchTips(page, 'Eidos 7');
    // Twelve ticks in the page count for nothing: only unticks do.
    await tickInPage(page, ids);
    expect(await tipsShown(page)).toBe(0);
    expect(await stored(page, TIP_SHOWN_KEY)).toBeNull();

    await untick(page, ids.slice(0, 9));
    expect(await tipsShown(page)).toBe(0);
    expect(await stored(page, TIP_SHOWN_KEY)).toBeNull();

    await untick(page, ids.slice(9, 10));
    await expect(tipAction(page)).toBeVisible();
    await expect(page.getByRole('status')).toContainText(BULK_COPY.handClearTip('Eidos 7'));
    expect(await tipsShown(page)).toBe(1);
    expect(await stored(page, TIP_SHOWN_KEY)).toBe('1');
    // Read once: a later toast is read on its own, not after the tip again.
    await expect(page.getByRole('status')).toHaveAttribute('aria-atomic', 'false');
    // It interrupts nothing: focus is not in the toast.
    expect(await page.evaluate(() => document.activeElement?.closest('[role="status"]') ?? null)).toBeNull();

    // No timer: still up two minutes on, far past any other toast's timer.
    await page.clock.fastForward('02:00');
    await expect(tipAction(page)).toBeVisible();
    // Unticking carries on with the tip up: each DELETE still lands.
    await untick(page, ids.slice(10, 12));

    await page.getByRole('status').getByRole('button', { name: 'Dismiss' }).click();
    await expect(tipAction(page)).toHaveCount(0);

    // A second hand-clear in this browser, after a reload, shows nothing.
    await tick(page, token, ip, ids);
    await gotoSignedIn(page, '/levels/eidos-7');
    await watchTips(page, 'Eidos 7');
    await untick(page, ids.slice(0, 10));
    expect(await tipsShown(page)).toBe(0);
  });

  test("its action opens Manage progress on the page's level, in view and focused, and the arrival is spent", async ({ page }) => {
    // Short enough that the scroll lands the card at its anchor, not where the page
    // bottom stops it, and tall enough to show all of the opened card.
    await page.setViewportSize({ width: 1280, height: 600 });
    const bulkRequests: string[] = [];
    page.on('request', r => { if (r.url().includes('/api/progress/bulk')) bulkRequests.push(r.url()); });
    const ids = await pick(page, 10);
    await tick(page, token, ip, ids);
    await gotoSignedIn(page, '/levels/eidos-7');
    await untick(page, ids);

    await tipAction(page).click();
    await expect(page).toHaveURL(/\/progress$/);
    await expect(manageToggle(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(scopeSelect(page)).toHaveValue('level:Eidos 7');
    await expect(page.getByRole('radio', { name: BULK_COPY.cycleAll, exact: true })).toBeChecked();
    // All of the opened card, its top at the scroll-anchor offset (97px from md):
    // a scroll before the card opened would leave its buttons below the fold.
    const region = page.getByRole('region', { name: BULK_COPY.heading });
    await expect(region).toBeInViewport({ ratio: 1 });
    expect(Math.abs((await region.boundingBox())!.y - 97)).toBeLessThanOrEqual(1);
    await expect(manageToggle(page)).toBeFocused();
    await expect(tipAction(page)).toHaveCount(0);
    // It only opens the card: clearing is still the reader's press and confirm.
    expect(bulkRequests).toEqual([]);

    // The state was spent, so a reload is an ordinary visit.
    await page.reload();
    await expect(manageToggle(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('its action still lands when the Progress page is already open', async ({ page }) => {
    const ids = await pick(page, 10);
    await tick(page, token, ip, ids);
    await gotoSignedIn(page, '/levels/eidos-7');
    await untick(page, ids);
    await expect(tipAction(page)).toBeVisible();

    // A client-side visit keeps the toast, which has no timer.
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('link', { name: /^Progress/ }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/progress$/);
    await manageToggle(page).click();
    await scopeSelect(page).selectOption('level:Xion');
    await page.getByRole('radio', { name: 'NG+', exact: true }).check();

    await tipAction(page).click();
    await expect(scopeSelect(page)).toHaveValue('level:Eidos 7');
    await expect(page.getByRole('radio', { name: BULK_COPY.cycleAll, exact: true })).toBeChecked();
    await expect(manageToggle(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(manageToggle(page)).toBeFocused();
    // The press replaced the open page's entry, so one Back leaves it.
    await page.goBack();
    await expect(page).toHaveURL(/\/levels\/eidos-7$/);
  });

  test('unticks spread over more than two minutes do not add up', async ({ page }) => {
    await page.clock.install();
    const ids = await pick(page, 10);
    await tick(page, token, ip, ids);
    await gotoSignedIn(page, '/levels/eidos-7');
    await watchTips(page, 'Eidos 7');
    await untick(page, ids.slice(0, 9));
    await page.clock.fastForward('02:01');
    await untick(page, ids.slice(9));
    expect(await tipsShown(page)).toBe(0);
    expect(await stored(page, TIP_SHOWN_KEY)).toBeNull();
  });

  test('on a type page it names the type and opens Manage progress on it', async ({ page }) => {
    const ids = (await typeItems(page, 'documents')).filter(c => c.quantity === 1).slice(0, 10).map(c => c.id);
    expect(ids).toHaveLength(10);
    await tick(page, token, ip, ids);
    await gotoSignedIn(page, '/collectibles/documents');
    // Type pages anchor cards by slug, so press whichever found box comes first.
    for (let i = 0; i < 10; i++) {
      const write = deleted(page);
      await page.getByRole('button', { name: 'Mark as not found' }).first().click();
      await write;
    }
    await expect(page.getByRole('status')).toContainText(BULK_COPY.handClearTip('Documents'));

    await tipAction(page).click();
    await expect(page).toHaveURL(/\/progress$/);
    await expect(manageToggle(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(scopeSelect(page)).toHaveValue('type:documents');
  });

  test('never shows in a browser that has completed a bulk action', async ({ page }) => {
    const ids = await pick(page, 10);
    await tick(page, token, ip, ids);
    const statsLoaded = page.waitForResponse(r => r.url().endsWith('/api/users/me/stats') && r.status() === 200);
    await page.goto('/progress');
    await statsLoaded;
    await manageToggle(page).click();
    await scopeSelect(page).selectOption('level:Eidos 7');
    await page.getByRole('button', { name: BULK_COPY.clearButton }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: BULK_COPY.confirmClear('10') }).click();
    const scope = { label: 'Eidos 7', everything: false };
    await expect(page.getByRole('status').getByText(BULK_COPY.successClear(10, '10', scope), { exact: true })).toBeVisible();
    expect(await stored(page, BULK_DONE_KEY)).toBe('1');

    await tick(page, token, ip, ids);
    await gotoSignedIn(page, '/levels/eidos-7');
    await watchTips(page, 'Eidos 7');
    await untick(page, ids);
    expect(await tipsShown(page)).toBe(0);
    expect(await stored(page, TIP_SHOWN_KEY)).toBeNull();
  });

  test('storage that refuses its flag keeps the tip away, and the unticks still land', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript((key) => {
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, v: string) {
        if (k === key) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        setItem.call(this, k, v);
      };
    }, TIP_SHOWN_KEY);
    const ids = await pick(page, 10);
    await tick(page, token, ip, ids);
    await gotoSignedIn(page, '/levels/eidos-7');
    await watchTips(page, 'Eidos 7');

    await untick(page, ids);
    expect(await tipsShown(page)).toBe(0);
    expect(errors).toEqual([]);
  });
});

test.describe('the hand-clear tip, as a guest', () => {
  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('never shows: a guest tick or untick reaches no server', async ({ page }) => {
    const ids = await pick(page, 10);
    await page.goto('/levels/eidos-7');
    await watchTips(page, 'Eidos 7');
    for (const id of ids) {
      await box(page, id).click();
      await expect(box(page, id)).toHaveAccessibleName('Mark as not found');
    }
    for (const id of ids) {
      await box(page, id).click();
      await expect(box(page, id)).toHaveAccessibleName('Mark as found');
    }
    expect(await tipsShown(page)).toBe(0);
    expect(await stored(page, TIP_SHOWN_KEY)).toBeNull();
  });
});
