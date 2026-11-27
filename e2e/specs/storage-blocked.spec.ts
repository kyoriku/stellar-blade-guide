import { test, expect, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { oauthErrorNotice } from '../../client/src/utils/oauthError';
import { STORAGE_COPY } from '../../client/src/constants/storageCopy';
import { COLLECTIBLES, UPGRADES, COSMETICS } from '../../client/src/constants/navigation';

let fx: Fixtures;
let ip: string;

// Every test here fails on a crash, seen three ways: an error page ever added to the
// page (a crash an error boundary catches raises no pageerror, and a later navigation
// can clear the error page), an uncaught error or rejection, and the error boundary's
// console line. The first depends on ErrorBoundary's title, the third on its log line's
// 'Uncaught error:' prefix: both only check for absence, so mirror any change.
interface Crashes { errorPages: string[]; pageErrors: string[]; boundaryLines: string[] }
let crashes: Crashes;

async function watchForCrashes(page: Page): Promise<Crashes> {
  const seen: Crashes = { errorPages: [], pageErrors: [], boundaryLines: [] };
  await page.exposeBinding('__sbErrorPage', (_source, href: string) => { seen.errorPages.push(href); });
  await page.addInitScript(() => {
    const w = window as unknown as { __sbErrorPage?: (href: string) => void; __sbErrorPages?: string[] };
    w.__sbErrorPages = [];
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          const headings = node.matches('h1') ? [node] : [...node.querySelectorAll('h1')];
          if (!headings.some((h) => h.textContent?.trim() === 'Something went wrong')) continue;
          w.__sbErrorPages?.push(location.href);
          w.__sbErrorPage?.(location.href);
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });
  page.on('pageerror', (e) => seen.pageErrors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && m.text().startsWith('Uncaught error:')) seen.boundaryLines.push(m.text());
  });
  return seen;
}

// Every navigation the page starts, query string included: LoginPage strips its
// parameters as soon as it lands, so the address alone can't tell what was asked for.
async function recordNavigations(page: Page): Promise<string[]> {
  const urls: string[] = [];
  await page.exposeBinding('__sbNavigate', (_source, url: string) => { urls.push(url); });
  await page.addInitScript(() => {
    const w = window as unknown as {
      navigation?: EventTarget;
      __sbNavigate?: (url: string) => void;
    };
    w.navigation?.addEventListener('navigate', (e) => {
      w.__sbNavigate?.((e as unknown as { destination: { url: string } }).destination.url);
    });
  });
  return urls;
}

// A provider press's trip, answered in the browser with 204 No Content, which a
// navigation ignores: the page stays, and neither the server nor the provider is
// contacted. (An aborted trip would commit the browser's own error page.)
async function stopProviderTrips(page: Page): Promise<string[]> {
  const trips: string[] = [];
  await page.route(/\/api\/auth\/(google|discord)$/, (route) => {
    trips.push(new URL(route.request().url()).pathname);
    return route.fulfill({ status: 204 });
  });
  return trips;
}

// The sign-in content block: the heading, the card and the line under it.
const signInBlock = (page: Page) =>
  page.locator('div.max-w-md', { has: page.getByRole('heading', { level: 1 }) });

// With storage refused or switched off, the sign-in pages say so in place of their
// controls: the notice, and nothing to press, type in or follow.
async function expectNotice(page: Page, heading: string, sentence: string) {
  const block = signInBlock(page);
  await expect(block.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  await expect(block.getByText(sentence, { exact: true })).toBeVisible();
  await expect(block.getByText(STORAGE_COPY.guide, { exact: true })).toBeVisible();
  await expect(block.getByRole('button')).toHaveCount(0);
  await expect(block.locator('input')).toHaveCount(0);
  await expect(block.getByRole('link')).toHaveCount(0);
}

// Every sign-in request the page sends.
function recordAuthRequests(page: Page): string[] {
  const paths: string[] = [];
  page.on('request', (r) => {
    const path = new URL(r.url()).pathname;
    if (path.startsWith('/api/auth/')) paths.push(path);
  });
  return paths;
}

type Item = { id: number; title: string; types: string[]; quantity: number | null };

// Ids come from the live catalogue, never literals, so content edits can't break them.
async function eidos7Items(page: Page): Promise<Item[]> {
  const res = await page.request.get('/api/levels/eidos-7');
  expect(res.status()).toBe(200);
  return ((await res.json()) as { collectibles: Item[] }[]).flatMap((l) => l.collectibles);
}

// An Eidos 7 item counted once whose type badge links to a type page; never the fixture,
// which has no type.
async function itemWithTypePage(page: Page): Promise<Item> {
  const names = [...COLLECTIBLES, ...UPGRADES, ...COSMETICS].map((t) => t.name as string);
  const item = (await eidos7Items(page)).find((c) =>
    c.id !== fx.collectibleId && c.quantity === 1 && c.types.length === 1 &&
    names.some((name) => name.startsWith(c.types[0])));
  expect(item, 'an Eidos 7 item with a type page').toBeDefined();
  return item!;
}

const box = (page: Page, id: number) =>
  page.locator(`article#collectible-${id}`).getByRole('button', { name: /Mark as/ });
// The badge comes before any link in the card's text.
const typeBadge = (page: Page, item: Item) =>
  page.locator(`article#collectible-${item.id}`).getByRole('link', { name: item.types[0], exact: true }).first();
const tickedBoxes = (page: Page) => page.getByRole('button', { name: 'Mark as not found' });
const foundNote = (page: Page) => page.getByText(/^· (all )?\d+ found$/);
const logo = (page: Page) =>
  page.getByRole('link').filter({ has: page.getByAltText('Stellar Blade Guide Logo', { exact: true }) });

async function press(page: Page, id: number, to: 'Mark as found' | 'Mark as not found') {
  await box(page, id).click();
  await expect(box(page, id)).toHaveAccessibleName(to);
}

// A guest's tick holds for the page's life, with nowhere to store it.
async function expectGuestTickHolds(page: Page) {
  await page.goto('/levels/eidos-7');
  await expect(
    page.locator('nav').getByRole('link', { name: 'Sign in' }).filter({ visible: true })
  ).toBeVisible();
  const article = page.locator(`article#collectible-${fx.collectibleId}`);
  await expect(article).toBeVisible();
  const toggle = article.getByRole('button', { name: /Mark as/ });
  await toggle.click();
  await expect(toggle).toHaveAccessibleName('Mark as not found');
}

test.beforeAll(() => {
  fx = readFixtures();
});

test.beforeEach(async ({ page, context }) => {
  ip = nextTestIp();
  await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
  crashes = await watchForCrashes(page);
});

test.afterEach(async ({ page }) => {
  // The page's own record covers a report still on its way from the current page.
  const inPage = await page
    .evaluate(() => (window as unknown as { __sbErrorPages?: string[] }).__sbErrorPages ?? [])
    .catch(() => []);
  expect([...crashes.errorPages, ...inPage], 'an error page was shown').toEqual([]);
  expect(crashes.pageErrors, 'uncaught errors').toEqual([]);
  expect(crashes.boundaryLines, "the error boundary's console line").toEqual([]);
});

/**
 * A browser that refuses site storage (Safari "Block all cookies", a per-site
 * cookie block, Firefox with cookies off) makes the window.localStorage getter
 * itself throw. The public guide needs no storage, so it must render signed
 * out, keep a guest's ticks in memory for the tab's life, and never blank the
 * root: the provider's first render reads the session hint, and the root error
 * boundary's fallback used to render a router Link outside the router. The
 * sign-in pages say so in place of their controls.
 */
test.describe('storage refused', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('Access is denied for this document.', 'SecurityError');
        },
      });
    });
  });

  let users: TestUser[] = [];
  let seq = 0;
  test.afterEach(async ({ page }) => {
    for (const user of users) await apiDeleteUser(page, user, ip);
    users = [];
  });

  test('a guide page renders signed out and a guest toggle holds in memory', async ({ page }) => {
    await expectGuestTickHolds(page);
  });

  test("a guest's checkmarks stay through moves within the site, until a reload", async ({ page }) => {
    const item = await itemWithTypePage(page);
    await page.goto('/levels/eidos-7');
    await press(page, fx.collectibleId, 'Mark as not found');
    await press(page, item.id, 'Mark as not found');
    await expect(foundNote(page)).toHaveText('· 2 found');

    // Its type page is another page component, so only the tab's memory can carry them there.
    await typeBadge(page, item).click();
    await expect(page).toHaveURL(/\/(collectibles|upgrades|cosmetics)\/[a-z0-9-]+$/);
    await expect(tickedBoxes(page)).toHaveCount(1);
    await expect(foundNote(page)).toHaveText('· 1 found');

    // Back mounts the level page again, as does the logo, then Back.
    await page.goBack();
    await expect(page).toHaveURL(/\/levels\/eidos-7$/);
    await expect(tickedBoxes(page)).toHaveCount(2);
    await logo(page).click();
    await expect(page).toHaveURL(/\/$/);
    // The level page has gone, so Back mounts it again.
    await expect(box(page, fx.collectibleId)).toHaveCount(0);
    await page.goBack();
    await expect(tickedBoxes(page)).toHaveCount(2);
    await expect(foundNote(page)).toHaveText('· 2 found');

    // Nothing was stored anywhere, so a reload starts again with nothing ticked.
    await page.reload();
    await expect(box(page, fx.collectibleId)).toHaveAccessibleName('Mark as found');
    await expect(tickedBoxes(page)).toHaveCount(0);
  });

  test('a protected route still redirects to login', async ({ page }) => {
    await page.goto('/progress');
    await expect(page).toHaveURL(/\/login/);
  });

  test('sign-in says it needs storage, in place of its controls and of a refused provider sign-in', async ({ page }) => {
    const auth = recordAuthRequests(page);
    await page.goto('/login?oauth_error=expired&provider=google');
    await expectNotice(page, 'Welcome back', STORAGE_COPY.blocked.login);
    await expect(page.getByText(oauthErrorNotice('expired', 'google')!.text)).toHaveCount(0);
    await expect(page).toHaveURL(/\/login$/);
    expect(auth).toEqual([]);
  });

  test('sign-up says it needs storage, in place of its controls', async ({ page }) => {
    const auth = recordAuthRequests(page);
    await page.goto('/register');
    await expectNotice(page, 'Create account', STORAGE_COPY.blocked.register);
    expect(auth).toEqual([]);
  });

  test('the provider callback ends on the sign-in page', async ({ page }) => {
    const navigations = await recordNavigations(page);
    // No refresh cookie, so the refresh is a definitive 401.
    await page.goto('/oauth/callback?token=x');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(STORAGE_COPY.blocked.login, { exact: true })).toBeVisible();
    expect(navigations.some((url) => url.includes('/login'))).toBe(true);
    expect(navigations.filter((url) => url.includes('oauth_error'))).toEqual([]);
  });

  test('a provider callback with a live cookie signs in and lands home', async ({ page }) => {
    const user = makeUser(fx.token, `sr${++seq}`);
    users.push(user);
    // Registering through the API leaves a refresh cookie on the context, as the
    // provider's redirect would; only storage is refused here.
    await apiRegister(page, user, ip);
    await page.goto('/oauth/callback?token=x');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();
  });
});

/**
 * An app's built-in browser with storage switched off (Android's WebView default)
 * has window.localStorage === null, while cookies still work.
 */
test.describe('storage switched off', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { configurable: true, get: () => null });
    });
  });

  test('a guide page renders signed out and a guest toggle holds in memory', async ({ page }) => {
    await expectGuestTickHolds(page);
  });

  test("a guest's checkmark stays through a move to another page", async ({ page }) => {
    await page.goto('/levels/eidos-7');
    await press(page, fx.collectibleId, 'Mark as not found');
    await logo(page).click();
    await expect(page).toHaveURL(/\/$/);
    // The level page has gone, so Back mounts it again.
    await expect(box(page, fx.collectibleId)).toHaveCount(0);
    await page.goBack();
    await expect(box(page, fx.collectibleId)).toHaveAccessibleName('Mark as not found');
  });

  test('sign-in and sign-up say this browser keeps no site data, in place of their controls', async ({ page }) => {
    const auth = recordAuthRequests(page);
    await page.goto('/login');
    await expectNotice(page, 'Welcome back', STORAGE_COPY.off.login);
    await page.goto('/register');
    await expectNotice(page, 'Create account', STORAGE_COPY.off.register);
    expect(auth).toEqual([]);
  });

  test('the provider callback ends on the sign-in page', async ({ page }) => {
    const navigations = await recordNavigations(page);
    await page.goto('/oauth/callback?token=x');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(STORAGE_COPY.off.login, { exact: true })).toBeVisible();
    expect(navigations.some((url) => url.includes('/login'))).toBe(true);
    expect(navigations.filter((url) => url.includes('oauth_error'))).toEqual([]);
  });
});

/**
 * Storage that reads but refuses writes (a full quota). The sign-in pages keep their
 * controls, since storage still reads. The provider press and the callback both
 * write, and must carry on without the write. A return path left by an
 * earlier press must not steer this one, so a press that can't store its own clears
 * the old one.
 */
test.describe('storage that refuses writes', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const setItem = Storage.prototype.setItem;
      setItem.call(window.localStorage, 'oauth_redirect', '/levels');
      Storage.prototype.setItem = function () {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      };
    });
  });

  const storedReturnPath = (page: Page) => page.evaluate(() => localStorage.getItem('oauth_redirect'));
  const accountMenu = (page: Page) => page.getByRole('button', { name: 'Account menu' });

  let users: TestUser[] = [];
  let seq = 0;
  test.afterEach(async ({ page }) => {
    for (const user of users) await apiDeleteUser(page, user, ip);
    users = [];
  });

  test('a password sign-in lands on the home page, signed in', async ({ page, context }) => {
    const user = makeUser(fx.token, `sw${++seq}`);
    users.push(user);
    await apiRegister(page, user, ip);
    await context.clearCookies();
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(accountMenu(page)).toBeVisible();
  });

  test('creating an account lands on the home page, signed in', async ({ page }) => {
    const user = makeUser(fx.token, `sw${++seq}`);
    users.push(user);
    await page.goto('/register');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(accountMenu(page)).toBeVisible();
  });

  test('a provider press from sign-in starts its trip and clears an older return path', async ({ page }) => {
    const trips = await stopProviderTrips(page);
    await page.goto('/login');
    expect(await storedReturnPath(page)).toBe('/levels');
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    await expect.poll(() => trips).toEqual(['/api/auth/google']);
    expect(await storedReturnPath(page)).toBeNull();
  });

  test('a provider press from sign-up starts its trip and clears an older return path', async ({ page }) => {
    const trips = await stopProviderTrips(page);
    await page.goto('/register');
    expect(await storedReturnPath(page)).toBe('/levels');
    await page.getByRole('button', { name: 'Continue with Discord' }).click();
    await expect.poll(() => trips).toEqual(['/api/auth/discord']);
    expect(await storedReturnPath(page)).toBeNull();
  });

  test('a provider callback with a live cookie lands on the stored return path, signed in', async ({ page }) => {
    const user = makeUser(fx.token, `sw${++seq}`);
    users.push(user);
    await apiRegister(page, user, ip);
    await page.goto('/oauth/callback?token=x');
    await expect(page).toHaveURL(/\/levels$/);
    await expect(accountMenu(page)).toBeVisible();
    expect(await storedReturnPath(page)).toBeNull();
  });

  test('the provider callback ends on the sign-in page', async ({ page }) => {
    const navigations = await recordNavigations(page);
    await page.goto('/oauth/callback?token=x');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    expect(navigations.some((url) => url.includes('/login'))).toBe(true);
    expect(navigations.filter((url) => url.includes('oauth_error'))).toEqual([]);
  });
});

/**
 * Storage that refuses writes, holding checkmarks stored before. The tab's changes show
 * over them, for the tab's life.
 */
test.describe('storage that refuses writes, with checkmarks stored before', () => {
  let stored: Item;

  test.beforeEach(async ({ page }) => {
    [stored] = (await eidos7Items(page)).filter((c) => c.id !== fx.collectibleId && c.quantity === 1);
    await page.addInitScript((seed) => {
      const setItem = Storage.prototype.setItem;
      // Once per test, so a reload shows what storage really kept.
      if (!sessionStorage.getItem('sb-test-seeded')) {
        setItem.call(sessionStorage, 'sb-test-seeded', '1');
        setItem.call(window.localStorage, 'sb_progress', JSON.stringify(seed));
      }
      Storage.prototype.setItem = function () {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      };
    }, [stored.id]);
  });

  test("the tab's changes show over the stored checkmarks, until a reload", async ({ page }) => {
    await page.goto('/levels/eidos-7');
    await expect(box(page, stored.id)).toHaveAccessibleName('Mark as not found');
    await press(page, fx.collectibleId, 'Mark as not found');
    await press(page, stored.id, 'Mark as found');
    await expect(box(page, fx.collectibleId)).toHaveAccessibleName('Mark as not found');

    await logo(page).click();
    await expect(page).toHaveURL(/\/$/);
    // The level page has gone, so Back mounts it again.
    await expect(box(page, fx.collectibleId)).toHaveCount(0);
    await page.goBack();
    await expect(box(page, fx.collectibleId)).toHaveAccessibleName('Mark as not found');
    await expect(box(page, stored.id)).toHaveAccessibleName('Mark as found');
    await expect(foundNote(page)).toHaveText('· 1 found');
    expect(await page.evaluate(() => localStorage.getItem('sb_progress'))).toBe(JSON.stringify([stored.id]));

    // A reload undoes the changes.
    await page.reload();
    await expect(box(page, stored.id)).toHaveAccessibleName('Mark as not found');
    await expect(box(page, fx.collectibleId)).toHaveAccessibleName('Mark as found');
  });
});

/**
 * Storage whose reads throw (Firefox's do when it can't open the site's data), with writes
 * left working so a write over unread checkmarks would show. The checkmarks stored before
 * can't be shown, and a tick must never write over them.
 */
test.describe('storage that refuses reads, with checkmarks stored before', () => {
  let stored: Item;

  test.beforeEach(async ({ page }) => {
    [stored] = (await eidos7Items(page)).filter((c) => c.id !== fx.collectibleId && c.quantity === 1);
    await page.addInitScript((seed) => {
      const getItem = Storage.prototype.getItem;
      // Once per test, before reads start failing.
      if (!getItem.call(sessionStorage, 'sb-test-seeded')) {
        sessionStorage.setItem('sb-test-seeded', '1');
        localStorage.setItem('sb_progress', JSON.stringify(seed));
      }
      // The test reads what storage holds through the original.
      (window as unknown as { __sbStored: () => string | null }).__sbStored = () => getItem.call(localStorage, 'sb_progress');
      Storage.prototype.getItem = function (this: Storage, key: string) {
        if (this === window.localStorage) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        return getItem.call(this, key);
      };
    }, [stored.id]);
  });

  test('a tick never writes over checkmarks it could not read', async ({ page }) => {
    await page.goto('/levels/eidos-7');
    await expect(box(page, stored.id)).toHaveAccessibleName('Mark as found');
    await press(page, fx.collectibleId, 'Mark as not found');
    const held = await page.evaluate(() => (window as unknown as { __sbStored: () => string | null }).__sbStored());
    expect(held).toBe(JSON.stringify([stored.id]));
  });
});
