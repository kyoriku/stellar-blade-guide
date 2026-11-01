import { test, expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import {
  readFixtures, insertComment, commentRows, deleteFixtureComments, redisClient,
  setUserRole, setUserActive, userRow, type Fixtures,
} from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { holdRoute } from '../helpers/route';
import { ADMIN_COPY } from '../../client/src/constants/adminCopy';

// The admin page (/admin): every account, newest first and searchable, with each
// address masked until it is revealed on its own, and roles, deactivation and
// deletion. Admins only: anyone else signed in gets the 404 page, and the server
// checks every request. No route can make an admin, so each test makes its own by
// SQL, as the real one was made. Its targets register first and the admin last, so
// the admin is the newest account and the page's cookie holds its session.

// Join dates and counts are formatted in the browser's locale; pin it.
test.use({ locale: 'en-US' });

let fx: Fixtures;

interface Account extends TestUser {
  ip: string; // its own address, for its registration, its sign-ins and its cleanup
  id: number;
}

// Every account the running test made, swept after it.
let made: Account[] = [];

async function register(page: Page, name: string, email?: string): Promise<Account> {
  const user = makeUser(fx.token, name);
  if (email) user.email = email;
  const ip = nextTestIp();
  await apiRegister(page, user, ip);
  const row = await userRow(user.username);
  const account = { ...user, ip, id: row!.id };
  made.push(account);
  return account;
}

// Registered after its targets, then made an admin by SQL before the page signs in.
async function registerAdmin(page: Page, name = 'admin'): Promise<Account> {
  const admin = await register(page, name);
  expect(await setUserRole(admin.username, 'admin')).toBe(true);
  await page.context().setExtraHTTPHeaders({ [TEST_IP_HEADER]: admin.ip });
  await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  return admin;
}

// Every refresh key the account has: its session families and their tokens.
async function sessionKeys(uid: number): Promise<string[]> {
  const redis = redisClient();
  try {
    const found: string[] = [];
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', `refresh:${uid}:*`, 'COUNT', 200);
      cursor = next;
      found.push(...keys);
    } while (cursor !== '0');
    return found;
  } finally {
    redis.disconnect();
  }
}

// A password sign-in in a cookie jar of its own, so the page keeps the admin's session.
async function signInStatus(request: APIRequestContext, account: Account): Promise<number> {
  const res = await request.post('/api/auth/login', {
    data: { email: account.email, password: account.password },
    headers: { [TEST_IP_HEADER]: account.ip },
  });
  return res.status();
}

type ListedRow = {
  id: number;
  username: string;
  avatar_url: string | null;
  email_masked: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

const ROW_KEYS = ['avatar_url', 'created_at', 'email_masked', 'id', 'is_active', 'role', 'username'];
// mask_email: the first character of each half and the domain's last label, or *** whole.
const MASKED = /^[^@]\*\*\*@[^@.]\*\*\*\.[^@.]+$|^\*\*\*$/;

// An answer of AdminUser rows holds no whole address: none of these accounts', no
// email field, and every row's address in the masked shape. Only ids are printed.
function expectNoWholeAddress(body: string, accounts: Account[]): void {
  for (const account of accounts) {
    expect(body.toLowerCase().includes(account.email.toLowerCase()), `${account.username}'s address is in the answer`).toBe(false);
  }
  const rows = JSON.parse(body) as Record<string, unknown>[];
  expect(rows.filter(r => Object.keys(r).sort().join() !== ROW_KEYS.join()).map(r => r.id), 'rows with other fields').toEqual([]);
  expect(rows.filter(r => !MASKED.test(String(r.email_masked))).map(r => r.id), 'rows with an unmasked address').toEqual([]);
}

const usersTable = (page: Page) => page.getByRole('table', { name: ADMIN_COPY.usersHeading, exact: true });
const usersHeading = (page: Page) => page.getByRole('heading', { name: ADMIN_COPY.usersHeading, exact: true });
const rowOf = (page: Page, account: Account) => page.locator(`[data-admin-row="${account.id}"]`);
const cellsOf = (page: Page, account: Account) => rowOf(page, account).getByRole('cell');
const actionsButton = (page: Page, account: Account) =>
  page.getByRole('button', { name: ADMIN_COPY.actionsFor(account.username), exact: true });
const actionsMenu = (page: Page, account: Account) =>
  page.getByRole('menu', { name: ADMIN_COPY.actionsFor(account.username), exact: true });
const menuItem = (page: Page, account: Account, name: string) =>
  actionsMenu(page, account).getByRole('menuitem', { name, exact: true });
const revealButton = (page: Page, account: Account) =>
  page.getByRole('button', { name: ADMIN_COPY.revealFor(account.username), exact: true });
const hideButton = (page: Page, account: Account) =>
  page.getByRole('button', { name: ADMIN_COPY.hideFor(account.username), exact: true });
const searchBox = (page: Page) => page.getByLabel(ADMIN_COPY.searchLabel, { exact: true });
// The count above the list.
const statusLine = (page: Page) => page.locator('p[aria-live="polite"]');
// The page's own announcements; an open dialog has a live region of its own.
const announcement = (page: Page) => page.locator('span.sr-only[aria-live="polite"]:not(dialog *)');
// Results are toasts; the toast container is the page's only role="status".
const toast = (page: Page, text: string) => page.getByRole('status').getByText(text, { exact: true });
const pageNotFound = (page: Page) => page.getByRole('heading', { level: 1, name: 'Page Not Found', exact: true });
const walkthroughPath = () => `/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`;
// A comment's own block is its first child; its replies come after.
const ownComment = (page: Page, id: number) => page.locator(`#comment-${id}`).locator(':scope > div').first();

async function gotoAdmin(page: Page): Promise<{ rows: ListedRow[]; body: string; cacheControl: string }> {
  const listed = page.waitForResponse(r => new URL(r.url()).pathname === '/api/admin/users' && r.request().method() === 'GET');
  await page.goto('/admin');
  const res = await listed;
  expect(res.status()).toBe(200);
  const body = await res.text();
  await expect(usersTable(page)).toBeVisible();
  return { rows: JSON.parse(body) as ListedRow[], body, cacheControl: res.headers()['cache-control'] ?? '' };
}

// Through the account menu, as an admin goes, with no reload.
async function openAdminFromMenu(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('link', { name: ADMIN_COPY.navLink, exact: true }).filter({ visible: true }).click();
  await expect(usersTable(page)).toBeVisible();
}

const size = (b: { width: number; height: number } | null) => b && { width: b.width, height: b.height };

// Read out but not shown: an sr-only box.
async function visuallyHidden(locator: Locator): Promise<boolean> {
  const b = await locator.boundingBox();
  return b !== null && b.width <= 1 && b.height <= 1;
}

// The row ids the table shows, in its order.
const tableIds = (page: Page) =>
  usersTable(page).locator('[data-admin-row]').evaluateAll(rows => rows.map(r => Number(r.getAttribute('data-admin-row'))));

// The join date as a row shows it, in the browser's own locale and zone.
const joinedText = (page: Page, iso: string) =>
  page.evaluate(d => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }), iso);

// A reload clears window properties; client-side navigation keeps them.
const markNoReload = (page: Page) =>
  page.evaluate(() => { (window as unknown as { __adminNoReload?: boolean }).__adminNoReload = true; });
const stillNoReload = (page: Page) =>
  page.evaluate(() => (window as unknown as { __adminNoReload?: boolean }).__adminNoReload === true);

/** Two zero-delay task hops, so React has committed what a settled fetch set. */
async function settle(page: Page): Promise<void> {
  for (let i = 0; i < 2; i++) await page.evaluate(() => new Promise<void>(r => setTimeout(r, 0)));
}

// Notes, for every toast that appears, whether a modal dialog was still open: one
// shown under the backdrop would be dimmed and inert.
const watchToasts = (page: Page) =>
  page.evaluate(() => {
    const underModal: boolean[] = [];
    (window as unknown as { __toastsUnderModal: boolean[] }).__toastsUnderModal = underModal;
    new MutationObserver(records => records.forEach(r => r.addedNodes.forEach(() => {
      underModal.push(document.querySelector('dialog[open]') !== null);
    }))).observe(document.querySelector('[role="status"]')!, { childList: true });
  });
const toastsUnderModal = (page: Page) =>
  page.evaluate(() => (window as unknown as { __toastsUnderModal: boolean[] }).__toastsUnderModal);

test.beforeAll(() => {
  fx = readFixtures();
});

test.beforeEach(async ({ context }) => {
  made = [];
  // A private address for anything the page asks before a test names its own.
  await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
});

test.afterEach(async ({ page }) => {
  await deleteFixtureComments(fx);
  const accounts = made;
  made = [];
  for (const account of accounts) {
    // A plain active account again, so its own deletion route takes it: an admin's is
    // refused, and a deactivated one can't sign in. One the test deleted is gone already.
    await setUserRole(account.username, 'user');
    await setUserActive(account.username, true);
    await apiDeleteUser(page, account, account.ip);
  }
  // Nothing a test made outlives it: no account, and no session in Redis.
  for (const account of accounts) {
    expect(await userRow(account.username), `${account.username} was left behind`).toBeNull();
    expect(await sessionKeys(account.id), `${account.username}'s sessions were left behind`).toEqual([]);
  }
});

test.describe('who reaches the admin page', () => {
  for (const role of ['user', 'moderator'] as const) {
    test(`a ${role} has no Admin link, and /admin is the 404 page with nothing asked of the admin API`, async ({ page }) => {
      const account = await register(page, `not${role}`);
      if (role === 'moderator') expect(await setUserRole(account.username, 'moderator')).toBe(true);
      await page.context().setExtraHTTPHeaders({ [TEST_IP_HEADER]: account.ip });
      await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
      const asked: string[] = [];
      page.on('request', r => {
        const url = new URL(r.url());
        if (url.pathname.startsWith('/api/admin')) asked.push(`${r.method()} ${url.pathname}`);
      });

      await page.goto('/');
      await page.getByRole('button', { name: 'Account menu' }).click();
      await expect(page.getByRole('link', { name: 'Settings', exact: true }).filter({ visible: true })).toBeVisible();
      await expect(page.getByRole('link', { name: ADMIN_COPY.navLink, exact: true })).toHaveCount(0);

      // The drawer keeps its single row of buttons.
      await page.setViewportSize({ width: 320, height: 720 });
      await page.getByRole('button', { name: 'Toggle menu' }).click();
      const drawer = page.locator('#mobile-menu');
      await expect(drawer.getByRole('button', { name: 'Sign out' })).toBeVisible();
      const tops = [];
      for (const control of [
        drawer.getByRole('link', { name: 'Progress', exact: true }),
        drawer.getByRole('link', { name: 'Settings', exact: true }),
        drawer.getByRole('button', { name: 'Sign out' }),
      ]) tops.push(Math.round((await control.boundingBox())!.y));
      expect(new Set(tops).size, `one row: ${JSON.stringify(tops)}`).toBe(1);
      await expect(drawer.getByRole('link', { name: ADMIN_COPY.navLink, exact: true })).toHaveCount(0);

      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/admin');
      await expect(pageNotFound(page)).toBeVisible();
      await expect(page).toHaveTitle('404 Page Not Found | Stellar Blade Guide');
      await expect(page).toHaveURL('/admin');
      await settle(page);
      expect(asked).toEqual([]);
    });
  }

  test('signed out, /admin goes to the login page, which comes back to it once an admin signs in', async ({ page }) => {
    const admin = await register(page, 'loginadmin');
    expect(await setUserRole(admin.username, 'admin')).toBe(true);
    // Signed out: the registration's cookie goes, and with no session hint the page asks nothing.
    await page.context().clearCookies();
    await page.context().setExtraHTTPHeaders({ [TEST_IP_HEADER]: admin.ip });
    const asked: string[] = [];
    page.on('request', r => {
      const url = new URL(r.url());
      if (url.pathname.startsWith('/api/admin')) asked.push(`${r.method()} ${url.pathname}`);
    });

    await page.goto('/admin');
    await expect(page).toHaveURL('/login');
    expect(asked).toEqual([]);

    await page.getByLabel('Email').fill(admin.email);
    await page.getByLabel('Password').fill(admin.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL('/admin');
    await expect(page.getByRole('heading', { level: 1, name: ADMIN_COPY.pageHeading, exact: true })).toBeVisible();
    await expect(usersTable(page)).toBeVisible();
    // The same listener sees the admin's own requests, so the empty list above means none were sent.
    expect(asked).toContain('GET /api/admin/users');
  });

  test("an admin reaches it from the account menu, and at 320px from the drawer's second row", async ({ page }) => {
    await registerAdmin(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Account menu' }).click();
    const settings = page.getByRole('link', { name: 'Settings', exact: true }).filter({ visible: true });
    const link = page.getByRole('link', { name: ADMIN_COPY.navLink, exact: true }).filter({ visible: true });
    const signOut = page.getByRole('button', { name: 'Sign out' }).filter({ visible: true });
    await expect(link).toBeVisible();
    // Between Settings and Sign out.
    const [s, l, o] = [await settings.boundingBox(), await link.boundingBox(), await signOut.boundingBox()];
    expect(s!.y < l!.y && l!.y < o!.y, 'Settings, Admin, Sign out').toBe(true);
    await link.click();
    await expect(page).toHaveURL('/admin');
    await expect(page).toHaveTitle('Admin | Stellar Blade Guide');
    await expect(page.getByRole('heading', { level: 1, name: ADMIN_COPY.pageHeading, exact: true })).toBeVisible();
    await expect(usersTable(page)).toBeVisible();

    // Four buttons don't fit one row at 320px: Progress and Settings, then Admin and Sign out.
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    const drawer = page.locator('#mobile-menu');
    const drawerLink = drawer.getByRole('link', { name: ADMIN_COPY.navLink, exact: true });
    await expect(drawerLink).toBeVisible();
    // Measured in one frame, so the drawer's slide can't move one box and not another.
    const grid = await drawer.evaluate(el => {
      const box = (text: string) => {
        const control = [...el.querySelectorAll('a, button')].find(c => c.textContent?.trim() === text)!;
        const b = control.getBoundingClientRect();
        return { x: Math.round(b.left), y: Math.round(b.top) };
      };
      return { progress: box('Progress'), settings: box('Settings'), admin: box('Admin'), signOut: box('Sign out') };
    });
    expect(grid.progress.y, 'Progress and Settings share the first row').toBe(grid.settings.y);
    expect(grid.admin.y, 'Admin and Sign out share the second row').toBe(grid.signOut.y);
    expect(grid.admin.y).toBeGreaterThan(grid.progress.y);
    expect(grid.admin.x, 'Admin under Progress').toBe(grid.progress.x);
    expect(grid.signOut.x, 'Sign out under Settings').toBe(grid.settings.x);
    await drawerLink.click();
    await expect(page).toHaveURL('/admin');
    await expect(page.getByRole('button', { name: 'Toggle menu' })).toHaveAttribute('aria-expanded', 'false');
    await expect(usersTable(page)).toBeVisible();
  });
});

test.describe('the list', () => {
  interface Expected {
    account: Account;
    status: 'active' | 'deactivated';
    pill?: 'moderator' | 'admin';
    you?: boolean;
  }

  // A regular expression matching the text as written.
  const literally = (text: string) => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

  // As the accessibility tree reads it: four column headers, Actions read out but never
  // shown, and each row exactly four cells in the header's order (the wrappers between
  // a row and its cells are role="none"). From lg the header row shows; below it the
  // header row is read out but hidden, an active row's status likewise, and the date
  // reads "Joined …".
  async function expectTable(page: Page, expected: Expected[], created: Map<number, string>, width: 'desktop' | 'phone') {
    const table = usersTable(page);
    const headers = table.getByRole('columnheader');
    await expect(table.getByRole('row').first(), `${width}: header row`).toMatchAriaSnapshot([
      '- row:',
      '  - /children: equal',
      `  - columnheader "${ADMIN_COPY.columnAccount}"`,
      `  - columnheader "${ADMIN_COPY.columnStatus}"`,
      `  - columnheader "${ADMIN_COPY.columnJoined}"`,
      `  - columnheader "${ADMIN_COPY.columnActions}"`,
    ].join('\n'));
    if (width === 'phone') {
      expect(await visuallyHidden(table.getByRole('row').first()), `${width}: header row read out, not shown`).toBe(true);
    } else {
      for (let i = 0; i < 3; i++) expect(await visuallyHidden(headers.nth(i)), `${width}: header ${i} shown`).toBe(false);
      expect(await visuallyHidden(headers.nth(3).locator('span')), `${width}: Actions header read out, not shown`).toBe(true);
    }
    expect((await tableIds(page)).slice(0, expected.length), `${width}: newest first`).toEqual(expected.map(e => e.account.id));

    for (const e of expected) {
      const name = e.account.username;
      const status = e.status === 'active' ? ADMIN_COPY.statusActive : ADMIN_COPY.statusDeactivated;
      const date = await joinedText(page, created.get(e.account.id)!);
      await expect(rowOf(page, e.account), `${width}: ${name}`).toMatchAriaSnapshot([
        '- row:',
        '  - /children: equal',
        `  - cell /${literally(name)}/`,
        `  - cell "${status}"`,
        `  - cell "${width === 'phone' ? `${ADMIN_COPY.joined} ${date}` : date}"`,
        `  - cell "${e.pill === 'admin' ? ADMIN_COPY.noActions : ADMIN_COPY.actionsFor(name)}"`,
      ].join('\n'));

      const cells = cellsOf(page, e.account);
      for (const pill of [ADMIN_COPY.roleModerator, ADMIN_COPY.roleAdmin]) {
        const shown = (e.pill === 'moderator' && pill === ADMIN_COPY.roleModerator) || (e.pill === 'admin' && pill === ADMIN_COPY.roleAdmin);
        await expect(cells.nth(0).getByText(pill, { exact: true }), `${width}: ${name} ${pill} pill`).toHaveCount(shown ? 1 : 0);
      }
      await expect(cells.nth(0).getByText(ADMIN_COPY.you, { exact: true })).toHaveCount(e.you ? 1 : 0);
      const hidden = width === 'phone' && e.status === 'active';
      expect(await visuallyHidden(cells.nth(1)), `${width}: ${name} status ${hidden ? 'read out, not shown' : 'shown'}`).toBe(hidden);

      if (e.pill === 'admin') {
        await expect(cells.nth(3)).toHaveText(ADMIN_COPY.noActions);
      } else {
        await expect(cells.nth(3).getByRole('button', { name: ADMIN_COPY.actionsFor(name), exact: true })).toBeVisible();
      }
    }
  }

  test('lists every account newest first, as a table at desktop and phone widths, and never sends a whole address', async ({ page }) => {
    const plain = await register(page, 'listplain');
    const mod = await register(page, 'listmod');
    expect(await setUserRole(mod.username, 'moderator')).toBe(true);
    const off = await register(page, 'listoff');
    expect(await setUserActive(off.username, false)).toBe(true);
    const admin = await registerAdmin(page);

    const { rows, body, cacheControl } = await gotoAdmin(page);
    expect(cacheControl).toContain('no-store');
    // The admin registered last, then the targets in reverse.
    const mine = [admin, off, mod, plain];
    expect(rows.slice(0, mine.length).map(r => r.id), 'newest first').toEqual(mine.map(a => a.id));
    expectNoWholeAddress(body, mine);
    await expect(statusLine(page)).toHaveText(ADMIN_COPY.accounts(rows.length, rows.length.toLocaleString('en-US')));

    const created = new Map(rows.map(r => [r.id, r.created_at]));
    const expected: Expected[] = [
      { account: admin, status: 'active', pill: 'admin', you: true },
      { account: off, status: 'deactivated' },
      { account: mod, status: 'active', pill: 'moderator' },
      { account: plain, status: 'active' },
    ];
    await expectTable(page, expected, created, 'desktop');
    await page.setViewportSize({ width: 375, height: 812 });
    await expectTable(page, expected, created, 'phone');
  });

  test('searches usernames by any part and addresses only whole, in either case', async ({ page }) => {
    const one = await register(page, 'findme1');
    const two = await register(page, 'findme2');
    const admin = await registerAdmin(page, 'searcher');
    const { rows } = await gotoAdmin(page);
    const searched = (q: string) => page.waitForResponse(r =>
      new URL(r.url()).pathname === '/api/admin/users/search' && (r.request().postDataJSON() as { q: string }).q === q);

    // Part of a username, in another case, with spaces around it: trimmed before it goes.
    const part = `${fx.token}_FINDME`;
    let answer = searched(part);
    await searchBox(page).fill(`  ${part}  `);
    let res = await answer;
    // A POST, so a typed address stays out of the URL.
    expect(res.request().method()).toBe('POST');
    expect(new URL(res.request().url()).search).toBe('');
    expect(res.headers()['cache-control']).toContain('no-store');
    await expect(statusLine(page)).toHaveText(ADMIN_COPY.accountsMatch(2, '2'));
    expect(await tableIds(page)).toEqual([two.id, one.id]);
    expectNoWholeAddress(await res.text(), [one, two, admin]);

    // A whole address matches in any case.
    answer = searched(one.email.toUpperCase());
    await searchBox(page).fill(one.email.toUpperCase());
    res = await answer;
    await expect(statusLine(page)).toHaveText(ADMIN_COPY.accountsMatch(1, '1'));
    expect(await tableIds(page)).toEqual([one.id]);
    expectNoWholeAddress(await res.text(), [one, two, admin]);

    // Part of an address matches nothing.
    const partial = one.email.slice(0, one.email.lastIndexOf('.'));
    answer = searched(partial);
    await searchBox(page).fill(partial);
    expect(await (await answer).json()).toEqual([]);
    await expect(statusLine(page)).toHaveText(ADMIN_COPY.noMatches);
    await expect(usersTable(page)).toHaveCount(0);

    // Clearing the search brings every account back and leaves focus in the box.
    const listed = page.waitForResponse(r => new URL(r.url()).pathname === '/api/admin/users' && r.request().method() === 'GET');
    await page.getByRole('button', { name: ADMIN_COPY.clearSearch, exact: true }).click();
    await expect(searchBox(page)).toBeFocused();
    await expect(searchBox(page)).toHaveValue('');
    const all = (await (await listed).json()) as ListedRow[];
    expect(all.length).toBe(rows.length);
    await expect(statusLine(page)).toHaveText(ADMIN_COPY.accounts(all.length, all.length.toLocaleString('en-US')));
    expect((await tableIds(page)).slice(0, 3)).toEqual([admin.id, two.id, one.id]);
  });

  test('at phone widths the rows stack, the eye sits before the address, and a long address breaks only after the @ or before a dot', async ({ page }) => {
    const plain = await register(page, 'stack');
    const long = await register(page, 'longaddr', `helpful.moderator.account.${fx.token}@example.com`);
    const off = await register(page, 'stackoff');
    expect(await setUserActive(off.username, false)).toBe(true);
    await registerAdmin(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoAdmin(page);

    // Settings' card, padded 16px on phones as the legal pages are.
    const card = page.locator('section').filter({ has: usersHeading(page) });
    const padding = () => card.evaluate(el => {
      const s = getComputedStyle(el);
      return [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft];
    });
    expect(await padding()).toEqual(['16px', '16px', '16px', '16px']);

    // An active row shows no status, though its cell is still read out; a deactivated one shows its pill.
    await expect(cellsOf(page, plain).nth(1)).toHaveAccessibleName(ADMIN_COPY.statusActive);
    expect(await visuallyHidden(cellsOf(page, plain).nth(1)), 'active status read out, not shown').toBe(true);
    await expect(cellsOf(page, off).nth(1).getByText(ADMIN_COPY.statusDeactivated, { exact: true })).toBeVisible();
    expect(await visuallyHidden(cellsOf(page, off).nth(1)), 'deactivated status shown').toBe(false);

    // As in the mock: the pill doesn't make its row taller than an active one, and the
    // dot sits 8px from the pill and from "Joined".
    const heightOf = async (account: Account) => (await rowOf(page, account).boundingBox())!.height;
    expect(await heightOf(off), 'a deactivated row is as tall as an active one').toBe(await heightOf(plain));
    const gaps = await rowOf(page, off).evaluate(row => {
      const pill = row.querySelectorAll('[role="cell"]')[1].querySelector('span')!.getBoundingClientRect();
      const joined = row.querySelectorAll('[role="cell"]')[2];
      const glyph = document.createRange();
      glyph.selectNodeContents(joined.querySelector('span[aria-hidden]')!);
      const dot = glyph.getBoundingClientRect();
      const word = document.createRange();
      word.selectNodeContents(joined.querySelectorAll('span')[1]);
      return { before: dot.left - pill.right, after: word.getBoundingClientRect().left - dot.right };
    });
    for (const [side, gap] of Object.entries(gaps)) {
      expect(gap, `${side} the dot`).toBeGreaterThan(7);
      expect(gap, `${side} the dot`).toBeLessThan(9);
    }
    // The pill's box spills past its 16px line, and the line, which clips sideways for
    // the dot, cuts off neither its top nor its bottom edge.
    const edgesHidden = await rowOf(page, off).evaluate(row => {
      const pill = row.querySelectorAll('[role="cell"]')[1].querySelector('span')!;
      const b = pill.getBoundingClientRect();
      return [b.top + 0.5, b.bottom - 0.5].map(y => document.elementFromPoint(b.left + b.width / 2, y) !== pill);
    });
    expect(edgesHidden, "the pill's top and bottom edges hidden").toEqual([false, false]);

    // The search box keeps room on the right for Clear search only while it shows, so
    // the placeholder has the room otherwise, as in the mock.
    const rightPadding = () => searchBox(page).evaluate(el => getComputedStyle(el).paddingRight);
    expect(await rightPadding()).toBe('12px');
    await searchBox(page).fill('x');
    await expect(page.getByRole('button', { name: ADMIN_COPY.clearSearch, exact: true })).toBeVisible();
    expect(await rightPadding()).toBe('36px');
    await page.getByRole('button', { name: ADMIN_COPY.clearSearch, exact: true }).click();
    await expect(statusLine(page)).toHaveText(/^\d+ accounts?$/);

    // The "…" is the bare icon in a 40px tap area: no border, no fill, its icon on the
    // card's content edge and centred on the name line.
    const dots = await actionsButton(page, plain).evaluate((button, name) => {
      const s = getComputedStyle(button);
      const b = button.getBoundingClientRect();
      const card = button.closest('section')!;
      const c = getComputedStyle(card);
      const contentRight = card.getBoundingClientRect().right - parseFloat(c.borderRightWidth) - parseFloat(c.paddingRight);
      const icon = button.querySelector('svg')!.getBoundingClientRect();
      const row = button.closest('[data-admin-row]')!;
      const nameBox = [...row.querySelectorAll('span')].find(el => el.textContent === name)!.getBoundingClientRect();
      return {
        box: [b.width, b.height],
        border: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth],
        fill: s.backgroundColor,
        offEdge: Math.abs(icon.right - contentRight),
        offCentre: Math.abs((icon.top + icon.bottom) / 2 - (nameBox.top + nameBox.bottom) / 2),
      };
    }, plain.username);
    expect({ box: dots.box, border: dots.border, fill: dots.fill }).toEqual({
      box: [40, 40], border: ['0px', '0px', '0px', '0px'], fill: 'rgba(0, 0, 0, 0)',
    });
    expect(dots.offEdge, 'icon on the content edge').toBeLessThan(1);
    expect(dots.offCentre, 'icon centred on the name line').toBeLessThan(1);

    // The eye alone, before the address: a 28px tap area that stops short of the address.
    const eye = (button: Locator) => button.evaluate(el => {
      const b = el.getBoundingClientRect();
      const icon = el.querySelector('svg')!.getBoundingClientRect();
      const address = el.parentElement!.querySelector(':scope > span')!.getBoundingClientRect();
      return {
        tap: [b.width, b.height], right: b.right, text: (el as HTMLElement).innerText.trim(),
        icon: { x: icon.left, y: icon.top, width: icon.width, right: icon.right },
        addressLeft: address.left,
      };
    });
    const plainEye = await eye(revealButton(page, plain));
    expect({ tap: plainEye.tap, iconWidth: plainEye.icon.width, text: plainEye.text }).toEqual({ tap: [28, 28], iconWidth: 16, text: '' });
    expect(plainEye.icon.right, 'the eye comes first').toBeLessThan(plainEye.addressLeft);
    expect(plainEye.right, 'its tap area stops short of the address').toBeLessThanOrEqual(plainEye.addressLeft);

    // A long address, revealed: it wraps in its own box beside the eye, which stays put,
    // and breaks only after the @ or before a dot, never inside a word.
    const lines = () => hideButton(page, long).evaluate(button => {
      const address = button.parentElement!.querySelector(':scope > span')!;
      const found: { top: number; left: number; text: string }[] = [];
      const walker = document.createTreeWalker(address, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent ?? '';
        for (let i = 0; i < text.length; i++) {
          const range = document.createRange();
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          const b = range.getBoundingClientRect();
          const line = found.find(l => Math.abs(l.top - b.top) < b.height / 2);
          if (line) {
            line.text += text[i];
            line.left = Math.min(line.left, b.left);
          } else {
            found.push({ top: b.top, left: b.left, text: text[i] });
          }
        }
      }
      return found.sort((a, b) => a.top - b.top);
    });
    const domain = long.email.slice(long.email.lastIndexOf('@') + 1);
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 });
      const before = await eye(revealButton(page, long));
      await revealButton(page, long).click();
      await expect(hideButton(page, long)).toBeVisible();
      await expect(rowOf(page, long)).toContainText(long.email);
      const after = await eye(hideButton(page, long));
      const moved = Math.max(Math.abs(after.icon.x - before.icon.x), Math.abs(after.icon.y - before.icon.y));
      expect(moved, `${width}: the eye stays put`).toBeLessThan(0.5);

      const shown = await lines();
      const texts = shown.map(l => l.text);
      expect(texts.join(''), `${width}: every character, in order`).toBe(long.email);
      expect(texts.length, `${width}: wraps: ${JSON.stringify(texts)}`).toBeGreaterThan(1);
      for (let i = 1; i < texts.length; i++) {
        expect(texts[i - 1].endsWith('@') || texts[i].startsWith('.'), `${width}: a break inside a word: ${JSON.stringify(texts)}`).toBe(true);
      }
      expect(texts.some(t => t.includes(domain)), `${width}: the domain stays whole: ${JSON.stringify(texts)}`).toBe(true);
      for (const line of shown) expect(line.left, `${width}: wraps beside the eye: ${JSON.stringify(texts)}`).toBeGreaterThan(after.icon.right);

      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `${width}: no sideways scroll`).toBeLessThanOrEqual(0);
      await hideButton(page, long).click();
      await expect(revealButton(page, long)).toBeVisible();
    }

    // The typed Delete dialog sits 16px from the top on phones, where the iOS keyboard
    // can't cover its input.
    await page.setViewportSize({ width: 375, height: 812 });
    await actionsButton(page, plain).click();
    await menuItem(page, plain, ADMIN_COPY.delete).click();
    const typed = page.getByRole('alertdialog', { name: ADMIN_COPY.deleteTitle, exact: true });
    await expect(typed.getByLabel(ADMIN_COPY.deleteConfirmLabel(plain.username), { exact: true })).toBeFocused();
    expect((await typed.boundingBox())!.y).toBe(16);
    await typed.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(typed).toHaveCount(0);

    // From md the card's padding is 24px.
    await page.setViewportSize({ width: 1280, height: 812 });
    expect(await padding()).toEqual(['24px', '24px', '24px', '24px']);
  });
});

test.describe('the actions', () => {
  test('Reveal shows one whole address, answered no-store, until Hide, and each Reveal asks again', async ({ page }) => {
    const target = await register(page, 'reveal');
    const other = await register(page, 'revealother');
    await registerAdmin(page);
    const reveals: string[] = [];
    page.on('request', r => {
      if (r.method() === 'POST' && new URL(r.url()).pathname === `/api/admin/users/${target.id}/email`) reveals.push(r.url());
    });
    await gotoAdmin(page);
    const row = rowOf(page, target);
    await expect(row).toContainText('e***@s***.dev');
    expect(await page.content(), 'no address before Reveal').not.toContain(target.email);

    // Busy while it loads, at the same size.
    const held = await holdRoute(page, `**/api/admin/users/${target.id}/email`);
    const reveal = revealButton(page, target);
    const idle = size(await reveal.boundingBox());
    const answered = page.waitForResponse(r => new URL(r.url()).pathname === `/api/admin/users/${target.id}/email`);
    await reveal.click();
    await held.seen;
    await expect(reveal).toHaveAttribute('aria-busy', 'true');
    await expect(reveal.getByText(ADMIN_COPY.revealing)).toBeVisible();
    expect(size(await reveal.boundingBox())).toEqual(idle);
    held.release();
    const res = await answered;
    expect(res.headers()['cache-control']).toContain('no-store');
    expect(await res.json()).toEqual({ id: target.id, email: target.email });

    // The address, and Hide on the same button, which keeps focus. Only the button's
    // name changes where focus is, so the address is read out.
    await expect(row).toContainText(target.email);
    await expect(hideButton(page, target)).toBeFocused();
    await expect(announcement(page)).toHaveText(target.email);
    await expect(rowOf(page, other)).not.toContainText(other.email);
    expect(
      await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage })),
      'never stored',
    ).not.toContain(target.email);

    await hideButton(page, target).click();
    await expect(reveal).toBeVisible();
    expect(await page.content(), 'Hide removes it').not.toContain(target.email);

    await reveal.click();
    await expect(row).toContainText(target.email);
    expect(reveals, 'each Reveal asks again').toHaveLength(2);

    // Leaving the page drops it: back again, the row is masked and nothing is asked.
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('link', { name: 'Settings', exact: true }).filter({ visible: true }).click();
    await expect(page).toHaveURL('/settings');
    await page.goBack();
    await expect(row).toContainText('e***@s***.dev');
    expect(await page.content()).not.toContain(target.email);
    expect(reveals).toHaveLength(2);
  });

  test("promoting and demoting change the row at once, and the target's comment badge follows without a reload", async ({ page }) => {
    const target = await register(page, 'promo');
    await registerAdmin(page);
    const text = `E2E ${fx.token} promo comment`;
    const commentId = await insertComment(fx, { username: target.username, body: text, postedAt: '2026-01-01T12:00:00Z', changedAt: '2026-01-01T12:00:00Z' });
    const badge = ownComment(page, commentId).getByText(ADMIN_COPY.roleModerator, { exact: true });

    // The thread first, so this tab holds its comments in the cache.
    await page.goto(walkthroughPath());
    await expect(ownComment(page, commentId)).toContainText(text);
    await expect(badge).toHaveCount(0);
    await markNoReload(page);
    await openAdminFromMenu(page);

    const trigger = actionsButton(page, target);
    const idle = size(await trigger.boundingBox());
    const put = await holdRoute(page, `**/api/admin/users/${target.id}/role`);
    const sent = page.waitForRequest(r => new URL(r.url()).pathname === `/api/admin/users/${target.id}/role`);
    await trigger.click();
    await menuItem(page, target, ADMIN_COPY.makeModerator).click();
    const request = await sent;
    expect([request.method(), request.postDataJSON()]).toEqual(['PUT', { role: 'moderator' }]);
    await put.seen;
    // Busy at the same size, with focus, and "Saving…" read out.
    await expect(trigger).toHaveAttribute('aria-busy', 'true');
    expect(size(await trigger.boundingBox())).toEqual(idle);
    await expect(trigger).toBeFocused();
    await expect(announcement(page)).toHaveText(ADMIN_COPY.saving);
    // A busy button ignores presses.
    await trigger.click();
    await expect(actionsMenu(page, target)).toHaveCount(0);
    put.release();

    await expect(rowOf(page, target).getByText(ADMIN_COPY.roleModerator, { exact: true })).toBeVisible();
    await expect(announcement(page)).toHaveText(ADMIN_COPY.nowModerator(target.username));
    await expect(trigger).toHaveAttribute('aria-busy', 'false');
    expect((await userRow(target.username))!.role).toBe('moderator');

    // Back to the thread with no reload: the comment carries the badge.
    await page.goBack();
    await expect(page).toHaveURL(walkthroughPath());
    expect(await stillNoReload(page)).toBe(true);
    await expect(badge).toBeVisible();

    await page.goForward();
    await expect(usersTable(page)).toBeVisible();
    await actionsButton(page, target).click();
    await expect(menuItem(page, target, ADMIN_COPY.makeModerator)).toHaveCount(0);
    await menuItem(page, target, ADMIN_COPY.removeModerator).click();
    await expect(announcement(page)).toHaveText(ADMIN_COPY.noLongerModerator(target.username));
    await expect(rowOf(page, target).getByText(ADMIN_COPY.roleModerator, { exact: true })).toHaveCount(0);
    expect((await userRow(target.username))!.role).toBe('user');

    await page.goBack();
    await expect(page).toHaveURL(walkthroughPath());
    expect(await stillNoReload(page)).toBe(true);
    await expect(ownComment(page, commentId)).toContainText(text);
    await expect(badge).toHaveCount(0);
  });

  test('deactivating asks first and ends every session, and Reactivate brings the account back', async ({ page, request }) => {
    const target = await register(page, 'deact');
    await registerAdmin(page);
    // The registration signed the target in, and that session is live.
    expect(await sessionKeys(target.id)).not.toEqual([]);
    await gotoAdmin(page);
    const trigger = actionsButton(page, target);
    const status = cellsOf(page, target).nth(1);
    await expect(status).toHaveText(ADMIN_COPY.statusActive);

    // The dialog asks first. Cancel changes nothing and gives focus back to the button.
    const dialog = page.getByRole('alertdialog', { name: ADMIN_COPY.deactivateTitle, exact: true });
    await trigger.click();
    await menuItem(page, target, ADMIN_COPY.deactivate).click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription(ADMIN_COPY.deactivateBody(target.username));
    await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect((await userRow(target.username))!.isActive).toBe(true);

    await trigger.click();
    await menuItem(page, target, ADMIN_COPY.deactivate).click();
    await dialog.getByRole('button', { name: ADMIN_COPY.deactivate, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(status).toHaveText(ADMIN_COPY.statusDeactivated);
    await expect(trigger).toBeFocused();
    await expect(announcement(page)).toHaveText(ADMIN_COPY.isDeactivated(target.username));
    expect((await userRow(target.username))!.isActive).toBe(false);
    expect(await sessionKeys(target.id), 'signed out everywhere').toEqual([]);
    expect(await signInStatus(request, target), "and can't sign in").toBe(401);

    // Reactivate runs at once, with no dialog.
    await trigger.click();
    await menuItem(page, target, ADMIN_COPY.reactivate).click();
    await expect(status).toHaveText(ADMIN_COPY.statusActive);
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(announcement(page)).toHaveText(ADMIN_COPY.activeAgain(target.username));
    await expect(trigger).toBeFocused();
    expect((await userRow(target.username))!.isActive).toBe(true);
    expect(await signInStatus(request, target), 'signs in again').toBe(200);
  });

  test('deleting a deactivated account takes its exact username, refuses every way out while it runs, and erases its comments', async ({ page }) => {
    const target = await register(page, 'delete');
    // Deactivated behind the app's back, so its owner couldn't delete it, and its session stays.
    expect(await setUserActive(target.username, false)).toBe(true);
    const admin = await registerAdmin(page);
    const text = `E2E ${fx.token} delete comment`;
    const replyText = `E2E ${fx.token} delete reply`;
    const parent = await insertComment(fx, { username: target.username, body: text, postedAt: '2026-01-01T12:00:00Z', changedAt: '2026-01-01T13:00:00Z' });
    const reply = await insertComment(fx, { username: admin.username, body: replyText, parentId: parent, postedAt: '2026-01-02T12:00:00Z', changedAt: '2026-01-02T13:00:00Z' });
    const before = await commentRows([parent, reply]);
    expect(await sessionKeys(target.id)).not.toEqual([]);

    // The thread first, so this tab holds the comment's text in its cache.
    await page.goto(walkthroughPath());
    await expect(ownComment(page, parent)).toContainText(text);
    await markNoReload(page);
    await openAdminFromMenu(page);
    await expect(cellsOf(page, target).nth(1)).toHaveText(ADMIN_COPY.statusDeactivated);
    // Its address revealed first, and so read out: the delete takes it off the page,
    // live region included.
    await revealButton(page, target).click();
    await expect(announcement(page)).toHaveText(target.email);
    const deletes: string[] = [];
    page.on('request', r => {
      if (r.method() === 'DELETE' && new URL(r.url()).pathname.startsWith('/api/admin/')) deletes.push(r.url());
    });

    await actionsButton(page, target).click();
    await menuItem(page, target, ADMIN_COPY.delete).click();
    const dialog = page.getByRole('alertdialog', { name: ADMIN_COPY.deleteTitle, exact: true });
    await expect(dialog).toHaveAccessibleDescription(ADMIN_COPY.deleteBody(target.username));
    const input = dialog.getByLabel(ADMIN_COPY.deleteConfirmLabel(target.username), { exact: true });
    const confirm = dialog.getByRole('button', { name: ADMIN_COPY.delete, exact: true });
    await expect(input).toBeFocused();
    await expect(confirm).toHaveAttribute('aria-disabled', 'true');

    // Another case isn't the username: Enter and a press are both refused.
    await input.fill(target.username.toUpperCase());
    await input.press('Enter');
    await confirm.click({ force: true });
    await expect(confirm).toHaveAttribute('aria-disabled', 'true');
    await expect(dialog).toBeVisible();
    await input.fill(target.username);
    await expect(confirm).toHaveAttribute('aria-disabled', 'false');
    expect(deletes, 'nothing sent before an exact match').toEqual([]);

    // Enter submits. Busy at the same size, and every way out is refused while it runs.
    const held = await holdRoute(page, `**/api/admin/users/${target.id}`);
    const idle = size(await confirm.boundingBox());
    await input.press('Enter');
    await held.seen;
    await expect(confirm).toHaveAttribute('aria-busy', 'true');
    await expect(confirm.getByText(ADMIN_COPY.deleting)).toBeVisible();
    expect(size(await confirm.boundingBox())).toEqual(idle);
    // closedby="none" would also stop Android's back gesture closing it.
    await expect(dialog).not.toHaveAttribute('closedby', 'none');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    // aria-disabled buttons still take presses (the handler refuses them), but
    // Playwright waits for them to enable, so these clicks are forced.
    await dialog.getByRole('button', { name: 'Close', exact: true }).click({ force: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click({ force: true });
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5); // the backdrop
    await expect(dialog).toBeVisible();

    // The toast waits for the dialog to close; the row goes and the heading takes focus.
    await watchToasts(page);
    held.release();
    await expect(toast(page, ADMIN_COPY.deleted(target.username))).toBeVisible();
    await expect(dialog).toHaveCount(0);
    expect(await toastsUnderModal(page), 'one toast, shown after the dialog closed').toEqual([false]);
    await expect(rowOf(page, target)).toHaveCount(0);
    await expect(usersHeading(page)).toBeFocused();
    expect(deletes).toHaveLength(1);
    expect(await page.content(), 'the address left with the row').not.toContain(target.email);

    // Stored: the account and its sessions are gone; its comment is erased, its time kept.
    expect(await userRow(target.username)).toBeNull();
    expect(await sessionKeys(target.id)).toEqual([]);
    const after = await commentRows([parent, reply]);
    expect(after.get(parent)).toEqual({ ...before.get(parent)!, userId: null, isDeleted: true, body: '[deleted]' });
    expect(after.get(reply)).toEqual(before.get(reply));

    // Back to the thread with no reload: "[deleted]", not the text this tab held.
    await page.goBack();
    await expect(page).toHaveURL(walkthroughPath());
    expect(await stillNoReload(page)).toBe(true);
    await expect(ownComment(page, parent).locator('p', { hasText: '[deleted]' })).toBeVisible();
    await expect(ownComment(page, reply)).toContainText(replyText);
    await expect(page.getByText(text)).toHaveCount(0);
  });

  test('a delete dialog the browser closes mid-delete leaves the row showing it, and the result still lands', async ({ page }) => {
    const target = await register(page, 'forced');
    await registerAdmin(page);
    await gotoAdmin(page);
    const trigger = actionsButton(page, target);
    await trigger.click();
    await menuItem(page, target, ADMIN_COPY.delete).click();
    const dialog = page.getByRole('alertdialog', { name: ADMIN_COPY.deleteTitle, exact: true });
    await dialog.getByLabel(ADMIN_COPY.deleteConfirmLabel(target.username), { exact: true }).fill(target.username);
    const held = await holdRoute(page, `**/api/admin/users/${target.id}`);
    await dialog.getByRole('button', { name: ADMIN_COPY.delete, exact: true }).click();
    await held.seen;

    // Chrome's close watcher can force a close on a repeated Escape or back gesture;
    // headless Chromium never does, so the test closes it the same way.
    await dialog.evaluate(d => (d as HTMLDialogElement).close());
    await expect(dialog).toHaveCount(0);
    // The row's button carries on showing it, and the page reads it out.
    await expect(trigger).toHaveAttribute('aria-busy', 'true');
    await expect(announcement(page)).toHaveText(ADMIN_COPY.deleting);
    await trigger.click();
    await expect(actionsMenu(page, target)).toHaveCount(0);

    held.release();
    await expect(toast(page, ADMIN_COPY.deleted(target.username))).toBeVisible();
    await expect(rowOf(page, target)).toHaveCount(0);
    await expect(usersHeading(page)).toBeFocused();
    expect(await userRow(target.username)).toBeNull();
  });

  test("admin accounts, the admin's own included, have no actions, and Settings won't delete one", async ({ page, request }) => {
    const other = await register(page, 'otheradmin');
    expect(await setUserRole(other.username, 'admin')).toBe(true);
    const admin = await registerAdmin(page);
    await gotoAdmin(page);
    for (const [account, you] of [[admin, true], [other, false]] as const) {
      const cells = cellsOf(page, account);
      await expect(cells.nth(0).getByText(ADMIN_COPY.roleAdmin, { exact: true })).toBeVisible();
      await expect(cells.nth(0).getByText(ADMIN_COPY.you, { exact: true })).toHaveCount(you ? 1 : 0);
      await expect(cells.nth(3)).toHaveText(ADMIN_COPY.noActions);
      // No Reveal and no "…".
      await expect(rowOf(page, account).getByRole('button')).toHaveCount(0);
    }

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Danger Zone', exact: true })).toBeVisible();
    await expect(page.getByText(ADMIN_COPY.settingsRefusal, { exact: true })).toBeVisible();
    await expect(page.getByLabel(`Type ${admin.username} to confirm`, { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Delete my account', exact: true })).toHaveCount(0);

    // The server refuses it too, before it signs anyone out.
    const login = await request.post('/api/auth/login', {
      data: { email: admin.email, password: admin.password },
      headers: { [TEST_IP_HEADER]: admin.ip },
    });
    expect(login.status()).toBe(200);
    const { access_token } = (await login.json()) as { access_token: string };
    const refused = await request.delete('/api/users/me', {
      headers: { Authorization: `Bearer ${access_token}`, [TEST_IP_HEADER]: admin.ip },
    });
    expect([refused.status(), ((await refused.json()) as { detail: string }).detail]).toEqual([403, ADMIN_COPY.settingsRefusal]);
    expect((await userRow(admin.username))!.role).toBe('admin');
    expect(await sessionKeys(admin.id)).not.toEqual([]);
  });

  test("a row's menu works from the keyboard as a menu button does, and gives focus back after its dialog", async ({ page }) => {
    const target = await register(page, 'keys');
    await registerAdmin(page);
    await gotoAdmin(page);
    const trigger = actionsButton(page, target);
    const menu = actionsMenu(page, target);
    const item = (name: string) => menuItem(page, target, name);
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).not.toHaveAttribute('aria-controls', /./);

    // Enter opens it on the first item.
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(item(ADMIN_COPY.makeModerator)).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-controls', (await menu.getAttribute('id'))!);
    await expect(menu.getByRole('menuitem')).toHaveText([ADMIN_COPY.makeModerator, ADMIN_COPY.deactivate, ADMIN_COPY.delete]);
    await expect(menu.getByRole('separator')).toHaveCount(1);
    // The username names the row the menu acts on, outside the menu itself.
    await expect(menu).not.toContainText(target.username);

    // The arrows wrap; Home and End jump to the ends.
    for (const [key, name] of [
      ['ArrowDown', ADMIN_COPY.deactivate],
      ['ArrowDown', ADMIN_COPY.delete],
      ['ArrowDown', ADMIN_COPY.makeModerator],
      ['ArrowUp', ADMIN_COPY.delete],
      ['Home', ADMIN_COPY.makeModerator],
      ['End', ADMIN_COPY.delete],
    ] as const) {
      await page.keyboard.press(key);
      await expect(item(name), key).toBeFocused();
    }
    // Escape closes it and gives focus back to the button.
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();

    // Up opens it on the last item, Down on the first.
    await page.keyboard.press('ArrowUp');
    await expect(item(ADMIN_COPY.delete)).toBeFocused();
    await page.keyboard.press('Escape');
    await page.keyboard.press('ArrowDown');
    await expect(item(ADMIN_COPY.makeModerator)).toBeFocused();
    // Tab closes it and lets focus move on.
    await page.keyboard.press('Tab');
    await expect(menu).toHaveCount(0);
    await expect(trigger).not.toBeFocused();
    // Space opens it too; Shift+Tab closes it with focus on the button.
    await trigger.focus();
    await page.keyboard.press('Space');
    await expect(item(ADMIN_COPY.makeModerator)).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
    // A press outside closes it.
    await trigger.click();
    await expect(menu).toBeVisible();
    await page.getByRole('heading', { level: 1, name: ADMIN_COPY.pageHeading, exact: true }).click();
    await expect(menu).toHaveCount(0);
    // A press on the panel's own header, or between items, keeps focus in the menu, so
    // its keys still work.
    await trigger.click();
    await expect(item(ADMIN_COPY.makeModerator)).toBeFocused();
    await menu.locator('xpath=..').getByText(target.username, { exact: true }).click();
    await expect(item(ADMIN_COPY.makeModerator)).toBeFocused();
    await menu.getByRole('separator').click({ force: true });
    await expect(item(ADMIN_COPY.makeModerator)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(item(ADMIN_COPY.deactivate)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();

    // Choosing an item closes the menu, and the dialog it opens gives focus back.
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(item(ADMIN_COPY.deactivate)).toBeFocused();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('alertdialog', { name: ADMIN_COPY.deactivateTitle, exact: true });
    await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
    await expect(menu).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect((await userRow(target.username))!.isActive).toBe(true);
  });

  test('a list that fails to load keeps its error and focus while Try again runs, and the heading takes focus once it loads', async ({ page }) => {
    await register(page, 'retry');
    await registerAdmin(page);
    // Each load fails as `mode` says (dev's StrictMode asks twice on the first visit)
    // until it is 'pass'. Then a load reaches the hold below, registered first so the
    // failing route falls back to it, and the server answers it once released.
    const held = await holdRoute(page, '**/api/admin/users');
    let mode: 'fail' | 'offline' | 'pass' = 'fail';
    let asked = 0;
    await page.route('**/api/admin/users', async route => {
      asked++;
      if (mode === 'pass') return route.fallback();
      if (mode === 'offline') return route.abort('internetdisconnected');
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Internal server error' }) });
    });
    await page.goto('/admin');
    const alert = page.getByRole('alert');
    const tryAgain = alert.getByRole('button', { name: ADMIN_COPY.tryAgain, exact: true });
    await expect(alert).toContainText(ADMIN_COPY.loadError);
    // Every change to the polite region, in order.
    await announcement(page).evaluate(el => {
      const w = window as unknown as { liveLog: string[] };
      w.liveLog = [];
      new MutationObserver(() => w.liveLog.push(el.textContent ?? '')).observe(el, { childList: true, characterData: true, subtree: true });
    });
    const liveLog = () => page.evaluate(() => (window as unknown as { liveLog: string[] }).liveLog);

    // A retry that fails with the same words leaves the box, and focus, where they
    // were, and the words are read out again, every time: the region is cleared first.
    await tryAgain.focus();
    const sameTwice = [[ADMIN_COPY.loadError], [ADMIN_COPY.loadError, '', ADMIN_COPY.loadError]];
    for (const expected of sameTwice) {
      const before = asked;
      await page.keyboard.press('Enter');
      await expect.poll(liveLog).toEqual(expected);
      await expect(tryAgain).toBeFocused();
      expect(asked, 'the retry asked again').toBe(before + 1);
    }

    // One that fails with new words: the alert reads them out itself, so the polite
    // region doesn't say them a second time.
    mode = 'offline';
    await page.keyboard.press('Enter');
    await expect(alert).not.toContainText(ADMIN_COPY.loadError);
    await expect(tryAgain).toBeFocused();
    expect(await liveLog()).toEqual([ADMIN_COPY.loadError, '', ADMIN_COPY.loadError, '']);

    // While a retry runs, the box stays, at its size, with a spinner in the pressed
    // button, which keeps focus. A second press changes nothing: the box and focus
    // checks are what pin the page's guard, since TanStack would send no second
    // request for it anyway.
    mode = 'pass';
    const idle = size(await alert.boundingBox());
    const before = asked;
    await page.keyboard.press('Enter');
    await held.seen;
    await expect(tryAgain).toHaveAttribute('aria-busy', 'true');
    await expect(tryAgain.locator('svg.animate-spin')).toBeVisible();
    expect(size(await alert.boundingBox())).toEqual(idle);
    await page.keyboard.press('Enter');
    await expect(alert).toBeVisible();
    await expect(tryAgain).toBeFocused();
    await expect(tryAgain).toHaveAttribute('aria-busy', 'true');
    expect(asked, 'one request for the two presses').toBe(before + 1);
    await expect(usersTable(page)).toHaveCount(0);

    // Once it loads, the box goes and the Users heading takes focus.
    held.release();
    await expect(usersTable(page)).toBeVisible();
    await expect(alert).toHaveCount(0);
    await expect(usersHeading(page)).toBeFocused();
  });

  test('a search still runs after a refresh that failed for a moment dropped the session token', async ({ page }) => {
    const target = await register(page, 'tokenless');
    await registerAdmin(page);
    // A clock of the page's own, so the token can grow old enough for a returning tab
    // to refresh it (ten minutes); it runs at the normal rate otherwise.
    await page.clock.install();
    await gotoAdmin(page);
    // That refresh fails for a moment (a 503): the page keeps the signed-in admin, but
    // drops the token.
    await page.route('**/api/auth/refresh', route => route.fulfill({
      status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'Service unavailable' }),
    }), { times: 1 });
    const failed = page.waitForResponse(r => new URL(r.url()).pathname === '/api/auth/refresh' && r.status() === 503);
    await page.clock.fastForward('11:00');
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await failed;

    // A search then runs, refreshing first, rather than waiting for a token for good.
    await searchBox(page).fill(target.username);
    await expect(statusLine(page)).toHaveText(ADMIN_COPY.accountsMatch(1, '1'));
    await expect(rowOf(page, target)).toBeVisible();
  });

  test("a 50-character username wraps in the delete dialog, in its toast and in Settings' own delete label", async ({ page }) => {
    // Letters with nowhere to break, as long as the username rule allows.
    const prefix = `e2e_${fx.token}_`;
    const long = await register(page, 'w'.repeat(50 - prefix.length));
    expect(long.username).toHaveLength(50);
    const overflow = (locator: Locator) => locator.evaluate(el => el.scrollWidth - el.clientWidth);

    // Settings, signed in as that account (the last one registered), on a phone.
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/settings');
    const settingsLabel = page.locator('label').filter({ hasText: long.username });
    await expect(settingsLabel).toBeVisible();
    expect(await overflow(settingsLabel), 'Settings label').toBeLessThanOrEqual(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), 'Settings: no sideways scroll').toBeLessThanOrEqual(0);

    await registerAdmin(page);
    await gotoAdmin(page);
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 812 });
      await actionsButton(page, long).click();
      await menuItem(page, long, ADMIN_COPY.delete).click();
      const dialog = page.getByRole('alertdialog', { name: ADMIN_COPY.deleteTitle, exact: true });
      const input = dialog.getByLabel(ADMIN_COPY.deleteConfirmLabel(long.username), { exact: true });
      await expect(input).toBeFocused();
      expect(await overflow(dialog), `${width}: the dialog`).toBeLessThanOrEqual(0);
      expect(await overflow(dialog.locator('label')), `${width}: its label`).toBeLessThanOrEqual(0);
      expect(await overflow(dialog.locator('p').first()), `${width}: its message`).toBeLessThanOrEqual(0);
      if (width === 375) {
        await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
        await expect(dialog).toHaveCount(0);
        continue;
      }
      await input.fill(long.username);
      await dialog.getByRole('button', { name: ADMIN_COPY.delete, exact: true }).click();
      await expect(dialog).toHaveCount(0);
    }
    // The toast wraps the name inside the screen.
    const shown = toast(page, ADMIN_COPY.deleted(long.username));
    await expect(shown).toBeVisible();
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 812 });
      const right = await shown.evaluate(el => el.getBoundingClientRect().right);
      expect(right, `${width}: the toast's text inside the screen`).toBeLessThanOrEqual(width);
    }
    expect(await userRow(long.username)).toBeNull();
  });
});

test.describe('on a phone 320px wide', () => {
  test.use({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });

  test('the search box shows its whole placeholder at the 16px phones get, and keeps its full label for screen readers', async ({ page }) => {
    await registerAdmin(page);
    await gotoAdmin(page);
    // Found by its label, which screen readers read: the full words, kept.
    const box = searchBox(page);
    await expect(box).toHaveAttribute('placeholder', ADMIN_COPY.searchPlaceholder);
    const fit = await box.evaluate(el => {
      const input = el as HTMLInputElement;
      const s = getComputedStyle(input);
      const ctx = document.createElement('canvas').getContext('2d')!;
      ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      return {
        fontSize: s.fontSize,
        text: ctx.measureText(input.placeholder).width,
        room: input.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight),
      };
    });
    expect(fit.fontSize, 'a coarse pointer gets 16px').toBe('16px');
    expect(fit.text, `${fit.text}px of placeholder in ${fit.room}px`).toBeLessThanOrEqual(fit.room);
  });
});
