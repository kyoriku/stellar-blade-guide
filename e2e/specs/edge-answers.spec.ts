import { test, expect, type Page } from '@playwright/test';
import { readFixtures, createCommentThread, deleteFixtureComments, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { EDGE, type Answer } from '../helpers/edge';
import { CHALLENGE_MESSAGE, COMMENT_CHALLENGE_MESSAGE } from '../../client/src/constants/errorCopy';

// Answers the API never sends, read for what they are (apiError in client/src/services/api.ts):
// a Cloudflare challenge says to reload, and a body that isn't JSON gets the call's own sentence,
// never the parser's, which quotes the body.

let fx: Fixtures;

const LEVEL = '/levels/eidos-7';
const SAVE_FAILED = "Couldn't save your progress. Please try again.";

// Results are toasts; the toast container is the page's only role="status".
const toast = (page: Page, text: string) => page.getByRole('status').getByText(text, { exact: true });
// The parser's own words, which quote the body.
const parserText = (page: Page) => page.getByText(/not valid JSON|Unexpected token|Unexpected end of JSON/);
const toggle = (page: Page) =>
  page.locator(`article#collectible-${fx.collectibleId}`).getByRole('button', { name: /Mark as/ });

// A reload clears window properties; a refetch keeps them.
const mark = (page: Page) => page.evaluate(() => { (window as unknown as { __kept: boolean }).__kept = true; });
const sameDocument = (page: Page) => page.evaluate(() => '__kept' in window);

test.beforeAll(() => {
  fx = readFixtures();
});

test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
});

test("a sign-in answered by a challenge, or by a page that isn't JSON, says so in the site's words", async ({ page }) => {
  let answer: Answer = EDGE.challenge403();
  await page.route('**/api/auth/login', route => route.fulfill(answer));
  await page.goto('/login');
  await page.getByLabel('Email').fill(`e2e-${fx.token}-nobody@sbg-e2e-suite.dev`);
  await page.getByLabel('Password', { exact: true }).fill('e2e-Password-123');
  const signIn = page.getByRole('button', { name: 'Sign in', exact: true });
  const alert = page.locator('form').getByRole('alert');
  for (const [what, next, shown] of [
    ['a challenge', EDGE.challenge403(), CHALLENGE_MESSAGE],
    ["a 200 that isn't JSON", EDGE.html200(), 'Login failed'],
  ] as const) {
    answer = next;
    await signIn.click();
    await expect(alert, what).toHaveText(shown);
  }
  await expect(parserText(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Account menu' })).toHaveCount(0);
});

test('a search answered by a challenge says to reload, in the bar and in the drawer', async ({ page }) => {
  let asked = 0;
  await page.route('**/api/search/**', route => {
    asked += 1;
    return route.fulfill(EDGE.challenge403());
  });
  for (const [where, size, open, input] of [
    ['the bar', { width: 1280, height: 800 }, 'Search (Ctrl+K)', 'Search…'],
    ['the drawer', { width: 390, height: 844 }, 'Toggle menu', 'Search collectibles, walkthroughs, levels…'],
  ] as const) {
    asked = 0;
    await page.setViewportSize(size);
    await page.goto('/levels');
    await page.getByRole('button', { name: open }).click();
    await page.getByPlaceholder(input).fill('nano');
    await expect(page.getByText(CHALLENGE_MESSAGE, { exact: true }), where).toBeVisible();
    await expect(page.getByText('Failed to load search'), where).toHaveCount(0);
    // useSearch doesn't retry.
    expect(asked, where).toBe(1);
  }
});

test.describe('signed in', () => {
  let ip: string;
  let user: TestUser;
  let seq = 0;

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, `edge${++seq}`);
    await apiRegister(page, user, ip);
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  });

  test.afterEach(async ({ page }) => {
    await deleteFixtureComments(fx);
    await apiDeleteUser(page, user, ip);
  });

  test("a tick answered by a challenge, a block, or a page that isn't JSON says so in the site's words, and the box goes back", async ({ page }) => {
    // Signed in once the progress has loaded; a click before it takes the guest path.
    const progressLoaded = page.waitForResponse(r =>
      new URL(r.url()).pathname === '/api/progress' && r.request().method() === 'GET' && r.status() === 200);
    await page.goto(LEVEL);
    await progressLoaded;
    await mark(page);
    for (const [what, answer, shown] of [
      ['a challenge', EDGE.challenge403, CHALLENGE_MESSAGE],
      ["Cloudflare's block", EDGE.block403, SAVE_FAILED],
      ["a 200 that isn't JSON", EDGE.html200, SAVE_FAILED],
    ] as const) {
      await page.route(`**/api/progress/${fx.collectibleId}`, route => route.fulfill(answer()), { times: 1 });
      await toggle(page).click();
      await expect(toast(page, shown), what).toBeVisible();
      await expect(toggle(page), what).toHaveAccessibleName('Mark as found');
      await expect(toggle(page), what).toBeEnabled();
      // Toasts with the same words don't stack, so each answer's own goes before the next.
      await page.getByRole('status').locator(':scope > div').filter({ hasText: shown })
        .getByRole('button', { name: 'Dismiss' }).click();
      await expect(toast(page, shown), what).toHaveCount(0);
    }
    await expect(parserText(page)).toHaveCount(0);
    expect(await sameDocument(page), 'never reloaded by itself').toBe(true);
  });

  test("a comment answered by a challenge, or by a page that isn't JSON, says so in the site's words and keeps the text", async ({ page }) => {
    await page.goto(`/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`);
    const box = page.getByPlaceholder('Share your thoughts, tips, or questions…');
    const form = page.locator('form').filter({ has: box });
    // Answered here, so nothing is posted or sent to moderation.
    let posted = 0;
    let answer: Answer = EDGE.challenge403();
    await page.route('**/api/comments/', route => {
      if (route.request().method() !== 'POST') return route.fallback();
      posted += 1;
      return route.fulfill(answer);
    });
    for (const [what, next, shown] of [
      // A reload would lose the text, so the sentence says to copy it first.
      ['a challenge', EDGE.challenge403(), COMMENT_CHALLENGE_MESSAGE],
      ["a 200 that isn't JSON", EDGE.html200(), 'Failed to post comment'],
    ] as const) {
      answer = next;
      // New words each time: an error stands until the text changes.
      const text = `E2E ${fx.token} edge comment, ${what}`;
      await box.fill(text);
      await form.getByRole('button', { name: 'Post comment', exact: true }).click();
      await expect(form.getByRole('alert'), what).toHaveText(shown);
      await expect(box, what).toHaveValue(text);
    }
    await expect(parserText(page)).toHaveCount(0);
    expect(posted).toBe(2);
  });

  test('an edit answered by a challenge says to copy the text first, and keeps it', async ({ page }) => {
    const { parentId } = await createCommentThread(fx, user.username);
    await page.goto(`/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`);
    // The comment's own block is its first child; its reply comes after.
    const own = page.locator(`#comment-${parentId}`).locator(':scope > div').first();
    // Answered here, so nothing is saved or sent to moderation.
    let saved = 0;
    await page.route(`**/api/comments/${parentId}`, route => {
      if (route.request().method() !== 'PATCH') return route.fallback();
      saved += 1;
      return route.fulfill(EDGE.challenge403());
    });
    await own.getByRole('button', { name: 'Edit', exact: true }).click();
    const text = `E2E ${fx.token} edge edit`;
    await own.getByRole('textbox').fill(text);
    await own.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(own.getByRole('alert')).toHaveText(COMMENT_CHALLENGE_MESSAGE);
    await expect(own.getByRole('textbox')).toHaveValue(text);
    expect(saved).toBe(1);
  });

  test("a progress load answered by Cloudflare's block says so in its toast's words", async ({ page }) => {
    await page.route('**/api/progress', route => route.fulfill(EDGE.block403()), { times: 1 });
    await page.goto(LEVEL);
    await expect(toast(page, "Couldn't load your saved progress.")).toBeVisible();
  });
});
