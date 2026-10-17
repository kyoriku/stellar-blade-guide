import { test, expect, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { BULK_COPY } from '../../client/src/constants/bulkProgressCopy';
import { cycleLabel } from '../../client/src/constants/cycleLabels';

// Counts in the copy are formatted by the page; pin the locale the spec formats with.
test.use({ locale: 'en-US' });

let fx: Fixtures;

type Item = { id: number; cycle: string; quantity: number };

const fmt = (n: number) => n.toLocaleString('en-US');

// Ids come from the live catalog, never literals: content edits must not break this.
async function levelItems(page: Page, slug: string): Promise<Item[]> {
  const res = await page.request.get(`/api/levels/${slug}`);
  expect(res.status()).toBe(200);
  const locations = (await res.json()) as { collectibles: Item[] }[];
  return locations.flatMap(l => l.collectibles);
}

// Kept local, as progress-page.spec.ts keeps its own.
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

async function serverIds(page: Page, token: string, ip: string): Promise<number[]> {
  const res = await page.request.get('/api/progress', {
    headers: { Authorization: `Bearer ${token}`, [TEST_IP_HEADER]: ip },
  });
  expect(res.status()).toBe(200);
  return ((await res.json()) as number[]).sort((a, b) => a - b);
}

async function statsTotal(page: Page, token: string, ip: string): Promise<number> {
  const res = await page.request.get('/api/users/me/stats', {
    headers: { Authorization: `Bearer ${token}`, [TEST_IP_HEADER]: ip },
  });
  expect(res.status()).toBe(200);
  return ((await res.json()) as { total: { total: number } }).total.total;
}

async function gotoProgress(page: Page, url = '/progress'): Promise<void> {
  const statsLoaded = page.waitForResponse(r => r.url().endsWith('/api/users/me/stats') && r.status() === 200);
  await page.goto(url);
  await statsLoaded;
}

// The card loads closed.
async function openManage(page: Page): Promise<void> {
  await page.getByRole('button', { name: BULK_COPY.heading }).click();
  await expect(page.getByLabel(BULK_COPY.scopeLabel)).toBeVisible();
}

async function stored(page: Page): Promise<number[] | null> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('sb_progress');
    return raw ? (JSON.parse(raw) as number[]).sort((a, b) => a - b) : null;
  });
}

// Signs out through the account menu and back in through the login form, without
// a reload, so whatever the page holds in memory survives.
async function signOutAndIn(page: Page, user: TestUser): Promise<void> {
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('button', { name: 'Sign out' }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

// Results are toasts; the toast container is the page's only role="status".
const toast = (page: Page, text: string) => page.getByRole('status').getByText(text, { exact: true });

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

const box = (page: Page, id: number) =>
  page.locator(`article#collectible-${id}`).getByRole('button', { name: /Mark as/ });

const hero = (page: Page, found: number) =>
  page.getByText(new RegExp(`^${fmt(found)} of [\\d.,\\s]+ collectibles found$`));

const levelLink = (page: Page, name: string) =>
  page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Levels', exact: true }) })
    .getByRole('link', { name, exact: true });

const levelRow = (page: Page, name: string) => levelLink(page, name).locator('..');

const size = (b: { width: number; height: number } | null) => b && { width: b.width, height: b.height };

// A reload clears window properties; client-side navigation keeps them.
const markNoReload = (page: Page) =>
  page.evaluate(() => { (window as unknown as { __bulkNoReload?: boolean }).__bulkNoReload = true; });
const stillNoReload = (page: Page) =>
  page.evaluate(() => (window as unknown as { __bulkNoReload?: boolean }).__bulkNoReload === true);

const CYCLES = ['Base', 'NG+', 'NG++', 'DLC'];
// Takes a stored cycle (or All) and finds its pill by the label it shows.
const radio = (page: Page, cycle: string) => page.getByRole('radio', { name: cycleLabel(cycle), exact: true });
const pill = (page: Page, cycle: string) => page.locator('label').filter({ has: radio(page, cycle) });
const manageCard = (page: Page) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: BULK_COPY.heading }) });
const previewRequest = (page: Page) => page.waitForRequest(r => r.url().endsWith('/api/progress/bulk/preview'));
const statsResponse = (page: Page) =>
  page.waitForResponse(r => r.url().endsWith('/api/users/me/stats') && r.status() === 200);

// Holds every request to `url` until released, answering from the real server
// (through `edit` when given). `seen` resolves on the first request.
async function holdRoute(page: Page, url: string, edit?: (body: string) => string) {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let arrived!: () => void;
  const seen = new Promise<void>(resolve => { arrived = resolve; });
  await page.route(url, async route => {
    arrived();
    await held;
    const response = await route.fetch();
    await route.fulfill(edit ? { response, body: edit(await response.text()) } : { response });
  });
  return { release, seen };
}

// Altess Levoire, from the live catalog: the single-cycle level these checks use.
async function singleCycleLevel(page: Page) {
  const items = await levelItems(page, 'altess-levoire');
  const held = [...new Set(items.map(c => c.cycle))];
  expect(held, 'Altess Levoire now spans several cycles; pick a single-cycle level').toHaveLength(1);
  return { items, sole: held[0], other: CYCLES.find(c => c !== held[0])! };
}

test.describe('bulk progress, signed in', () => {
  let ip: string;
  let user: TestUser;
  let seq = 0;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, `bk${++seq}`);
    await apiRegister(page, user, ip);
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  });

  test.afterEach(async ({ page }) => {
    await apiDeleteUser(page, user, ip);
  });

  test('a level narrowed to one cycle changes exactly those entries without a reload', async ({ page }) => {
    const eidos = await levelItems(page, 'eidos-7');
    const eidosNgPlus = eidos.filter(c => c.cycle === 'NG+');
    const ngPlus = eidosNgPlus.filter(c => c.quantity === 1).slice(0, 2);
    const base = eidos.find(c => c.cycle === 'Base' && c.quantity === 1 && c.id !== fx.collectibleId)!;
    const xion = (await levelItems(page, 'xion')).find(c => c.cycle === 'NG+' && c.quantity === 1)!;
    expect(ngPlus).toHaveLength(2);
    const token = await apiLoginToken(page, user, ip);
    await tick(page, token, ip, [...ngPlus.map(c => c.id), base.id, xion.id]);

    await gotoProgress(page);
    await markNoReload(page);
    await watchToasts(page);
    const toggle = page.getByRole('button', { name: BULK_COPY.heading });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByLabel(BULK_COPY.scopeLabel)).toBeHidden();
    await openManage(page);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(hero(page, 4)).toBeVisible();
    await expect(levelRow(page, 'Eidos 7')).toHaveText(/^Eidos 7\s*3\/\d+/);
    await page.getByRole('button', { name: BULK_COPY.clearButton }).click();
    await expect(toast(page, BULK_COPY.hintChooseScope)).toBeVisible();

    await page.getByLabel(BULK_COPY.scopeLabel).selectOption('level:Eidos 7');
    await page.getByRole('radio', { name: 'NG+', exact: true }).check();
    await page.getByRole('button', { name: BULK_COPY.clearButton }).click();
    const dialog = page.getByRole('alertdialog');
    const scope = { label: 'Eidos 7', everything: false, cycle: 'NG+' };
    // Mixed when Eidos 7 has NG+ entries beyond the two ticked.
    await expect(dialog).toHaveAccessibleDescription(BULK_COPY.dialogBodyClear(2, '2', scope, eidosNgPlus.length > 2));
    await dialog.getByRole('button', { name: BULK_COPY.confirmClear('2') }).click();

    await expect(toast(page, BULK_COPY.successClear(2, '2', scope))).toBeVisible();
    await expect(dialog).toHaveCount(0);
    expect(await toastsUnderModal(page)).not.toContain(true);
    await expect(hero(page, 2)).toBeVisible();
    await expect(levelRow(page, 'Eidos 7')).toHaveText(/^Eidos 7\s*1\/\d+/);
    await expect(levelRow(page, 'Xion')).toHaveText(/^Xion\s*1\/\d+/);

    // A client-side link, so the marker survives: the level page reads the same cache.
    await levelLink(page, 'Eidos 7').click();
    await expect(page).toHaveURL(/\/levels\/eidos-7$/);
    for (const c of ngPlus) await expect(box(page, c.id)).toHaveAccessibleName('Mark as found');
    await expect(box(page, base.id)).toHaveAccessibleName('Mark as not found');
    expect(await stillNoReload(page)).toBe(true);
    expect(await serverIds(page, token, ip)).toEqual([base.id, xion.id].sort((a, b) => a - b));
  });

  test('everything needs the word, counts by quantity, and moves the ring both ways', async ({ page }) => {
    const token = await apiLoginToken(page, user, ip);
    const total = await statsTotal(page, token, ip);
    await gotoProgress(page);
    await openManage(page);
    const all = { label: BULK_COPY.scopeEverything, everything: true };
    const dialog = page.getByRole('alertdialog');
    const accountMenu = page.getByRole('button', { name: 'Account menu' });

    await page.getByLabel(BULK_COPY.scopeLabel).selectOption('everything');
    await page.getByRole('button', { name: BULK_COPY.markButton }).click();
    // The quantity total, which differs from the entry count: this pins the unit.
    // Nothing was found, so Clear would put it back: no "can't be undone".
    await expect(dialog).toHaveAccessibleDescription(BULK_COPY.dialogBodyMarkFound(total, fmt(total), all, false));
    const markConfirm = dialog.getByRole('button', { name: BULK_COPY.confirmMarkFound(fmt(total)) });
    await expect(markConfirm).toBeDisabled();
    const word = dialog.getByLabel(BULK_COPY.confirmWordLabel(BULK_COPY.confirmWord));
    await word.fill('everythin');
    await expect(markConfirm).toBeDisabled();
    // A right-click on the backdrop presses without clicking. The Return below
    // arrives as a click at 0,0 on Confirm, which must not read as the backdrop.
    await page.mouse.click(4, 4, { button: 'right' });
    await word.fill(` ${BULK_COPY.confirmWord.toUpperCase()} `);
    await expect(markConfirm).toBeEnabled();
    await word.press('Enter');

    await expect(toast(page, BULK_COPY.successMarkFound(total, fmt(total), all))).toBeVisible();
    await expect(page.getByText(`${fmt(total)} of ${fmt(total)} collectibles found`)).toBeVisible();
    // The ring floors to whole percent, so only these two ends can show a bulk change;
    // the menu opens only once the modal is gone.
    await accountMenu.click();
    await expect(page.getByRole('link', { name: /^Progress 100%$/ })).toBeVisible();
    // Click away to close the menu; the card's heading would close the card.
    await page.getByRole('heading', { name: 'My Progress', level: 1 }).click();
    // Nothing left to mark: a toast, and no dialog.
    await page.getByRole('button', { name: BULK_COPY.markButton }).click();
    await expect(toast(page, BULK_COPY.nothingToMark(all))).toBeVisible();
    await expect(dialog).toHaveCount(0);

    await page.getByRole('button', { name: BULK_COPY.clearButton }).click();
    await expect(dialog).toHaveAccessibleDescription(BULK_COPY.dialogBodyClear(total, fmt(total), all, false));
    await dialog.getByLabel(BULK_COPY.confirmWordLabel(BULK_COPY.confirmWord)).fill(BULK_COPY.confirmWord);
    await dialog.getByRole('button', { name: BULK_COPY.confirmClear(fmt(total)) }).click();

    await expect(toast(page, BULK_COPY.successClear(total, fmt(total), all))).toBeVisible();
    await expect(page.getByText(`0 of ${fmt(total)} collectibles found`)).toBeVisible();
    await accountMenu.click();
    await expect(page.getByRole('link', { name: /^Progress 0%$/ })).toBeVisible();
    expect(await serverIds(page, token, ip)).toEqual([]);
  });

  test("a clear drops its scope from a failed sync's leftovers, so the next sync cannot bring it back", async ({ page }) => {
    const eidos = (await levelItems(page, 'eidos-7')).filter(c => c.quantity === 1 && c.id !== fx.collectibleId);
    const [inScope, ticked] = eidos;
    const outOfScope = (await levelItems(page, 'xion'))[0];
    const token = await apiLoginToken(page, user, ip);
    // One row on the account, so the preview finds something and the write runs.
    await tick(page, token, ip, [ticked.id]);
    await gotoProgress(page);
    // Set after load, so no token rising edge follows: exactly the state a failed
    // sign-in sync leaves behind.
    await page.evaluate(ids => localStorage.setItem('sb_progress', JSON.stringify(ids)), [inScope.id, outOfScope.id]);

    await openManage(page);
    await page.getByLabel(BULK_COPY.scopeLabel).selectOption('level:Eidos 7');
    await page.getByRole('button', { name: BULK_COPY.clearButton }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: BULK_COPY.confirmClear('1') }).click();
    await expect(toast(page, BULK_COPY.successClear(1, '1', { label: 'Eidos 7', everything: false }))).toBeVisible();
    expect(await stored(page)).toEqual([outOfScope.id]);

    // The reload's sign-in sync sends what is left.
    const synced = page.waitForResponse(r => r.url().endsWith('/api/progress/sync') && r.status() === 200);
    await page.reload();
    await synced;
    expect(await serverIds(page, token, ip)).toEqual([outOfScope.id]);
  });

  test('a single-cycle scope shows its cycle with every pill locked, and leaving it goes back to All', async ({ page }) => {
    const { items: altess, sole } = await singleCycleLevel(page);
    const eidosCycles = new Set((await levelItems(page, 'eidos-7')).map(c => c.cycle));
    const other = CYCLES.find(c => c !== sole && eidosCycles.has(c));
    expect(eidosCycles.has(sole) && other !== undefined, 'Eidos 7 must hold the sole cycle and another').toBe(true);
    const quantity = altess.reduce((sum, c) => sum + c.quantity, 0);

    await gotoProgress(page);
    await openManage(page);
    const scope = page.getByLabel(BULK_COPY.scopeLabel);
    const card = manageCard(page);
    const dialog = page.getByRole('alertdialog');
    // No scope chosen yet: nothing to narrow by, so nothing is off.
    for (const name of [BULK_COPY.cycleAll, ...CYCLES]) await expect(radio(page, name)).toBeEnabled();

    // Entered from a pick of another cycle, then from a pick of the sole cycle itself.
    for (const start of [other!, sole]) {
      await scope.selectOption('level:Eidos 7');
      await radio(page, start).check();
      const cardSize = size(await card.boundingBox());
      await scope.selectOption('level:Altess Levoire');
      await expect(radio(page, sole)).toBeChecked();
      for (const name of [BULK_COPY.cycleAll, ...CYCLES]) await expect(radio(page, name)).toBeDisabled();
      // The shown cycle reads as selected, the rest as unavailable.
      await expect(pill(page, sole)).toHaveCSS('opacity', '1');
      for (const name of [BULK_COPY.cycleAll, ...CYCLES.filter(c => c !== sole)]) {
        await expect(pill(page, name)).toHaveCSS('opacity', '0.4');
      }
      // Disabled rather than hidden, so the card keeps its height.
      expect(size(await card.boundingBox())).toEqual(cardSize);

      // Shown only: the request names no cycle, so the copy gains no "(Base)".
      const previewSent = previewRequest(page);
      await page.getByRole('button', { name: BULK_COPY.markButton }).click();
      expect((await previewSent).postDataJSON()).toEqual({ scope: 'level', level: 'Altess Levoire', action: 'mark_found' });
      await expect(dialog).toHaveAccessibleDescription(
        BULK_COPY.dialogBodyMarkFound(quantity, fmt(quantity), { label: 'Altess Levoire', everything: false }, false));
      await dialog.getByRole('button', { name: BULK_COPY.cancel }).click();
      await expect(dialog).toHaveCount(0);

      // Leaving it lands on All.
      await scope.selectOption('level:Eidos 7');
      await expect(radio(page, BULK_COPY.cycleAll)).toBeChecked();
    }
  });

  test('a multi-cycle scope disables the cycles it lacks, and a pick the next scope lacks resets to All', async ({ page }) => {
    const eidosCycles = new Set((await levelItems(page, 'eidos-7')).map(c => c.cycle));
    const xionCycles = new Set((await levelItems(page, 'xion')).map(c => c.cycle));
    const lacking = CYCLES.filter(c => !eidosCycles.has(c));
    const gone = CYCLES.find(c => eidosCycles.has(c) && !xionCycles.has(c));
    expect(eidosCycles.size > 1 && lacking.length > 0, 'Eidos 7 must hold several cycles, not all').toBe(true);
    expect(xionCycles.size > 1 && gone !== undefined, "Xion must hold several cycles and lack one of Eidos 7's").toBe(true);

    await gotoProgress(page);
    await openManage(page);
    const scope = page.getByLabel(BULK_COPY.scopeLabel);
    await scope.selectOption('level:Eidos 7');
    await expect(radio(page, BULK_COPY.cycleAll)).toBeChecked();
    await expect(radio(page, BULK_COPY.cycleAll)).toBeEnabled();
    for (const c of CYCLES) {
      if (eidosCycles.has(c)) await expect(radio(page, c)).toBeEnabled();
      else await expect(radio(page, c)).toBeDisabled();
    }
    await radio(page, gone!).check();
    await scope.selectOption('level:Xion');
    await expect(radio(page, BULK_COPY.cycleAll)).toBeChecked();
    await expect(radio(page, gone!)).toBeDisabled();
  });

  test('stats that land after a pick lock a single-cycle scope, drop the pick, and keep focus in the card', async ({ page }) => {
    const { sole, other } = await singleCycleLevel(page);
    const stats = await holdRoute(page, '**/api/users/me/stats');
    await page.goto('/progress');
    await openManage(page);
    const scope = page.getByLabel(BULK_COPY.scopeLabel);
    await scope.selectOption('level:Altess Levoire');
    // Nothing is known yet, so nothing is off; the click leaves focus on the pill.
    await radio(page, other).check();
    await expect(radio(page, other)).toBeFocused();
    const statsLoaded = statsResponse(page);
    stats.release();
    await statsLoaded;
    await expect(radio(page, sole)).toBeChecked();
    for (const name of [BULK_COPY.cycleAll, ...CYCLES]) await expect(radio(page, name)).toBeDisabled();
    // Locking the focused pill would otherwise drop focus to the page.
    await expect(scope).toBeFocused();
    // The pick is gone, not just hidden: the request names no cycle.
    const previewSent = previewRequest(page);
    await page.getByRole('button', { name: BULK_COPY.markButton }).click();
    expect((await previewSent).postDataJSON()).toEqual({ scope: 'level', level: 'Altess Levoire', action: 'mark_found' });
    await page.getByRole('alertdialog').getByRole('button', { name: BULK_COPY.cancel }).click();
    await scope.selectOption('level:Eidos 7');
    await expect(radio(page, BULK_COPY.cycleAll)).toBeChecked();
  });

  test('a pick stays put while its count is in flight, and resets once the count lands', async ({ page }) => {
    const { sole, other } = await singleCycleLevel(page);
    const stats = await holdRoute(page, '**/api/users/me/stats');
    const count = await holdRoute(page, '**/api/progress/bulk/preview');
    await page.goto('/progress');
    await openManage(page);
    // No transitions, so a hover's colours can be read the moment it starts.
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
    const scope = page.getByLabel(BULK_COPY.scopeLabel);
    const clear = page.getByRole('button', { name: BULK_COPY.clearButton });
    await scope.selectOption('level:Altess Levoire');
    await radio(page, other).check();
    // The press waits for the token, which the held stats do not.
    await expect(clear).not.toHaveAttribute('aria-disabled', 'true');
    await clear.click();
    await count.seen;
    const statsLoaded = statsResponse(page);
    stats.release();
    await statsLoaded;
    // Mid-count the row keeps the pick the count was frozen with.
    await expect(clear).toHaveAttribute('aria-busy', 'true');
    await expect(radio(page, other)).toBeChecked();
    // A pill the counting fieldset disabled does not brighten under the pointer.
    const allCycles = pill(page, BULK_COPY.cycleAll);
    const colours = () => allCycles.evaluate(el => `${getComputedStyle(el).borderColor} ${getComputedStyle(el).color}`);
    const resting = await colours();
    await allCycles.hover();
    expect(await colours()).toBe(resting);

    count.release();
    await expect(toast(page, BULK_COPY.emptyScope({ label: 'Altess Levoire', everything: false, cycle: cycleLabel(other) }))).toBeVisible();
    // Once the count lands, the reset runs: the sole cycle, locked.
    await expect(radio(page, sole)).toBeChecked();
    for (const name of [BULK_COPY.cycleAll, ...CYCLES]) await expect(radio(page, name)).toBeDisabled();
  });

  test('a scope the loaded stats no longer offer goes back to Choose a scope', async ({ page }) => {
    // A catalog that lost Supply Boxes (here, moved to a group the page does not show).
    const stats = await holdRoute(page, '**/api/users/me/stats', body => {
      const data = JSON.parse(body) as { types: { slug: string; category: string }[] };
      for (const t of data.types) if (t.slug === 'supply-boxes') t.category = 'retired';
      return JSON.stringify(data);
    });
    await page.goto('/progress');
    await openManage(page);
    const scope = page.getByLabel(BULK_COPY.scopeLabel);
    await scope.selectOption('type:supply-boxes');
    const statsLoaded = statsResponse(page);
    stats.release();
    await statsLoaded;
    // Otherwise the select would show its first option while the card kept the old scope.
    await expect(scope).toHaveValue('');
    await page.getByRole('button', { name: BULK_COPY.clearButton }).click();
    await expect(toast(page, BULK_COPY.hintChooseScope)).toBeVisible();
  });

  test('a count stuck behind a token refresh gives up at its deadline', async ({ page }) => {
    await gotoProgress(page);
    await openManage(page);
    // The count is refused as if the token had just expired, and the refresh that
    // authFetch then waits on never answers.
    await page.route('**/api/progress/bulk/preview', route => route.fulfill({ status: 401, json: { detail: 'Token expired' } }), { times: 1 });
    await page.route('**/api/auth/refresh', () => {});
    await page.getByLabel(BULK_COPY.scopeLabel).selectOption('everything');
    const clear = page.getByRole('button', { name: BULK_COPY.clearButton });
    await clear.click();
    await expect(clear).toHaveAttribute('aria-busy', 'true');
    await expect(toast(page, BULK_COPY.previewTimeout)).toBeVisible({ timeout: 25_000 });
    await expect(clear).toHaveAttribute('aria-busy', 'false');
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });

  test('keyboard focus stays visible in forced colors', async ({ page }) => {
    // Forced colors drops box-shadows, so a ring alone shows nothing there.
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoProgress(page);
    await openManage(page);
    const select = page.getByLabel(BULK_COPY.scopeLabel);
    await select.focus();
    await expect(select).toHaveCSS('outline-style', 'solid');
    // Tab moves from the select to the checked pill.
    await page.keyboard.press('Tab');
    const allCycles = page.getByRole('radio', { name: BULK_COPY.cycleAll });
    await expect(allCycles).toBeFocused();
    await expect(page.locator('label').filter({ has: allCycles })).toHaveCSS('outline-style', 'solid');
    // The checked pill's 2px Highlight border never changes its box, so the row cannot rewrap.
    const ngPlus = pill(page, 'NG+');
    const unchecked = size(await ngPlus.boundingBox());
    await radio(page, 'NG+').check();
    await expect(radio(page, 'NG+')).toBeChecked();
    expect(size(await ngPlus.boundingBox())).toEqual(unchecked);

    await select.selectOption('everything');
    await page.getByRole('button', { name: BULK_COPY.markButton }).click();
    const word = page.getByRole('alertdialog').getByLabel(BULK_COPY.confirmWordLabel(BULK_COPY.confirmWord));
    await expect(word).toBeFocused();
    await expect(word).toHaveCSS('outline-style', 'solid');
  });

  test('a dialog the browser closes mid-write leaves the card showing the write landing', async ({ page }) => {
    const xion = await levelItems(page, 'xion');
    const quantity = xion.reduce((sum, c) => sum + c.quantity, 0);
    await gotoProgress(page);
    await openManage(page);

    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    let writeArrived!: () => void;
    const writeSeen = new Promise<void>(resolve => { writeArrived = resolve; });
    await page.route('**/api/progress/bulk', async route => {
      writeArrived();
      await held;
      const response = await route.fetch();
      await route.fulfill({ response });
    });

    await page.getByLabel(BULK_COPY.scopeLabel).selectOption('level:Xion');
    const mark = page.getByRole('button', { name: BULK_COPY.markButton });
    await mark.click();
    const dialog = page.getByRole('alertdialog');
    const confirm = dialog.getByRole('button', { name: BULK_COPY.confirmMarkFound(fmt(quantity)) });
    const confirmSize = size(await confirm.boundingBox());
    await confirm.click();
    await writeSeen;
    // Saving shows in Confirm itself, which keeps its size.
    await expect(confirm).toHaveAttribute('aria-busy', 'true');
    await expect(confirm.getByText(BULK_COPY.applying)).toBeVisible();
    expect(size(await confirm.boundingBox())).toEqual(confirmSize);

    // A close request mid-write is refused.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    // Android's back gesture reaches the dialog only through its close watcher,
    // which closedby="none" turns off; headless Chromium cannot make that gesture.
    await expect(page.locator('dialog')).not.toHaveAttribute('closedby', 'none');
    // What Chrome does on a second Escape and Android on a second back gesture
    // (headless Chromium does not force it).
    await page.evaluate(() => document.querySelector('dialog')?.close());
    await expect(dialog).toHaveCount(0);
    await expect(mark).toHaveAttribute('aria-busy', 'true');
    await expect(mark.getByText(BULK_COPY.applying)).toBeVisible();

    release();
    const scope = { label: 'Xion', everything: false };
    await expect(toast(page, BULK_COPY.successMarkFound(quantity, fmt(quantity), scope))).toBeVisible();
    await expect(mark).toHaveAttribute('aria-busy', 'false');
  });
});

test.describe('bulk progress, sign-in sync in flight', () => {
  let ip: string;
  let user: TestUser;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, 'bksync');
    await apiRegister(page, user, ip);
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  });

  test.afterEach(async ({ page }) => {
    await apiDeleteUser(page, user, ip);
  });

  // Guest ticks waiting to merge when this load gets its token. Seeded once only.
  const seedGuestCopy = (page: Page, ids: number[]) =>
    page.addInitScript(seeded => {
      if (sessionStorage.getItem('bulk-seeded')) return;
      sessionStorage.setItem('bulk-seeded', '1');
      localStorage.setItem('sb_progress', JSON.stringify(seeded));
    }, ids);

  test('a count waits for the sign-in sync still in flight, so the sync cannot land after the clear', async ({ page }) => {
    const [leftover] = (await levelItems(page, 'eidos-7')).filter(c => c.quantity === 1 && c.id !== fx.collectibleId);
    await seedGuestCopy(page, [leftover.id]);

    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    let syncArrived!: () => void;
    const syncSeen = new Promise<void>(resolve => { syncArrived = resolve; });
    await page.route('**/api/progress/sync', async route => {
      syncArrived();
      await held;
      const response = await route.fetch();
      await route.fulfill({ response });
    });

    await gotoProgress(page);
    await syncSeen;
    await openManage(page);
    await page.getByLabel(BULK_COPY.scopeLabel).selectOption('level:Eidos 7');
    const card = page.locator('section').filter({ has: page.getByRole('heading', { name: BULK_COPY.heading }) });
    const clear = page.getByRole('button', { name: BULK_COPY.clearButton });
    const cardSize = size(await card.boundingBox());
    const clearSize = size(await clear.boundingBox());
    await clear.click();
    // The count shows in the pressed button, and nothing in the card moves.
    await expect(clear).toHaveAttribute('aria-busy', 'true');
    await expect(clear.getByText(BULK_COPY.counting)).toBeVisible();
    expect(size(await card.boundingBox())).toEqual(cardSize);
    expect(size(await clear.boundingBox())).toEqual(clearSize);
    // Any evaluate runs after the click's handler and its microtasks, so a count that
    // did not wait for the sync has been sent by now, and reaches the server before
    // the sync this releases: it would count 0 and open no dialog.
    await page.evaluate(() => undefined);
    release();

    const scope = { label: 'Eidos 7', everything: false };
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toHaveAccessibleDescription(BULK_COPY.dialogBodyClear(1, '1', scope, true));
    await dialog.getByRole('button', { name: BULK_COPY.confirmClear('1') }).click();
    await expect(toast(page, BULK_COPY.successClear(1, '1', scope))).toBeVisible();
    const token = await apiLoginToken(page, user, ip);
    expect(await serverIds(page, token, ip)).toEqual([]);
  });

  test('a count waits for every sync still in flight, not only the newest', async ({ page }) => {
    const [first, second] = (await levelItems(page, 'eidos-7')).filter(c => c.quantity === 1 && c.id !== fx.collectibleId);
    await seedGuestCopy(page, [first.id]);

    // Hold the load's sync; the one from signing back in goes straight through.
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    let firstArrived!: () => void;
    const firstSeen = new Promise<void>(resolve => { firstArrived = resolve; });
    let syncs = 0;
    await page.route('**/api/progress/sync', async route => {
      if (++syncs === 1) {
        firstArrived();
        await held;
      }
      const response = await route.fetch();
      await route.fulfill({ response });
    });

    await gotoProgress(page);
    await firstSeen;
    // The second sync carries a different id, so the count shows whether the first
    // had landed.
    await page.evaluate(id => localStorage.setItem('sb_progress', JSON.stringify([id])), second.id);
    const secondSynced = page.waitForResponse(r => r.url().endsWith('/api/progress/sync') && r.status() === 200);
    await signOutAndIn(page, user);
    await secondSynced;
    await expect(page).toHaveURL(/\/progress$/);

    await openManage(page);
    await page.getByLabel(BULK_COPY.scopeLabel).selectOption('level:Eidos 7');
    await page.getByRole('button', { name: BULK_COPY.clearButton }).click();
    // As above: a count that waited only for the newer sync is on its way already,
    // and would find one entry, not two.
    await page.evaluate(() => undefined);
    release();

    const scope = { label: 'Eidos 7', everything: false };
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toHaveAccessibleDescription(BULK_COPY.dialogBodyClear(2, '2', scope, true));
    await dialog.getByRole('button', { name: BULK_COPY.confirmClear('2') }).click();
    await expect(toast(page, BULK_COPY.successClear(2, '2', scope))).toBeVisible();
    const token = await apiLoginToken(page, user, ip);
    expect(await serverIds(page, token, ip)).toEqual([]);
  });
});

test.describe('bulk progress, guest copy', () => {
  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test("a guest tick applies to what storage holds now, not to the page's old copy", async ({ page }) => {
    const [a, b] = (await levelItems(page, 'eidos-7')).filter(c => c.id !== fx.collectibleId);
    await page.goto('/levels/eidos-7');
    await box(page, a.id).click();
    await expect(box(page, a.id)).toHaveAccessibleName('Mark as not found');
    expect(await stored(page)).toEqual([a.id]);

    // What a sign-in sync in another tab does to this page's storage.
    await page.evaluate(() => localStorage.removeItem('sb_progress'));
    await box(page, b.id).click();
    expect(await stored(page)).toEqual([b.id]);
    await expect(box(page, a.id)).toHaveAccessibleName('Mark as found');
  });
});
