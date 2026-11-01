import { test, expect, type Page } from '@playwright/test';
import { readFixtures, createCommentThread, insertComment, deleteFixtureComments, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';

// Focus while editing and replying (components/comments/Comment.tsx). Each of these
// controls takes away the one that had focus, which used to leave it on the page
// itself: Edit puts it in the text box, with the caret at the end; Save and Cancel give
// it back to Edit; the reply form's Cancel, or a reply that lands, gives it back to
// Reply. A save or a reply that lands after the reader moved on or scrolled away leaves
// them where they are. While a save or a reply is out, Cancel is refused and the text
// box takes no typing (Comment.tsx, CommentForm.tsx), since what lands closes the form;
// a refused one lifts both, and a refused save shows its error as a toast if its editor
// has gone.

let fx: Fixtures;

const POST_BOX = 'Share your thoughts, tips, or questions...';
// The server's answer when moderation flags a comment.
const FLAGGED = 'Comment was flagged as inappropriate';

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
  let replyId: number;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, 'cfocus');
    await apiRegister(page, user, ip);
    ({ parentId, replyId } = await createCommentThread(fx, user.username));
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

  // The parent comment as the thread lists it.
  async function listedParent(page: Page) {
    const listed = await page.request.get(`/api/comments/walkthrough/${fx.walkthroughId}`);
    return ((await listed.json()) as { id: number; user: unknown }[]).find(c => c.id === parentId)!;
  }

  // Answers the parent's PATCH as the server would, with the comment and its new text,
  // without asking the server, which would first send the text to OpenAI's moderation.
  // When `held`, the answer waits for release().
  async function stubSave(page: Page, held = false) {
    const parent = await listedParent(page);
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

  // Answers a reply's POST as the server would, with the new reply, without asking the
  // server, which would moderate it first. When `held`, the answer waits for release().
  async function stubReply(page: Page, held = false) {
    const parent = await listedParent(page);
    let release = () => {};
    const gate = held ? new Promise<void>(resolve => { release = resolve; }) : Promise.resolve();
    let arrived!: () => void;
    const seen = new Promise<void>(resolve => { arrived = resolve; });
    await page.route('**/api/comments/', async route => {
      if (route.request().method() !== 'POST') return route.fallback();
      arrived();
      await gate;
      const sent = route.request().postDataJSON() as Record<string, unknown>;
      const now = new Date().toISOString();
      // An id no row holds: the page only draws it.
      await route.fulfill({
        status: 201,
        json: { id: 2_000_000_000, ...sent, is_deleted: false, created_at: now, updated_at: now, user: parent.user },
      });
    });
    return { release: () => release(), seen };
  }
  const replyBox = (page: Page) => own(page).getByPlaceholder(/^Reply to /);
  const drawnReply = (page: Page) => page.locator('#comment-2000000000');
  const replyText = () => `E2E ${fx.token} second reply`;

  async function startReply(page: Page): Promise<void> {
    await button(page, 'Reply').click();
    await replyBox(page).fill(replyText());
    // The form's own button is named Reply too; the comment's is hidden while it's open.
    await button(page, 'Reply').click();
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
    // Edit is back only once the save has landed. Until then the edited text is also
    // the open box's own text, so it can't show the save landed.
    await expect(button(page, 'Edit')).toBeFocused();
    await expect(own(page).getByText(edited(), { exact: true })).toBeVisible();
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
    // The editor closes only once the save lands.
    await expect(editBox(page)).toHaveCount(0);
    await expect(own(page).getByText(edited(), { exact: true })).toBeVisible();
    await settle(page);
    await expect(box).toBeFocused();
  });

  test("a save that lands after the reader scrolled away leaves focus on the page and doesn't scroll them back", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 400 });
    const save = await stubSave(page, true);
    await startSave(page);
    await save.seen;
    // They read back up the page while it runs.
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await own(page).evaluate(el => el.getBoundingClientRect().top > window.innerHeight), 'comment off-screen').toBe(true);

    save.release();
    // The editor closes only once the save lands.
    await expect(editBox(page)).toHaveCount(0);
    await settle(page);
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    // So Space pages the window, rather than pressing an Edit they can't see.
    await page.keyboard.press('Space');
    await settle(page);
    await expect(editBox(page)).toHaveCount(0);
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
    await expect(replyBox(page)).toBeFocused();

    await button(page, 'Cancel').click();
    await expect(replyBox(page)).toHaveCount(0);
    await expect(button(page, 'Reply')).toBeFocused();
  });

  test('a reply that lands gives focus back to Reply', async ({ page }) => {
    await stubReply(page);
    await startReply(page);
    // The form closes only once the reply lands.
    await expect(replyBox(page)).toHaveCount(0);
    await expect(drawnReply(page)).toContainText(replyText());
    await expect(button(page, 'Reply')).toBeFocused();
  });

  test('a reply that lands after someone moved on leaves focus where they put it', async ({ page }) => {
    const post = await stubReply(page, true);
    await startReply(page);
    await post.seen;
    // While it posts, they start writing a new comment.
    const box = page.getByPlaceholder(POST_BOX);
    await box.click();
    await expect(box).toBeFocused();

    post.release();
    await expect(replyBox(page)).toHaveCount(0);
    await settle(page);
    await expect(box).toBeFocused();
  });

  test("a reply that lands after the reader scrolled away leaves focus on the page and doesn't scroll them back", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 400 });
    const post = await stubReply(page, true);
    await startReply(page);
    await post.seen;
    // They read back up the page while it posts.
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await own(page).evaluate(el => el.getBoundingClientRect().top > window.innerHeight), 'comment off-screen').toBe(true);

    post.release();
    // The form closes only once the reply lands.
    await expect(replyBox(page)).toHaveCount(0);
    await settle(page);
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    // So Space pages the window, rather than pressing a Reply they can't see.
    await page.keyboard.press('Space');
    await settle(page);
    await expect(replyBox(page)).toHaveCount(0);
  });

  test('Cancel brings Reply into view when the window cut through the reply form', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 400 });
    await button(page, 'Reply').click();
    await expect(replyBox(page)).toBeFocused();
    // Two things would bring Reply back into view by themselves as the form goes:
    // Chromium's scroll anchoring, keeping what's below it in place (WebKit has none),
    // and a page that ends near the form, whose shorter scroll range pulls the window
    // up. Both off, so only the focus call can.
    await page.addStyleTag({ content: 'html, body { overflow-anchor: none } body { padding-bottom: 100vh }' });
    // The window's top edge cuts through the form, so it counts as on screen, while the
    // row Reply comes back to sits above the window.
    await replyBox(page).evaluate(el => {
      window.scrollTo(0, window.scrollY + el.closest('form')!.getBoundingClientRect().top + 20);
    });
    const [top, bottom] = await replyBox(page).evaluate(el => {
      const r = el.closest('form')!.getBoundingClientRect();
      return [r.top, r.bottom];
    });
    expect(top, 'form top above the window').toBeLessThan(0);
    expect(bottom, 'form bottom in the window').toBeGreaterThan(0);

    await button(page, 'Cancel').click();
    await expect(button(page, 'Reply')).toBeFocused();
    await expect(button(page, 'Reply')).toBeInViewport();
  });

  test('Cancel waits while a save is out, and the box takes no typing meanwhile', async ({ page }) => {
    const save = await stubSave(page, true);
    await startSave(page);
    await save.seen;
    const cancel = button(page, 'Cancel');
    await expect(cancel).toHaveAttribute('aria-disabled', 'true');
    // Playwright waits on an aria-disabled button, so the press is forced; the handler
    // is what refuses it.
    await cancel.click({ force: true });
    await expect(editBox(page)).toBeVisible();
    await expect(editBox(page)).not.toBeEditable();
    await editBox(page).focus();
    await expect(editBox(page)).toBeFocused();
    await page.keyboard.type(' more');
    await expect(editBox(page)).toHaveValue(edited());

    save.release();
    // Edit is back only once the save has landed; then the text is the saved comment's.
    await expect(button(page, 'Edit')).toBeFocused();
    await expect(own(page).getByText(edited(), { exact: true })).toBeVisible();
  });

  test("the reply form's Cancel waits while a reply is posting, and its box takes no typing meanwhile", async ({ page }) => {
    const post = await stubReply(page, true);
    await startReply(page);
    await post.seen;
    const cancel = button(page, 'Cancel');
    await expect(cancel).toHaveAttribute('aria-disabled', 'true');
    await cancel.click({ force: true });
    await expect(replyBox(page)).toBeVisible();
    await expect(replyBox(page)).not.toBeEditable();
    await replyBox(page).focus();
    await expect(replyBox(page)).toBeFocused();
    await page.keyboard.type(' more');
    await expect(replyBox(page)).toHaveValue(replyText());

    post.release();
    await expect(replyBox(page)).toHaveCount(0);
    await expect(drawnReply(page)).toContainText(replyText());
    await expect(button(page, 'Reply')).toBeFocused();
  });

  test('a refused save lifts the hold: its error shows, the box takes typing, and Cancel works', async ({ page }) => {
    await page.route(`**/api/comments/${parentId}`, route =>
      route.request().method() === 'PATCH' ? route.fulfill({ status: 400, json: { detail: FLAGGED } }) : route.fallback());
    await startSave(page);
    await expect(own(page).getByText(FLAGGED, { exact: true })).toBeVisible();
    // Its editor is still there, so no toast as well. One-shot: a toast fades on its
    // timer, so a retrying count could pass once it had.
    expect(await page.getByRole('status').getByText(FLAGGED, { exact: true }).count()).toBe(0);
    await expect(editBox(page)).toBeEditable();
    const cancel = button(page, 'Cancel');
    await expect(cancel).toHaveAttribute('aria-disabled', 'false');
    // Unforced: Playwright would wait on a Cancel still aria-disabled.
    await cancel.click();
    await expect(editBox(page)).toHaveCount(0);
    await expect(button(page, 'Edit')).toBeFocused();
  });

  test('a refused reply lifts the hold: its error shows, the box takes typing, and Cancel works', async ({ page }) => {
    await page.route('**/api/comments/', route =>
      route.request().method() === 'POST' ? route.fulfill({ status: 400, json: { detail: FLAGGED } }) : route.fallback());
    await startReply(page);
    await expect(own(page).getByText(FLAGGED, { exact: true })).toBeVisible();
    await expect(replyBox(page)).toBeEditable();
    const cancel = button(page, 'Cancel');
    await expect(cancel).toHaveAttribute('aria-disabled', 'false');
    await cancel.click();
    await expect(replyBox(page)).toHaveCount(0);
    await expect(button(page, 'Reply')).toBeFocused();
  });

  test('a refused save shows its error as a toast once collapsing the replies has taken its editor away', async ({ page }) => {
    const reply = page.locator(`#comment-${replyId}`).locator(':scope > div').first();
    const replies = own(page).getByRole('button', { name: '1 reply', exact: true });
    // The reply's PATCH is held, then refused, as moderation would refuse it.
    let release = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    let arrived!: () => void;
    const seen = new Promise<void>(resolve => { arrived = resolve; });
    await page.route(`**/api/comments/${replyId}`, async route => {
      if (route.request().method() !== 'PATCH') return route.fallback();
      arrived();
      await gate;
      await route.fulfill({ status: 400, json: { detail: FLAGGED } });
    });
    await reply.getByRole('button', { name: 'Edit', exact: true }).click();
    await reply.getByRole('textbox').fill(`E2E ${fx.token} reply edited`);
    await reply.getByRole('button', { name: 'Save', exact: true }).click();
    await seen;
    // Collapsing the thread takes the reply, and its editor, off the page mid-save.
    await replies.click();
    await expect(reply).toHaveCount(0);

    release();
    await expect(page.getByRole('status').getByText(FLAGGED, { exact: true })).toBeVisible();
    // Opened again, the reply shows its old text, and no editor.
    await replies.click();
    await expect(reply.getByText(`E2E ${fx.token} reply`, { exact: true })).toBeVisible();
    await expect(reply.getByRole('textbox')).toHaveCount(0);
  });
});
