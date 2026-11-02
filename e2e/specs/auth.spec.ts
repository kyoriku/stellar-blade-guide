import { test, expect, type Locator, type Page } from '@playwright/test';
import { readFixtures, pgPool, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { holdRoute } from '../helpers/route';

let fx: Fixtures;

const accountMenu = (page: Page) => page.getByRole('button', { name: 'Account menu' });
const navSignIn = (page: Page) =>
  page.locator('nav').getByRole('link', { name: 'Sign in' }).filter({ visible: true });

// A show-password toggle: named for screen readers (the eye has no text), pressed while
// its field shows the password, and showing the pointer.
async function expectShowPassword(page: Page, name: string, field: Locator, where: string): Promise<void> {
  const toggle = page.getByRole('button', { name, exact: true });
  await expect(toggle, where).toHaveCSS('cursor', 'pointer');
  // A target of at least 24 by 24 px (WCAG 2.2), with the eye where it always was: 12px
  // inside the field's right edge, and centred on the field.
  const target = (await toggle.boundingBox())!;
  expect(target.width, `${where}: target width`).toBeGreaterThanOrEqual(24);
  expect(target.height, `${where}: target height`).toBeGreaterThanOrEqual(24);
  const eye = (await toggle.locator('svg').boundingBox())!;
  const box = (await field.boundingBox())!;
  expect(Math.abs(box.x + box.width - (eye.x + eye.width) - 12), `${where}: eye 12px inside the field`).toBeLessThanOrEqual(1);
  expect(Math.abs(box.y + box.height / 2 - (eye.y + eye.height / 2)), `${where}: eye centred on the field`).toBeLessThanOrEqual(1);
  await expect(toggle, where).toHaveAttribute('aria-pressed', 'false');
  await expect(field, where).toHaveAttribute('type', 'password');
  await toggle.click();
  await expect(toggle, where).toHaveAttribute('aria-pressed', 'true');
  await expect(field, where).toHaveAttribute('type', 'text');
  await toggle.click();
  await expect(toggle, where).toHaveAttribute('aria-pressed', 'false');
  await expect(field, where).toHaveAttribute('type', 'password');
}

// A show-password toggle sits in the Tab order right after its field, Space and Enter work
// it (Enter on a plain button sends no form), and the next Tab moves on.
async function expectToggleByKeyboard(page: Page, field: Locator, name: string, next: Locator, where: string): Promise<void> {
  const toggle = page.getByRole('button', { name, exact: true });
  await field.focus();
  await page.keyboard.press('Tab');
  await expect(toggle, where).toBeFocused();
  await page.keyboard.press('Space');
  await expect(toggle, where).toHaveAttribute('aria-pressed', 'true');
  await expect(field, where).toHaveAttribute('type', 'text');
  await page.keyboard.press('Enter');
  await expect(toggle, where).toHaveAttribute('aria-pressed', 'false');
  await expect(field, where).toHaveAttribute('type', 'password');
  await page.keyboard.press('Tab');
  await expect(next, where).toBeFocused();
}

async function uiLogin(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

test.describe('auth', () => {
  let ip: string;
  let user: TestUser | null = null;
  let seq = 0;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, `a${++seq}`);
    await apiRegister(page, user, ip);
    // Registration set a refresh cookie; clear it so each test starts signed out.
    await context.clearCookies();
  });

  test.afterEach(async ({ page }) => {
    if (user) {
      await apiDeleteUser(page, user, ip);
      user = null;
    }
  });

  test('login with valid credentials shows authenticated state', async ({ page }) => {
    await uiLogin(page, user!);
    await expect(accountMenu(page)).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
    expect(await page.evaluate(() => localStorage.getItem('sb_has_session'))).toBe('1');
  });

  test('login with invalid credentials surfaces an error and no auth state', async ({ page }) => {
    await uiLogin(page, { ...user!, password: 'definitely-wrong-password' });
    // No role=alert exists in the app; the error renders as a red message div in the form.
    const error = page.locator('form div.text-red-400');
    await expect(error).toBeVisible();
    await expect(error).not.toBeEmpty();
    await expect(page).toHaveURL(/\/login/);
    await expect(accountMenu(page)).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('sb_has_session'))).toBeNull();
  });

  test('logout clears auth state', async ({ page }) => {
    await uiLogin(page, user!);
    await expect(accountMenu(page)).toBeVisible();

    await accountMenu(page).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();

    await expect(navSignIn(page)).toBeVisible();
    await expect(accountMenu(page)).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('sb_has_session'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('sb_user'))).toBeNull();
  });

  test('reload restores the session via the refresh cookie', async ({ page }) => {
    await uiLogin(page, user!);
    await expect(accountMenu(page)).toBeVisible();

    // Reload on a page that mounts useProgress — the homepage doesn't, so the
    // token-gated progress query would never fire there.
    await page.goto('/levels/eidos-7');

    // The strong restored signal: the mount effect's POST /auth/refresh succeeds
    // and the token-gated GET /api/progress fires afterwards.
    const refreshed = page.waitForResponse(
      (r) => r.url().includes('/api/auth/refresh') && r.status() === 200
    );
    const progressLoaded = page.waitForResponse(
      (r) => r.url().endsWith('/api/progress') && r.request().method() === 'GET' && r.status() === 200
    );
    await page.reload();
    await refreshed;
    await progressLoaded;
    await expect(accountMenu(page)).toBeVisible();
  });

  // ── OAuth refusals land on /login with a code ────────────────────────────────
  // The API redirects a refused provider callback to /login?oauth_error=<code>
  // &provider=<name> instead of rendering JSON. The redirect itself needs a real
  // provider, so it is pinned by the API's own tests; these pin what the page does
  // with the parameters. Both are attacker-writable, so the page only ever looks
  // them up: the sentences are pinned in client/src/utils/oauthError.test.ts.

  const HAS_PASSWORD =
    "This email is registered with a password. Sign in with your password, or use Forgot password if you don't know it.";

  test('an OAuth refusal shows its sentence in the form error slot and cleans the URL', async ({ page }) => {
    await page.goto('/login?oauth_error=has-password&provider=google');
    await expect(page.locator('form div.text-red-400')).toHaveText(HAS_PASSWORD);
    // Stripped, so a refresh or a bookmark does not show it again.
    await expect(page).toHaveURL(/\/login$/);
    await page.reload();
    await expect(page.locator('form div.text-red-400')).toHaveCount(0);
  });

  test('a failed password attempt replaces the OAuth notice, never a second box', async ({ page }) => {
    await page.goto('/login?oauth_error=has-password&provider=google');
    await expect(page.locator('form div.text-red-400')).toHaveText(HAS_PASSWORD);
    await page.getByLabel('Email').fill(user!.email);
    await page.getByLabel('Password', { exact: true }).fill('definitely-wrong-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    const boxes = page.locator('form div.text-red-400');
    await expect(boxes).toHaveCount(1);
    await expect(boxes).not.toHaveText(HAS_PASSWORD);
  });

  test('a cancel is not red, and an unknown code still says something', async ({ page }) => {
    await page.goto('/login?oauth_error=cancelled&provider=discord');
    await expect(page.locator('form div.text-gray-300')).toHaveText('Discord sign-in was cancelled.');
    await expect(page.locator('form div.text-red-400')).toHaveCount(0);

    await page.goto('/login?oauth_error=%3Cb%3Enonsense&provider=%3Cb%3Enobody');
    await expect(page.locator('form div.text-red-400')).toHaveText(
      "We couldn't complete sign-in. Please try again."
    );
  });

  test('a password sign-in after a refusal returns to where the provider button was pressed', async ({ page }) => {
    // The provider button stores the return path and only a successful provider
    // login consumes it. A refusal reloads the page, so without the fallback the
    // password sign-in would land on the home page.
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('oauth_redirect', '/levels/eidos-7'));
    await page.goto('/login?oauth_error=has-password&provider=google');
    await page.getByLabel('Email').fill(user!.email);
    await page.getByLabel('Password', { exact: true }).fill(user!.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/levels\/eidos-7$/);
    await expect(accountMenu(page)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('oauth_redirect'))).toBeNull();
  });

  // ── The callback page after provider consent ─────────────────────────────────
  // A provider cannot be driven here, but the callback page can: the API's
  // success redirect is /oauth/callback?token=<presence gate> with the refresh
  // cookie set on that same response, so a cookie planted through the API plus
  // the URL reproduces the landing exactly.

  /** Sign in through the API so the context holds a live refresh cookie. */
  async function apiLoginCookie(page: Page, u: TestUser, testIp: string): Promise<void> {
    const res = await page.request.post('/api/auth/login', {
      data: { email: u.email, password: u.password },
      headers: { [TEST_IP_HEADER]: testIp },
    });
    if (res.status() !== 200) throw new Error(`login failed: ${res.status()} ${await res.text()}`);
  }

  test('a provider callback returns to the stored page', async ({ page }) => {
    // Also pins StrictMode idempotency: the Vite dev server runs StrictMode, and
    // a second effect run that read oauth_redirect after the first removed it
    // used to send every dev sign-in home.
    await apiLoginCookie(page, user!, ip);
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('oauth_redirect', '/levels/eidos-7'));
    await page.goto('/oauth/callback?token=x');
    await expect(page).toHaveURL(/\/levels\/eidos-7$/);
    await expect(accountMenu(page)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('oauth_redirect'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('sb_has_session'))).toBe('1');
  });

  test('a transient refresh failure after provider consent says so and keeps the cookie retryable', async ({ page }) => {
    await apiLoginCookie(page, user!, ip);
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('oauth_redirect', '/levels/eidos-7'));
    // Only the callback's own refresh fails; the retry below must reach the server.
    await page.route(
      '**/api/auth/refresh',
      (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Service temporarily unavailable"}' }),
      { times: 1 }
    );
    await page.goto('/oauth/callback?token=x');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('form div.text-red-400')).toHaveText("We couldn't complete sign-in. Please try again.");
    expect(await page.evaluate(() => localStorage.getItem('sb_has_session'))).toBe('1');
    expect(await page.evaluate(() => localStorage.getItem('oauth_redirect'))).toBe('/levels/eidos-7');

    // The cookie the provider flow set was never used, and the hint left set
    // lets the next load finish the sign-in with it.
    const refreshed = page.waitForResponse(
      (r) => r.url().includes('/api/auth/refresh') && r.status() === 200
    );
    await page.reload();
    await refreshed;
    await expect(accountMenu(page)).toBeVisible();
  });

  test('the provider callback says it is signing you in, with the ellipsis character', async ({ page }) => {
    const refresh = await holdRoute(page, '**/api/auth/refresh');
    await page.goto('/oauth/callback?token=x');
    await refresh.seen;
    await expect(page.getByText(/^Signing you in/)).toHaveText('Signing you in…');
    // No cookie (beforeEach cleared it), so the refresh ends at the sign-in page.
    refresh.release();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('a refresh the server refuses after provider consent gets the toast only', async ({ page }) => {
    // No cookie (beforeEach cleared it), so the refresh is a definitive 401.
    await page.goto('/oauth/callback?token=x');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Your session expired. Please log in again.')).toBeVisible();
    await expect(page.locator('form div.text-red-400')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('sb_has_session'))).toBeNull();
  });

  test('the account menu appears closed after provider sign-in', async ({ page }) => {
    // The restoring placeholder and the menu are both divs in the same navbar
    // slot. Unkeyed, React reused the placeholder's chevron slot as the dropdown
    // panel, whose transition-all then animated it from opaque and 14px wide to
    // closed, in plain view, for 200ms. The first read is synchronous at the
    // moment the button appears, so it is deterministic either way: a panel
    // mounted closed reads 0/hidden, a reused node reads the transition's start
    // value, 1/visible.
    await page.addInitScript(() => {
      const w = window as unknown as { __panel: { opacity: string; visibility: string }[] };
      w.__panel = [];
      const mo = new MutationObserver(() => {
        const btn = document.querySelector('button[aria-label="Account menu"]');
        const panel = btn?.nextElementSibling;
        if (!btn || !panel || w.__panel.length) return;
        const read = () => {
          const cs = getComputedStyle(panel);
          w.__panel.push({ opacity: cs.opacity, visibility: cs.visibility });
        };
        read();
        let n = 0;
        const tick = () => { read(); if (++n < 20) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
        mo.disconnect();
      });
      mo.observe(document, { childList: true, subtree: true });
    });
    await apiLoginCookie(page, user!, ip);
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('oauth_redirect', '/levels/eidos-7'));
    await page.goto('/oauth/callback?token=x');
    await expect(accountMenu(page)).toBeVisible();
    await page.waitForFunction(() => (window as unknown as { __panel: unknown[] }).__panel.length >= 21);
    const samples = await page.evaluate(
      () => (window as unknown as { __panel: { opacity: string; visibility: string }[] }).__panel
    );
    for (const s of samples) {
      expect(s.opacity).toBe('0');
      expect(s.visibility).toBe('hidden');
    }
  });

  // ── One account, one way in: a provider-only account has no password ─────────
  // A provider login cannot be driven from here, so the suite's password user is
  // turned into a provider-only one by blanking its hash, which is exactly what the
  // API reports as has_password: false. The hash is restored in a finally, because
  // the suite deletes its users by logging in with the password.

  const NO_PASSWORD_SETTINGS = 'This account signs in with Google or Discord and has no password.';
  const NO_PASSWORD_FORGOT = 'This email signs in with Google or Discord and has no password.';

  async function asProviderOnly(email: string, run: () => Promise<void>): Promise<void> {
    const pool = pgPool();
    try {
      const { rows } = await pool.query<{ password_hash: string }>(
        'SELECT password_hash FROM users WHERE email = $1', [email]
      );
      const hash = rows[0].password_hash;
      await pool.query('UPDATE users SET password_hash = NULL WHERE email = $1', [email]);
      try {
        await run();
      } finally {
        await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);
      }
    } finally {
      await pool.end();
    }
  }

  test('Settings shows a provider-only account a sentence, not a change-password form', async ({ page }) => {
    await uiLogin(page, user!);
    await expect(accountMenu(page)).toBeVisible();
    await page.goto('/settings');
    await expect(page.getByText('Current password')).toBeVisible();

    await asProviderOnly(user!.email, async () => {
      await page.reload();
      await expect(page.getByText(NO_PASSWORD_SETTINGS)).toBeVisible();
      await expect(page.getByText('Current password')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Update password' })).toHaveCount(0);
    });
  });

  test("Settings' delete-account box is labelled, and a phone leaves the typed username alone", async ({ page }) => {
    await uiLogin(page, user!);
    await expect(accountMenu(page)).toBeVisible();
    await page.goto('/settings');
    // The match is exact, so no capitalising, correcting or filling.
    const box = page.getByLabel(`Type ${user!.username} to confirm`, { exact: true });
    await expect(box).toBeVisible();
    await expect(box).toHaveAttribute('autocapitalize', 'none');
    await expect(box).toHaveAttribute('autocorrect', 'off');
    await expect(box).toHaveAttribute('spellcheck', 'false');
    await expect(box).toHaveAttribute('autocomplete', 'off');
  });

  test("Settings' Username and Avatar URL fields are labelled", async ({ page }) => {
    await uiLogin(page, user!);
    await expect(accountMenu(page)).toBeVisible();
    await page.goto('/settings');
    await expect(page.getByLabel('Username', { exact: true })).toHaveValue(user!.username);
    const avatar = page.getByLabel('Avatar URL', { exact: true });
    await expect(avatar).toHaveAttribute('type', 'url');
    await expect(avatar).toHaveValue('');
  });

  test('Forgot password tells a provider-only address the truth, and nobody else anything', async ({ page }) => {
    // An unknown address: the generic answer, as for a password or deactivated account.
    // (A real password account is not submitted here: in dev that would call Resend.)
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill(`nobody-${fx.token}@example.com`);
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByText('Check your email')).toBeVisible();
    await expect(page.getByText(NO_PASSWORD_FORGOT)).toHaveCount(0);
    // Each answer's heading takes focus in place of the form, and reads on.
    const sent = page.getByRole('heading', { name: 'Check your email' });
    await expect(sent).toBeFocused();
    await expect(sent).toHaveAccessibleDescription(
      `If an account exists for nobody-${fx.token}@example.com, you'll receive a reset link within a few minutes. The link expires in 1 hour.`);

    await asProviderOnly(user!.email, async () => {
      await page.goto('/forgot-password');
      await page.getByLabel('Email').fill(user!.email);
      await page.getByRole('button', { name: /send/i }).click();
      await expect(page.getByText(NO_PASSWORD_FORGOT)).toBeVisible();
      await expect(page.getByText('Check your email')).toHaveCount(0);
      const none = page.getByRole('heading', { name: 'No password to reset' });
      await expect(none).toBeFocused();
      await expect(none).toHaveAccessibleDescription(NO_PASSWORD_FORGOT);
    });
  });

  test('a reset-link answer leaves focus alone when it moved on while the request was out', async ({ page }) => {
    const hold = await holdRoute(page, '**/api/auth/forgot-password');
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill(`nobody-${fx.token}@example.com`);
    await page.getByRole('button', { name: 'Send reset link', exact: true }).click();
    await hold.seen;
    const back = page.getByRole('link', { name: 'Back to login' });
    await back.focus();
    hold.release();
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
    await expect(back).toBeFocused();
  });

  test('Forgot password says it was refused, not "Check your email", when rate limited', async ({ page }) => {
    // A refused request sent no email, so the page must not promise one. The 429 is
    // served here rather than earned, so the test doesn't depend on the limit's numbers.
    await page.route('**/api/auth/forgot-password', (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Rate limit exceeded: 3 per 1 minute' }),
      }),
    );
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill(`nobody-${fx.token}@example.com`);
    await page.getByRole('button', { name: /send/i }).click();
    await expect(page.getByText("You're doing that too fast. Please wait a moment and try again.")).toBeVisible();
    await expect(page.getByText('Check your email')).toHaveCount(0);
  });

  test('a reset that lands says so, and that sign-in is next, with focus on the news', async ({ page }) => {
    // Answered here, so no reset token is needed.
    await page.route('**/api/auth/reset-password', route => route.fulfill({ status: 204 }));
    await page.goto('/reset-password?token=e2e');
    await page.getByLabel('New password', { exact: true }).fill('e2e-Password-456');
    await page.getByRole('button', { name: 'Update password', exact: true }).click();
    const heading = page.getByRole('heading', { name: 'Password updated' });
    await expect(heading).toBeVisible();
    await expect(page.getByText('Redirecting you to login…', { exact: true })).toBeVisible();
    // The form left with focus on its button, so the heading takes focus and reads on.
    await expect(heading).toBeFocused();
    await expect(heading).toHaveAccessibleDescription('Redirecting you to login…');
  });

  test('every show-password toggle is named, says when it shows the password, and shows the pointer', async ({ page }) => {
    for (const path of ['/login', '/register', '/reset-password?token=e2e']) {
      await page.goto(path);
      await expectShowPassword(page, 'Show password', page.locator('#password'), path);
    }
  });

  test('every show-password toggle is in the Tab order, and works by keyboard without sending the form', async ({ page }) => {
    let sent = 0;
    await page.route(/\/api\/auth\/(login|register|reset-password)$/, route => { sent += 1; return route.abort(); });
    for (const [path, submit] of [['/login', 'Sign in'], ['/register', 'Create account'], ['/reset-password?token=e2e', 'Update password']] as const) {
      await page.goto(path);
      await expectToggleByKeyboard(page, page.locator('#password'), 'Show password', page.getByRole('button', { name: submit, exact: true }), path);
    }
    expect(sent, 'the toggles sent no form').toBe(0);
  });

  test("Settings' show-password toggles are in the Tab order, each after its field", async ({ page }) => {
    await uiLogin(page, user!);
    await expect(accountMenu(page)).toBeVisible();
    await page.goto('/settings');
    const current = page.getByLabel('Current password', { exact: true });
    const next = page.getByLabel('New password', { exact: true });
    await expectToggleByKeyboard(page, current, 'Show current password', next, 'current');
    await expectToggleByKeyboard(page, next, 'Show new password',
      page.getByRole('button', { name: 'Update password', exact: true }), 'new');
  });

  test("Settings' show-password toggles are named for their fields", async ({ page }) => {
    await uiLogin(page, user!);
    await expect(accountMenu(page)).toBeVisible();
    await page.goto('/settings');
    await expectShowPassword(page, 'Show current password', page.getByLabel('Current password', { exact: true }), 'current');
    await expectShowPassword(page, 'Show new password', page.getByLabel('New password', { exact: true }), 'new');
  });
});

// ── Return paths ─────────────────────────────────────────────────────────────
// Every Sign in and Create account link stores where the visitor was, and the
// login page's single read site decides where a sign-in lands. The register
// page used to ignore it and always land on the home page, its provider
// buttons never stored anything, and the navbar's links record the auth pages
// themselves when pressed there.
test.describe('return paths', () => {
  let ip: string;
  let user: TestUser;
  let created: TestUser | null = null;
  let seq = 0;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, `r${++seq}`);
    await apiRegister(page, user, ip);
    await context.clearCookies();
  });

  test.afterEach(async ({ page }) => {
    await apiDeleteUser(page, user, ip);
    if (created) {
      await apiDeleteUser(page, created, ip);
      created = null;
    }
  });

  // A second account per test, registered through the form; afterEach deletes it.
  async function registerViaForm(page: Page): Promise<void> {
    created = makeUser(fx.token, `r${seq}c`);
    // The URL changes before the router's transition swaps the page, and the
    // login page has an Email field too: wait for the register form itself.
    await expect(page.getByRole('heading', { name: 'Create account', level: 1 })).toBeVisible();
    await page.getByLabel('Email').fill(created.email);
    await page.getByLabel('Username').fill(created.username);
    await page.getByLabel('Password', { exact: true }).fill(created.password);
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
  }

  test('an account created from the comment prompt returns to the thread', async ({ page }) => {
    await page.goto('/levels/eidos-7');
    await page.getByRole('link', { name: 'create an account' }).click();
    await expect(page).toHaveURL(/\/register$/);
    await registerViaForm(page);
    await expect(page).toHaveURL(/\/levels\/eidos-7$/);
    await expect(accountMenu(page)).toBeVisible();
  });

  test('switching from Sign in to Create one keeps the return path', async ({ page }) => {
    await page.goto('/levels/eidos-7');
    await navSignIn(page).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByRole('link', { name: 'Create one' }).click();
    await expect(page).toHaveURL(/\/register$/);
    await registerViaForm(page);
    await expect(page).toHaveURL(/\/levels\/eidos-7$/);
  });

  test('a provider press on the register page stores where the visitor came from and retires a stale value', async ({ page }) => {
    // No provider can be driven here. A blank 200 lets the top-level navigation
    // complete, so the page never reaches the callback and the key is left as written.
    await page.route('**/api/auth/google', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '' })
    );
    await page.goto('/levels/eidos-7');
    await page.evaluate(() => localStorage.setItem('oauth_redirect', '/collectibles'));
    await page.getByRole('link', { name: 'create an account' }).click();
    // By text, not role: the control used to be a plain anchor, and the pin is
    // the stored value, so the negative run must reach that assertion.
    await page.getByText('Continue with Google', { exact: true }).click();
    await page.waitForURL(/\/api\/auth\/google$/);
    expect(await page.evaluate(() => localStorage.getItem('oauth_redirect'))).toBe('/levels/eidos-7');
  });

  test('the navbar Sign in on an auth page does not bring the user back to it', async ({ page }) => {
    await page.goto('/register');
    await navSignIn(page).click();
    await expect(page).toHaveURL(/\/login$/);
    // Same transition race in the other direction: the register form has an Email field too.
    await expect(page.getByRole('heading', { name: 'Welcome back', level: 1 })).toBeVisible();
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(accountMenu(page)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });
});
