import { test, expect, type Locator, type Page } from '@playwright/test';
import { readFixtures, createCommentThread, deleteFixtureComments, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { BULK_COPY } from '../../client/src/constants/bulkProgressCopy';

// Both confirm dialogs stop overscroll at their own edge (overscroll-behavior:
// none). With contain, macOS rubber-banded their content even when nothing
// overflowed. Headless Chromium has no elastic overscroll, so the computed style
// is what is pinned, beside a real scroll where a dialog does not fit.

let fx: Fixtures;
let ip: string;
let user: TestUser;
let seq = 0;

test.beforeAll(() => {
  fx = readFixtures();
});

test.beforeEach(async ({ page, context }) => {
  ip = nextTestIp();
  await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
  user = makeUser(fx.token, `ovs${++seq}`);
  await apiRegister(page, user, ip);
  await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  await page.setViewportSize({ width: 1280, height: 800 });
});

test.afterEach(async ({ page }) => {
  await deleteFixtureComments(fx);
  await apiDeleteUser(page, user, ip);
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
