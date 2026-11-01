import { test, expect, type Locator, type Page } from '@playwright/test';
import { readFixtures, createCommentThread, deleteFixtureComments, setUserRole, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { BULK_COPY } from '../../client/src/constants/bulkProgressCopy';
import { ADMIN_COPY } from '../../client/src/constants/adminCopy';

// The confirm dialogs stop overscroll at their own edge (overscroll-behavior:
// none). With contain, macOS rubber-banded their content even when nothing
// overflowed. Headless Chromium has no elastic overscroll, so the computed style
// is what is pinned, beside a real scroll where a dialog does not fit.

let fx: Fixtures;
let ip: string;
let user: TestUser;
let admin: TestUser | null = null;
let seq = 0;

test.beforeAll(() => {
  fx = readFixtures();
});

test.beforeEach(async ({ page, context }) => {
  ip = nextTestIp();
  await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
  user = makeUser(fx.token, `ovs${++seq}`);
  admin = null;
  await apiRegister(page, user, ip);
  await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  await page.setViewportSize({ width: 1280, height: 800 });
});

test.afterEach(async ({ page }) => {
  await deleteFixtureComments(fx);
  await apiDeleteUser(page, user, ip);
  if (admin) {
    // Its own deletion route refuses an admin account.
    await setUserRole(admin.username, 'user');
    await apiDeleteUser(page, admin, ip);
  }
});

const shape = (dialog: Locator) => dialog.evaluate(el => {
  const s = getComputedStyle(el);
  return { overscroll: [s.overscrollBehaviorX, s.overscrollBehaviorY], overflows: el.scrollHeight > el.clientHeight };
});

// Nothing overflows at a desktop size, and at 320x256 the style still holds.
async function expectNoBounce(page: Page, dialog: Locator): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 800 });
  expect(await shape(dialog)).toEqual({ overscroll: ['none', 'none'], overflows: false });
  await page.setViewportSize({ width: 320, height: 256 });
  expect((await shape(dialog)).overscroll).toEqual(['none', 'none']);
}

// A dialog taller than 320x256 scrolls inside, and the page behind stays put.
async function expectScrollsWhenTooTall(page: Page, dialog: Locator): Promise<void> {
  await page.setViewportSize({ width: 320, height: 256 });
  expect((await shape(dialog)).overflows, 'taller than the window').toBe(true);
  const pageScroll = await page.evaluate(() => window.scrollY);
  const box = (await dialog.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => dialog.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(pageScroll);
}

test('the bulk dialogs stop overscroll at their own edge', async ({ page }) => {
  await page.goto('/progress');
  await page.getByRole('button', { name: BULK_COPY.heading }).click();
  const dialog = page.getByRole('alertdialog');

  await page.getByLabel(BULK_COPY.scopeLabel).selectOption('level:Eidos 7');
  await page.getByRole('button', { name: BULK_COPY.markButton }).click();
  await expect(dialog).toBeVisible();
  await expectNoBounce(page, dialog);
  await dialog.getByRole('button', { name: BULK_COPY.cancel }).click();
  await expect(dialog).toHaveCount(0);

  // The everything dialog, with its word input, is the one too tall for 320x256.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByLabel(BULK_COPY.scopeLabel).selectOption('everything');
  await page.getByRole('button', { name: BULK_COPY.markButton }).click();
  await expect(dialog.getByLabel(BULK_COPY.confirmWordLabel(BULK_COPY.confirmWord))).toBeVisible();
  await expectNoBounce(page, dialog);
  await expectScrollsWhenTooTall(page, dialog);
});

test('the comment delete dialog stops overscroll at its own edge', async ({ page }) => {
  const { parentId } = await createCommentThread(fx, user.username);
  await page.goto(`/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`);
  await page.locator(`#comment-${parentId}`).locator(':scope > div').first()
    .getByRole('button', { name: 'Delete', exact: true }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Delete comment' });
  await expect(dialog).toBeVisible();
  await expectNoBounce(page, dialog);
  await expectScrollsWhenTooTall(page, dialog);
});

test("the admin page's delete dialog stops overscroll at its own edge", async ({ page }) => {
  // The account above is the one to delete. The admin registers after it, so the page
  // signs in as the admin, and is made one by SQL: no route can make an admin.
  admin = makeUser(fx.token, `ovsadmin${seq}`);
  await apiRegister(page, admin, ip);
  await setUserRole(admin.username, 'admin');
  await page.goto('/admin');
  await page.getByRole('button', { name: ADMIN_COPY.actionsFor(user.username), exact: true }).click();
  await page.getByRole('menuitem', { name: ADMIN_COPY.delete, exact: true }).click();
  // The typed dialog, with its input, is too tall for 320x256 too.
  const dialog = page.getByRole('alertdialog', { name: ADMIN_COPY.deleteTitle, exact: true });
  await expect(dialog.getByLabel(ADMIN_COPY.deleteConfirmLabel(user.username), { exact: true })).toBeVisible();
  await expectNoBounce(page, dialog);
  await expectScrollsWhenTooTall(page, dialog);
});
