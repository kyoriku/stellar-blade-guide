import { test, expect, type Page } from '@playwright/test';
import { readFixtures, createCommentThread, deleteFixtureComments, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { holdRoute } from '../helpers/route';
import { expectBusyNow, expectBusyPattern, idleBox } from '../helpers/busy';

// The comment delete dialog (components/ConfirmModal.tsx), on the bulk dialog's
// pattern: a labelled modal that takes focus and gives it back, and refuses every
// way out while the delete is out. Back, Forward and a typed fragment close it.

let fx: Fixtures;

const MESSAGE = 'This comment will be removed. This action cannot be undone.';
// Short enough that the comment is out of view at the top of the fixture walkthrough.
const SHORT_WINDOW = { width: 1280, height: 320 };
// The first entry's offset, with the comment out of view. Not 0, where ScrollToTop puts a page
// whose hash went: only the browser's restore lands here.
const ENTRY_OFFSET = 40;

test.describe('comment delete dialog', () => {
  let ip: string;
  let user: TestUser;
  let parentId: number;
  let pagePath: string;
  // A walkthrough section near the top of the page.
  let sectionId: string;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, 'cdel');
    await apiRegister(page, user, ip);
    ({ parentId } = await createCommentThread(fx, user.username));
    pagePath = `/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`;
    sectionId = fx.titledSection.anchor;
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
    await page.goto(pagePath);
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

  test('refuses every way out while the delete is out, and a forced close lets it finish', async ({ page }) => {
    const del = await holdRoute(page, `**/api/comments/${parentId}`);
    const actionIdle = await idleBox(deleteAction(page));
    await deleteAction(page).click();
    // The dialog's Delete: a spinner in its label's place, at its idle size.
    const confirm = dialog(page).getByRole('button', { name: 'Delete', exact: true });
    await expectBusyPattern(confirm, {
      name: 'Delete', busyText: 'Deleting…', live: dialog(page).locator('[aria-live="polite"]'),
      press: () => confirm.click(), seen: del.seen,
    });
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
    // The comment's own Delete shows it now, the same way. The dialog's announcement
    // went with it; the comment's own region says it.
    await expectBusyNow(deleteAction(page), actionIdle, {
      name: 'Delete', busyText: 'Deleting…', live: own(page).locator('[aria-live="polite"]'),
    });

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
    const box = page.getByPlaceholder('Share your thoughts, tips, or questions…');
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

  // Under a modal only Back, Forward and a typed fragment can navigate, and Back or Forward between
  // two entries of one page keeps the comment, and so its dialog, mounted.
  test.describe('across entries of one page', () => {
    test.use({ viewport: SHORT_WINDOW });

    const offset = (page: Page) => page.evaluate(() => window.scrollY);
    const scrollLock = (page: Page) => page.evaluate(() => document.body.style.overflow);
    // Nothing has focus, so a Delete button out of view can't take the reader's next Space.
    const focusOnPage = (page: Page) => page.evaluate(() => document.activeElement === document.body);

    // A second entry of the page, by a typed fragment, as the bell's link to a comment on the
    // page already open makes one. The first entry waits at ENTRY_OFFSET.
    async function secondEntry(page: Page): Promise<void> {
      await page.evaluate(y => window.scrollTo(0, y), ENTRY_OFFSET);
      await expect.poll(() => offset(page)).toBe(ENTRY_OFFSET);
      await expect(deleteAction(page), 'the comment is out of view on the first entry').not.toBeInViewport();
      await page.goto(`${pagePath}#comment-${parentId}`);
      await expect(deleteAction(page)).toBeInViewport();
    }

    // Chromium's click focuses Delete, so the dialog's close gives focus back to it. Safari's click
    // never focuses a button, so its close gives focus to nothing, and only the comment's own
    // focus() can put it on Delete.
    const clickAsSafari = (page: Page) => page.evaluate(() => {
      const showModal = HTMLDialogElement.prototype.showModal;
      HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
        (document.activeElement as HTMLElement | null)?.blur();
        showModal.call(this);
      };
    });

    // The lock goes in the same task as the dialog's onClosed, so focus has settled once it has.
    async function closed(page: Page): Promise<void> {
      await expect(dialog(page)).toHaveCount(0);
      await expect.poll(() => scrollLock(page), 'the scroll lock let go').not.toBe('hidden');
    }

    for (const browser of ['Chromium', 'Safari'] as const) {
      test(`Back to the page's other entry closes it, with focus on the page and the offset Back restored (click as in ${browser})`, async ({ page }) => {
        if (browser === 'Safari') await clickAsSafari(page);
        await secondEntry(page);
        await deleteAction(page).click();
        await expect(dialog(page)).toBeVisible();

        await page.goBack();
        await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
        await closed(page);
        expect(await focusOnPage(page), 'focus on the page, not on Delete out of view').toBe(true);
        expect(await offset(page), 'the offset Back restored').toBe(ENTRY_OFFSET);
      });

      test(`Forward to the entry where the comment shows closes it, and gives focus back to Delete (click as in ${browser})`, async ({ page }) => {
        if (browser === 'Safari') await clickAsSafari(page);
        await secondEntry(page);
        await page.goBack();
        await expect.poll(() => page.evaluate(() => location.hash)).toBe('');
        await deleteAction(page).click();
        await expect(dialog(page)).toBeVisible();

        await page.goForward();
        await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#comment-${parentId}`);
        await closed(page);
        await expect(deleteAction(page)).toBeInViewport();
        await expect(deleteAction(page)).toBeFocused();
      });
    }

    test('a fragment typed with it open closes it, and leaves focus on the page at the fragment', async ({ page }) => {
      await deleteAction(page).scrollIntoViewIfNeeded();
      await deleteAction(page).click();
      await expect(dialog(page)).toBeVisible();

      await page.goto(`${pagePath}#${sectionId}`);
      await expect.poll(() => page.evaluate(() => location.hash)).toBe(`#${sectionId}`);
      await closed(page);
      expect(await focusOnPage(page), 'focus on the page, not on Delete out of view').toBe(true);
      await expect(page.locator(`[id="${sectionId}"]`)).toBeInViewport();
      await expect(deleteAction(page)).not.toBeInViewport();
    });

    test('Back while the delete is out closes it, and the delete lands without moving the page', async ({ page }) => {
      const del = await holdRoute(page, `**/api/comments/${parentId}`);
      await secondEntry(page);
      const actionIdle = await idleBox(deleteAction(page));
      await deleteAction(page).click();
      await dialog(page).getByRole('button', { name: 'Delete', exact: true }).click();
      await del.seen;

      await page.goBack();
      await closed(page);
      // The comment's own Delete shows it now, as after a forced close.
      await expectBusyNow(deleteAction(page), actionIdle, {
        name: 'Delete', busyText: 'Deleting…', live: own(page).locator('[aria-live="polite"]'),
      });
      expect(await focusOnPage(page), 'focus on the page, not on Delete out of view').toBe(true);
      expect(await offset(page), 'the offset Back restored').toBe(ENTRY_OFFSET);

      del.release();
      await expect(deletedBody(page)).toBeVisible();
      await expect(heading(page)).toBeFocused();
      expect(await offset(page), 'the delete landed where the reader was').toBe(ENTRY_OFFSET);
    });
  });
});
