import { test, expect, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';

// "· N found" counts what the count line beside it counts: under a cycle filter,
// that cycle's entries only, quantity-weighted, with "all N" against that total.
// Entries come from the live catalog, never literals.

let fx: Fixtures;

type Item = { id: number; cycle: string; quantity: number; subtype?: string | null };

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

// The same sum the page shows.
const quantity = (items: Item[]) => items.reduce((sum, c) => sum + (c.quantity || 1), 0);

const pill = (page: Page, label: string) => page.getByRole('button', { name: label, exact: true });
const foundNote = (page: Page) => page.getByText(/^· (all )?\d+ found$/);

test.describe('found count under the cycle filter', () => {
  let ip: string;
  let user: TestUser;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, 'found');
    await apiRegister(page, user, ip);
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  });

  test.afterEach(async ({ page }) => {
    await apiDeleteUser(page, user, ip);
  });

  async function tick(page: Page, items: Item[]): Promise<void> {
    const login = await page.request.post('/api/auth/login', {
      data: { email: user.email, password: user.password },
      headers: { [TEST_IP_HEADER]: ip },
    });
    expect(login.status()).toBe(200);
    const { access_token } = (await login.json()) as { access_token: string };
    for (const c of items) {
      const r = await page.request.put(`/api/progress/${c.id}`, {
        headers: { Authorization: `Bearer ${access_token}`, [TEST_IP_HEADER]: ip },
      });
      expect(r.status()).toBe(200);
    }
  }

  test('a level page counts found entries under its cycle filter', async ({ page }) => {
    const items = await levelItems(page, 'eidos-7');
    const single = (cycle: string) => items.find(c => c.cycle === cycle && c.quantity === 1)!;
    const ngpp = items.filter(c => c.cycle === 'NG++');
    expect(single('NG+') && single('Base') && ngpp.length > 0, 'Eidos 7 must hold Base, NG+ and NG++').toBeTruthy();

    await tick(page, [single('NG+'), single('Base')]);
    await page.goto('/levels/eidos-7');
    await expect(foundNote(page)).toHaveText('· 2 found');
    await pill(page, 'NG+').click();
    await expect(foundNote(page)).toHaveText('· 1 found');
    await pill(page, 'NG').click();
    await expect(foundNote(page)).toHaveText('· 1 found');
    await pill(page, 'NG++').click();
    // Unanchored at the end: the found note shares this line, and the next check is about it.
    await expect(page.getByText(/^\d+ of \d+ collectibles \(NG\+\+\)/)).toBeVisible();
    await expect(foundNote(page)).toHaveCount(0);

    // A x2 entry counts 2, under its cycle and under All.
    const double = items.find(c => c.cycle === 'Base' && c.quantity > 1);
    expect(double, 'Eidos 7 must hold a Base entry worth more than 1').toBeTruthy();
    await tick(page, [double!]);
    await page.reload();
    await expect(foundNote(page)).toHaveText(`· ${2 + double!.quantity} found`);
    await pill(page, 'NG').click();
    await expect(foundNote(page)).toHaveText(`· ${1 + double!.quantity} found`);

    // Every NG++ entry found: "all" against the filtered total.
    await tick(page, ngpp);
    await page.reload();
    await pill(page, 'NG++').click();
    await expect(foundNote(page)).toHaveText(`· all ${quantity(ngpp)} found`);
  });

  test('a type page counts found entries under its cycle filter', async ({ page }) => {
    const items = await typeItems(page, 'cosmetics', 'nano-suits');
    const single = (cycle: string) => items.find(c => c.cycle === cycle && c.quantity === 1)!;
    const dlc = items.filter(c => c.cycle === 'DLC');
    expect(single('NG+') && single('Base') && dlc.length > 0, 'Nano Suits must hold Base, NG+ and DLC').toBeTruthy();

    await tick(page, [single('NG+'), single('Base')]);
    await page.goto('/cosmetics/nano-suits');
    await expect(foundNote(page)).toHaveText('· 2 found');
    await pill(page, 'NG+').click();
    await expect(foundNote(page)).toHaveText('· 1 found');
    await pill(page, 'NG').click();
    await expect(foundNote(page)).toHaveText('· 1 found');

    await tick(page, dlc);
    await page.reload();
    await pill(page, 'DLC').click();
    await expect(foundNote(page)).toHaveText(`· all ${quantity(dlc)} found`);
  });

  test("the Documents page counts found entries under its subtype filter", async ({ page }) => {
    const docs = (await typeItems(page, 'collectibles', 'documents')).filter(c => c.subtype && c.quantity === 1);
    const found = docs[0];
    const other = docs.find(c => c.subtype !== found?.subtype);
    expect(found && other, 'Documents must hold two subtypes').toBeTruthy();

    await tick(page, [found]);
    await page.goto('/collectibles/documents');
    const subtype = page.getByTitle('Show Documents of a specific subtype');
    await expect(foundNote(page)).toHaveText('· 1 found');
    await subtype.selectOption(found.subtype!);
    await expect(foundNote(page)).toHaveText('· 1 found');
    await subtype.selectOption(other!.subtype!);
    await expect(page.getByText(new RegExp(`^\\d+ of \\d+ Documents \\(${other!.subtype}\\)`))).toBeVisible();
    await expect(foundNote(page)).toHaveCount(0);
  });
});
