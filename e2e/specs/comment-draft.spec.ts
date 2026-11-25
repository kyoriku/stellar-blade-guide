import { test, expect, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';

// A comment draft belongs to its page's thread: CommentSection keys the thread on its
// content. Next, Previous, Back and Forward keep the page itself mounted when the page they
// go to is cached, and the thread used to stay mounted with it, so a draft followed the
// reader to the next page and Post filed it there. Two entries of one page show the same
// thread, so a same-page link, Back and Forward keep the draft. Nothing here posts.

let fx: Fixtures;
const DRAFT = 'E2E draft, never posted';
const POST_BOX = 'Share your thoughts, tips, or questions…';
const CARDS = 'section[id] article[id]';
const TYPE = '/cosmetics/nano-suits';
const WALKTHROUGH = '/walkthroughs/side-quests/looking-at-you';
const LEVEL = '/levels/eidos-7';
// An id no row holds: the keep tests answer the thread and the bell here, and the page only draws it.
const COMMENT_ID = 2_000_000_000;

const box = (page: Page) => page.getByPlaceholder(POST_BOX, { exact: true });
const nextLink = (page: Page) => page.locator('a').filter({ hasText: /^Next/ });
const h1 = (page: Page) => page.getByRole('heading', { level: 1 });
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A same-page wikilink on a card that stays on screen under All (as in filter-memory.spec.ts).
async function samePageLink(page: Page): Promise<string> {
  await page.locator(CARDS).first().waitFor();
  const href = await page.evaluate((path) => {
    for (const a of document.querySelectorAll<HTMLAnchorElement>(`article a[href^="${path}#"]`)) {
      const href = a.getAttribute('href')!;
      if (document.getElementById(decodeURIComponent(href.slice(href.indexOf('#') + 1)))) return href;
    }
    return null;
  }, TYPE);
  expect(href, `a card on ${TYPE} links another card on it`).not.toBeNull();
  return href!;
}

// Answers the page's thread with one comment and the bell with a reply to it, so the bell
// links to a comment on the page already open. Reads, and marking it read, answered here.
async function stubThreadAndBell(page: Page, contentType: string, path: string): Promise<void> {
  const at = new Date().toISOString();
  const someone = { id: 1, username: `e2e_${fx.token}_someone`, avatar_url: null, role: 'user' };
  await page.route(`**/api/comments/${contentType}/*`, route => route.fulfill({
    json: [{ id: COMMENT_ID, content_type: contentType, content_id: 1, parent_id: null, body: `E2E ${fx.token} comment`, is_deleted: false, created_at: at, updated_at: at, user: someone, replies: [] }],
  }));
  await page.route('**/api/notifications', route => route.fulfill({
    json: { items: [{ id: COMMENT_ID, type: 'comment_reply', actor_username: someone.username, label: 'this page', url: `${path}#comment-${COMMENT_ID}`, content_type: contentType, content_id: 1, is_read: false, created_at: at }], unread_count: 1 },
  }));
  await page.route('**/api/notifications/*/read', route => route.fulfill({ status: 204 }));
}

test.describe('comment drafts', () => {
  // The bell shows from lg.
  test.use({ viewport: { width: 1280, height: 800 } });
  let ip: string;
  let user: TestUser;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, 'draft');
    await apiRegister(page, user, ip);
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  });

  test.afterEach(async ({ page }) => {
    await apiDeleteUser(page, user, ip);
  });

  const PAGES = [
    { kind: 'walkthrough', path: WALKTHROUGH, content: 'section > div.walkthrough-content[id]' },
    { kind: 'level', path: LEVEL, content: CARDS },
    { kind: 'type', path: TYPE, content: CARDS },
  ];
  for (const { kind, path, content } of PAGES) {
    test(`a draft doesn't follow Next to the next ${kind} page`, async ({ page }) => {
      await page.goto(path);
      await page.locator(content).first().waitFor();
      const first = (await h1(page).textContent())!.trim();
      // The next page goes into the cache first, as a hover over Next or an earlier visit puts
      // it: Next then keeps this page mounted, which is how a draft used to follow.
      await nextLink(page).click();
      await expect(h1(page)).not.toHaveText(first);
      await page.locator(content).first().waitFor();
      const second = (await h1(page).textContent())!.trim();
      await page.goBack();
      await expect(h1(page)).toHaveText(first);

      await box(page).fill(DRAFT);
      await h1(page).evaluate(el => { el.dataset.e2eMounted = 'yes'; });
      await nextLink(page).click();
      await expect(h1(page)).toHaveText(second);
      await expect(h1(page), 'the page stayed mounted: the next page came from the cache').toHaveAttribute('data-e2e-mounted', 'yes');
      await expect(box(page)).toHaveValue('');
    });
  }

  test('a same-page link on a type page keeps the draft, and so do Back and Forward', async ({ page }) => {
    await page.goto(TYPE);
    await box(page).fill(DRAFT);
    const href = await samePageLink(page);
    const card = page.locator(`[id="${decodeURIComponent(href.slice(href.indexOf('#') + 1))}"]`);
    await expect(card, 'the linked card starts off screen').not.toBeInViewport();
    await page.locator(`article a[href="${href}"]`).first().evaluate(a => (a as HTMLElement).click());
    // The jump to the card shows the new entry has rendered.
    await expect(card).toBeInViewport();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href)}$`));
    await expect(box(page)).toHaveValue(DRAFT);

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${TYPE}$`));
    await expect(box(page)).toHaveValue(DRAFT);
    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href)}$`));
    await expect(box(page)).toHaveValue(DRAFT);
  });

  // The thread belongs to its page, so Back to another walkthrough takes an open delete dialog
  // away with its thread and sends focus nowhere. While the thread stayed mounted, the dialog's
  // close sent focus to the Comments heading of the page Back had just shown.
  test('Back with the delete dialog open on the next walkthrough sends focus nowhere, and lets the page scroll', async ({ page }) => {
    // Once the reader is known, every walkthrough's thread holds one comment of theirs, so it
    // offers Delete. Nothing is deleted.
    let me: number | null = null;
    await page.route('**/api/comments/walkthrough/*', route => {
      const contentId = Number(new URL(route.request().url()).pathname.split('/').pop());
      const at = new Date().toISOString();
      return route.fulfill({
        json: me === null ? [] : [{ id: COMMENT_ID - contentId, content_type: 'walkthrough', content_id: contentId, parent_id: null, body: `E2E ${fx.token} own comment`, is_deleted: false, created_at: at, updated_at: at, user: { id: me, username: 'e2e reader', avatar_url: null, role: 'user' }, replies: [] }],
      });
    });
    await page.goto(WALKTHROUGH);
    await expect(box(page)).toBeVisible();
    me = await page.evaluate(() => (JSON.parse(localStorage.getItem('sb_user') ?? '{}') as { id?: number }).id ?? null);
    expect(me, 'the signed-in reader').not.toBeNull();
    const first = (await h1(page).textContent())!.trim();

    await nextLink(page).click();
    await expect(h1(page)).not.toHaveText(first);
    const own = page.locator('[id^="comment-"]').first();
    await own.getByRole('button', { name: 'Delete', exact: true }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Delete comment' });
    await expect(dialog).toBeVisible();
    await h1(page).evaluate(el => { el.dataset.e2eMounted = 'yes'; });
    await page.evaluate(() => {
      const w = window as unknown as { headingFocus: string[] };
      w.headingFocus = [];
      document.addEventListener('focusin', e => {
        const el = e.target as HTMLElement;
        if (el.tagName === 'H2' && (el.textContent ?? '').startsWith('Comments')) w.headingFocus.push(el.textContent!);
      }, true);
    });

    await page.goBack();
    await expect(h1(page)).toHaveText(first);
    await expect(h1(page), 'the page stayed mounted: Back kept it').toHaveAttribute('data-e2e-mounted', 'yes');
    await expect(dialog).toHaveCount(0);
    // React runs the dialog's close within two message turns.
    await page.evaluate(() => new Promise(resolve => {
      const ch = new MessageChannel();
      let turns = 0;
      ch.port1.onmessage = () => (++turns === 2 ? resolve(null) : ch.port2.postMessage(null));
      ch.port2.postMessage(null);
    }));
    expect(await page.evaluate(() => (window as unknown as { headingFocus: string[] }).headingFocus), 'no focus sent to a Comments heading').toEqual([]);
    expect(await page.evaluate(() => document.body.style.overflow), 'the scroll lock let go').not.toBe('hidden');
  });

  for (const { kind, path, contentType } of [
    { kind: 'walkthrough', path: WALKTHROUGH, contentType: 'walkthrough' },
    { kind: 'level', path: LEVEL, contentType: 'level' },
  ]) {
    test(`the bell's link to a comment on the ${kind} page already open keeps the draft, and so does Back`, async ({ page }) => {
      await stubThreadAndBell(page, contentType, path);
      await page.goto(path);
      const comment = page.locator(`#comment-${COMMENT_ID}`);
      await comment.waitFor();
      await box(page).fill(DRAFT);
      await page.getByRole('button', { name: 'Notifications (1 unread)', exact: true }).click();
      await page.getByRole('link', { name: /replied to your comment/ }).click();
      // The thread's highlight shows the new entry has rendered.
      await expect(comment).toHaveClass(/ring-2/);
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(path)}#comment-${COMMENT_ID}$`));
      await expect(box(page)).toHaveValue(DRAFT);

      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(path)}$`));
      await expect(box(page)).toHaveValue(DRAFT);
    });
  }
});
