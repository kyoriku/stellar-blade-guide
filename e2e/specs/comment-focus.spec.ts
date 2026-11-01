import { test, expect, type Page } from '@playwright/test';
import { readFixtures, createCommentThread, insertComment, deleteFixtureComments, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';

// Focus while editing and replying (components/comments/Comment.tsx). Each of these
// controls takes away the one that had focus, which used to leave it on the page
// itself: Edit puts it in the text box, with the caret at the end; Save and Cancel give
// it back to Edit; the reply form's Cancel gives it back to Reply. A save that lands
// after the reader moved on or scrolled away leaves them where they are.

let fx: Fixtures;

const POST_BOX = 'Share your thoughts, tips, or questions...';

// Lets React run the effects of what just rendered (it posts them as messages; two turns
// are ample), so a focus check after it would see a move that was going to happen.
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise(resolve => {
    const ch = new MessageChannel();
    let turns = 0;
    ch.port1.onmessage = () => (++turns === 2 ? resolve(null) : ch.port2.postMessage(null));
    ch.port2.postMessage(null);
  }));
}

test.describe('comment edit and reply focus', () => {
  let ip: string;
  let user: TestUser;
  let parentId: number;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, 'cfocus');
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
  const button = (page: Page, name: string) => own(page).getByRole('button', { name, exact: true });
  const editBox = (page: Page) => own(page).getByRole('textbox');
  const edited = () => `E2E ${fx.token} edited`;

  // Answers the parent's PATCH as the server would, with the comment and its new text,
  // without asking the server, which would first send the text to OpenAI's moderation.
  // When `held`, the answer waits for release().
  async function stubSave(page: Page, held = false) {
    const listed = await page.request.get(`/api/comments/walkthrough/${fx.walkthroughId}`);
    const parent = ((await listed.json()) as { id: number }[]).find(c => c.id === parentId)!;
    let release = () => {};
    const gate = held ? new Promise<void>(resolve => { release = resolve; }) : Promise.resolve();
    let arrived!: () => void;
    const seen = new Promise<void>(resolve => { arrived = resolve; });
    await page.route(`**/api/comments/${parentId}`, async route => {
      if (route.request().method() !== 'PATCH') return route.fallback();
      arrived();
      await gate;
      const { body } = route.request().postDataJSON() as { body: string };
      await route.fulfill({ json: { ...parent, replies: undefined, body } });
    });
    return { release: () => release(), seen };
  }

  async function startSave(page: Page): Promise<void> {
    await button(page, 'Edit').click();
    await editBox(page).fill(edited());
    await button(page, 'Save').click();
  }

  test('Edit puts focus in the text box with the caret at the end, and Cancel gives it back to Edit', async ({ page }) => {
    await button(page, 'Edit').click();
    await expect(editBox(page)).toBeFocused();
    const caret = await editBox(page).evaluate(el => {
      const box = el as HTMLTextAreaElement;
      return [box.selectionStart, box.selectionEnd, box.value.length];
    });
    expect(caret).toEqual([caret[2], caret[2], `E2E ${fx.token} comment`.length]);

    await button(page, 'Cancel').click();
    await expect(editBox(page)).toHaveCount(0);
    await expect(button(page, 'Edit')).toBeFocused();
  });

  test('Save gives focus back to Edit', async ({ page }) => {
    await stubSave(page);
    await startSave(page);
    await expect(own(page).getByText(edited(), { exact: true })).toBeVisible();
    await expect(button(page, 'Edit')).toBeFocused();
  });

  test('a save that lands after someone moved on leaves focus where they put it', async ({ page }) => {
    const save = await stubSave(page, true);
    await startSave(page);
    await save.seen;
    // While it runs, they start writing a new comment.
    const box = page.getByPlaceholder(POST_BOX);
    await box.click();
    await expect(box).toBeFocused();

    save.release();
    await expect(own(page).getByText(edited(), { exact: true })).toBeVisible();
    await settle(page);
    await expect(box).toBeFocused();
  });

  test("a save that lands after the reader scrolled away doesn't scroll them back", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 400 });
    const save = await stubSave(page, true);
    await startSave(page);
    await save.seen;
    // They read back up the page while it runs.
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await own(page).evaluate(el => el.getBoundingClientRect().top > window.innerHeight), 'comment off-screen').toBe(true);

    save.release();
    await expect(button(page, 'Edit')).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('Cancel on a long comment brings Edit into view, since the editor was on screen', async ({ page }) => {
    // Forty lines: the three-row editor stands in for a body much taller than the window.
    const body = Array.from({ length: 40 }, (_, i) => `E2E ${fx.token} line ${i + 1}`).join('\n');
    const at = new Date().toISOString();
    const longId = await insertComment(fx, { username: user.username, body, postedAt: at, changedAt: at });
    await page.setViewportSize({ width: 1280, height: 400 });
    await page.reload();
    const long = page.locator(`#comment-${longId}`).locator(':scope > div').first();
    const edit = long.getByRole('button', { name: 'Edit', exact: true });

    await edit.click();
    await expect(long.getByRole('textbox')).toBeFocused();
    await long.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(edit).toBeFocused();
    await expect(edit).toBeInViewport();
  });

  test("the reply form's Cancel gives focus back to Reply", async ({ page }) => {
    await button(page, 'Reply').click();
    const replyBox = own(page).getByPlaceholder(/^Reply to /);
    await expect(replyBox).toBeFocused();

    await button(page, 'Cancel').click();
    await expect(replyBox).toHaveCount(0);
    await expect(button(page, 'Reply')).toBeFocused();
  });
});
