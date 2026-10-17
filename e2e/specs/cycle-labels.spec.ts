import { test, expect, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { BULK_COPY } from '../../client/src/constants/bulkProgressCopy';
import { cycleLabel } from '../../client/src/constants/cycleLabels';

// The base cycle is stored as "Base" and shown as "NG" (constants/cycleLabels.ts).
// Display only: every request and API value keeps the stored name.

test.use({ locale: 'en-US' });

let fx: Fixtures;

type Item = { cycle: string; quantity: number };

// From the live catalog, never literals.
async function levelItems(page: Page, slug: string): Promise<Item[]> {
  const res = await page.request.get(`/api/levels/${slug}`);
  expect(res.status()).toBe(200);
  return ((await res.json()) as { collectibles: Item[] }[]).flatMap(l => l.collectibles);
}

async function typeItems(page: Page, category: string, slug: string): Promise<Item[]> {
  const res = await page.request.get(`/api/${category}/${slug}`);
  expect(res.status()).toBe(200);
  const levels = (await res.json()) as { locations: { collectibles: Item[] }[] }[];
  return levels.flatMap(l => l.locations.flatMap(loc => loc.collectibles));
}

// The page's cycle filter only renders for a page with several cycles, Base among them.
function expectBaseAndAnother(items: Item[], what: string): Set<string> {
  const cycles = new Set(items.map(c => c.cycle));
  expect(cycles.has('Base') && cycles.size > 1, `${what} must hold Base and another cycle`).toBe(true);
  return cycles;
}

const filterPill = (page: Page, label: string) => page.getByRole('button', { name: label, exact: true });

test.describe('cycle labels, guest', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test("a level page's cycle filter and count line call the base cycle NG", async ({ page }) => {
    const cycles = expectBaseAndAnother(await levelItems(page, 'eidos-7'), 'Eidos 7');
    await page.goto('/levels/eidos-7');
    for (const c of cycles) await expect(filterPill(page, cycleLabel(c))).toBeVisible();
    await expect(filterPill(page, 'Base')).toHaveCount(0);
    const ng = filterPill(page, 'NG');
    await expect(ng).toHaveAttribute('title', 'Show NG collectibles');
    await ng.click();
    await expect(page.getByText(/^\d+ of \d+ collectibles \(NG\)$/)).toBeVisible();
  });

  test("a type page's intro, head, cycle filter and count line call the base cycle NG", async ({ page }) => {
    const cycles = expectBaseAndAnother(await typeItems(page, 'cosmetics', 'nano-suits'), 'Nano Suits');
    await page.goto('/cosmetics/nano-suits');
    // Hand-written copy follows the label too.
    await expect(page.getByText(/^Stellar Blade has \d+ Nano Suits across NG, NG\+/)).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /across NG, NG\+/);
    await expect(page.getByText(/across Base/)).toHaveCount(0);
    for (const c of cycles) await expect(filterPill(page, cycleLabel(c))).toBeVisible();
    await expect(filterPill(page, 'Base')).toHaveCount(0);
    const ng = filterPill(page, 'NG');
    await expect(ng).toHaveAttribute('title', 'Show NG Nano Suits');
    await ng.click();
    await expect(page.getByText(/^\d+ of \d+ Nano Suits \(NG\)$/)).toBeVisible();
  });
});

test.describe('cycle labels, signed in', () => {
  let ip: string;
  let user: TestUser;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, 'cyclabel');
    await apiRegister(page, user, ip);
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  });

  test.afterEach(async ({ page }) => {
    await apiDeleteUser(page, user, ip);
  });

  test('the Progress page shows NG in its Cycles card and its pills, while a request still names Base', async ({ page }) => {
    const eidos = await levelItems(page, 'eidos-7');
    expectBaseAndAnother(eidos, 'Eidos 7');
    const baseQuantity = eidos.filter(c => c.cycle === 'Base').reduce((sum, c) => sum + c.quantity, 0);

    const statsLoaded = page.waitForResponse(r => r.url().endsWith('/api/users/me/stats') && r.status() === 200);
    await page.goto('/progress');
    await statsLoaded;
    const cyclesCard = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Cycles', exact: true }) });
    await expect(cyclesCard.getByText('NG', { exact: true })).toBeVisible();
    await expect(cyclesCard.getByText('Base', { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: BULK_COPY.heading }).click();
    await expect(page.getByRole('radio', { name: 'NG', exact: true })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Base', exact: true })).toHaveCount(0);

    await page.getByLabel(BULK_COPY.scopeLabel).selectOption('level:Eidos 7');
    await page.getByRole('radio', { name: 'NG', exact: true }).check();
    const previewSent = page.waitForRequest(r => r.url().endsWith('/api/progress/bulk/preview'));
    await page.getByRole('button', { name: BULK_COPY.markButton }).click();
    // Shown as NG, sent as Base.
    expect((await previewSent).postDataJSON()).toEqual({ scope: 'level', level: 'Eidos 7', action: 'mark_found', cycle: 'Base' });
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toHaveAccessibleDescription(BULK_COPY.dialogBodyMarkFound(
      baseQuantity, baseQuantity.toLocaleString('en-US'), { label: 'Eidos 7', everything: false, cycle: 'NG' }, false));
    await dialog.getByRole('button', { name: BULK_COPY.cancel }).click();
  });
});
