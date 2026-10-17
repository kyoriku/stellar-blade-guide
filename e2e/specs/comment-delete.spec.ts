import { test, expect, type Page } from '@playwright/test';
import { readFixtures, createCommentThread, deleteFixtureComments, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { holdRoute } from '../helpers/route';

// The comment delete dialog (components/ConfirmModal.tsx), on the bulk dialog's
// pattern: a labelled modal that takes focus and gives it back, and refuses every
// way out while the delete is out.

let fx: Fixtures;

const MESSAGE = 'This comment will be removed. This action cannot be undone.';

test.describe('comment delete dialog', () => {
  let ip: string;
  let user: TestUser;
  let parentId: number;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, 'cdel');
    await apiRegister(page, user, ip);
    ({ parentId } = await createCommentThread(fx, user.username));
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
    await page.goto(`/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`);
  });

  test.afterEach(async ({ page }) => {
    await deleteFixtureComments(fx);
    await apiDeleteUser(page, user, ip);
  });

  // The parent's own block is its first child; the reply, by the same user, comes after.
  const own = (page: Page) => page.locator(`#comment-${parentId}`).locator(':scope > div').first();
  const deleteAction = (page: Page) => own(page).getByRole('button', { name: 'Delete', exact: true });
  const deletedBody = (page: Page) => own(page).locator('p', { hasText: '[deleted]' });
  const dialog = (page: Page) => page.getByRole('alertdialog', { name: 'Delete comment' });
  const heading = (page: Page) => page.getByRole('heading', { name: /^Comments/ });

  test('opens as a labelled modal with focus on Cancel, and gives focus back on Escape', async ({ page }) => {
    await deleteAction(page).click();
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page)).toHaveAccessibleDescription(MESSAGE);
    await expect(dialog(page).getByRole('button', { name: 'Cancel' })).toBeFocused();
    await expect(dialog(page).getByRole('button', { name: 'Close', exact: true })).toBeVisible();
    // closedby="none" would also stop Android's back gesture closing it.
    await expect(dialog(page)).not.toHaveAttribute('closedby', 'none');

    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    await expect(deleteAction(page)).toBeFocused();

    // Every other way out works too while nothing is running, so the refusals below
    // are refusals and not dead controls.
    for (const exit of ['close', 'cancel', 'backdrop'] as const) {
      await deleteAction(page).click();
      await expect(dialog(page)).toBeVisible();
      if (exit === 'close') await dialog(page).getByRole('button', { name: 'Close', exact: true }).click();
      if (exit === 'cancel') await dialog(page).getByRole('button', { name: 'Cancel' }).click();
      if (exit === 'backdrop') await page.mouse.click(5, 5);
      await expect(dialog(page), exit).toHaveCount(0);
      await expect(deleteAction(page), exit).toBeFocused();
    }
  });

  test("keeps the Delete action's room for its busy label after it, not around it", async ({ page }) => {
    // Reply, Edit and Delete sit in one row; the trash icon must be as far from Edit
    // as Edit's icon is from Reply, though the button reserves the wider "Deleting…".
    const button = (name: string) => own(page).getByRole('button', { name, exact: true });
    const right = (box: { x: number; width: number } | null) => box!.x + box!.width;
    const replyBox = await button('Reply').boundingBox();
    const editBox = await button('Edit').boundingBox();
    const editIcon = await button('Edit').locator('svg').first().boundingBox();
    const trash = await deleteAction(page).locator('svg').first().boundingBox();
    expect(Math.round(trash!.x - right(editBox))).toBe(Math.round(editIcon!.x - right(replyBox)));
  });

  test('refuses every way out while the delete is out, and a forced close lets it finish', async ({ page }) => {
    const del = await holdRoute(page, `**/api/comments/${parentId}`);
    await deleteAction(page).click();
    const confirm = dialog(page).getByRole('button', { name: 'Delete', exact: true });
    const idle = await confirm.boundingBox();
    await confirm.click();
    await del.seen;
    await expect(confirm).toHaveAttribute('aria-busy', 'true');
    const busy = await confirm.boundingBox();
    expect([busy?.width, busy?.height]).toEqual([idle?.width, idle?.height]);
    await expect(dialog(page)).not.toHaveAttribute('closedby', 'none');

    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeVisible();
    // aria-disabled buttons still take presses (the handler refuses them), but
    // Playwright waits for them to enable, so these clicks are forced.
    await dialog(page).getByRole('button', { name: 'Close', exact: true }).click({ force: true });
    await expect(dialog(page)).toBeVisible();
    await dialog(page).getByRole('button', { name: 'Cancel' }).click({ force: true });
    await expect(dialog(page)).toBeVisible();
    await page.mouse.click(5, 5); // the backdrop
    await expect(dialog(page)).toBeVisible();

    // Chrome's close watcher can still force a close on a repeated Escape or back
    // gesture; headless Chromium never does, so the test closes it the same way.
    await dialog(page).evaluate(d => (d as HTMLDialogElement).close());
    await expect(dialog(page)).toHaveCount(0);
    await expect(deleteAction(page)).toHaveAttribute('aria-busy', 'true');
    await expect(deleteAction(page).getByText(/^Deleting/)).toBeVisible();
    // The dialog's announcement went with it; the comment's own region says it.
    await expect(own(page).locator('[aria-live="polite"]')).toHaveText(/^Deleting/);

    del.release();
    await expect(deletedBody(page)).toBeVisible();
    await expect(heading(page)).toBeFocused();
  });

  test('leaves focus alone when the delete lands after someone moved on', async ({ page }) => {
    const del = await holdRoute(page, `**/api/comments/${parentId}`);
    await deleteAction(page).click();
    await dialog(page).getByRole('button', { name: 'Delete', exact: true }).click();
    await del.seen;
    await dialog(page).evaluate(d => (d as HTMLDialogElement).close());
    await expect(dialog(page)).toHaveCount(0);
    // While it runs, they start writing a comment; the delete must not pull them away.
    const box = page.getByPlaceholder('Share your thoughts, tips, or questions...');
    await box.click();
    await expect(box).toBeFocused();
    del.release();
    await expect(deletedBody(page)).toBeVisible();
    await expect(box).toBeFocused();
  });

  test('sends focus to the Comments heading once the delete has taken its button, without scrolling there', async ({ page }) => {
    // A short window with the comment at its top puts the heading above it.
    await page.setViewportSize({ width: 1280, height: 320 });
    await own(page).evaluate(el => el.scrollIntoView({ block: 'start' }));
    expect(await heading(page).evaluate(el => el.getBoundingClientRect().bottom), 'heading off-screen').toBeLessThan(0);
    const scrolled = await page.evaluate(() => window.scrollY);

    await deleteAction(page).click();
    await dialog(page).getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(deletedBody(page)).toBeVisible();
    await expect(heading(page)).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
  });

  test('waits for the list to update before focusing the heading, when the dialog closes first', async ({ page }) => {
    // TanStack re-renders the list on a setTimeout(0), in no fixed order with the
    // dialog's close (Safari's timers floor at 1 ms, so there the close usually wins).
    // A paused clock holds that timer, which forces the close to land first.
    await expect(deleteAction(page)).toBeVisible();
    await page.clock.install();
    await page.clock.pauseAt(Date.now() + 1000);
    await deleteAction(page).click();
    await dialog(page).getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(dialog(page)).toHaveCount(0);
    // Let the close's effects run (React posts them as messages; two turns is ample),
    // then check focus has not gone back to a Delete button about to disappear.
    await page.evaluate(() => new Promise(resolve => {
      const ch = new MessageChannel();
      let turns = 0;
      ch.port1.onmessage = () => (++turns === 2 ? resolve(null) : ch.port2.postMessage(null));
      ch.port2.postMessage(null);
    }));
    await expect(deleteAction(page)).not.toBeFocused();
    await expect(deletedBody(page)).toHaveCount(0); // the list has not updated yet
    await expect(heading(page)).not.toBeFocused(); // and the heading waits for it

    await page.clock.runFor(100);
    await expect(deletedBody(page)).toBeVisible();
    await expect(heading(page)).toBeFocused();
  });
});
