import { test, expect, type Locator, type Page } from '@playwright/test';
import { readFixtures, setUserAvatar, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { expectBusyPattern } from '../helpers/busy';

// The sign-in forms and Settings show the site's busy pattern (helpers/busy.ts) while
// their request is out, instead of going natively disabled: the pressed button keeps
// its focus, size and name, a spinner takes its label's place, and the busy text is
// read out. With native disabled gone, the handlers are what turn away a second press,
// and Enter in a field, while busy, so each test counts the requests. Every held request
// is then refused, so nothing changes, and the refusal is read out as an alert.

let fx: Fixtures;
const REFUSED = 'Refused for the test';
// A picture that needs no network, for an avatar Remove can take away.
const AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'/%3E";

// Holds every `method` request to `url` until release(), then refuses it.
async function holdThenRefuse(page: Page, url: string, method: string, status = 400) {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let arrived!: () => void;
  const seen = new Promise<void>(resolve => { arrived = resolve; });
  let count = 0;
  await page.route(url, async route => {
    if (route.request().method() !== method) return route.fallback();
    count += 1;
    arrived();
    await gate;
    await route.fulfill({ status, json: { detail: REFUSED } });
  });
  return { release: () => release(), seen, count: () => count };
}
type Hold = Awaited<ReturnType<typeof holdThenRefuse>>;

// React runs what a press set off, its effects included, within two message turns.
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise(resolve => {
    const ch = new MessageChannel();
    let turns = 0;
    ch.port1.onmessage = () => (++turns === 2 ? resolve(null) : ch.port2.postMessage(null));
    ch.port2.postMessage(null);
  }));
}

// Each button's live region comes right after it.
const liveAfter = (button: Locator) => button.locator('xpath=following-sibling::*[@aria-live="polite"][1]');

// Fields a request holds take no typing while it's out (a success clears or replaces
// them), and take it again once it has been refused.
async function expectHeld(page: Page, fields: Locator[]): Promise<void> {
  for (const field of fields) {
    await expect(field, 'held while the request is out').not.toBeEditable();
    const before = await field.inputValue();
    await field.focus();
    await page.keyboard.type('x');
    await expect(field).toHaveValue(before);
  }
}

// The busy pattern, a second press and Enter in a field, which must send nothing more,
// the fields it holds, and then the refusal, read out as an alert, with the button at
// rest and the fields taking typing again.
async function busyThenRefused(page: Page, button: Locator, opts: {
  name: string; busyText: string; hold: Hold; live?: Locator; field?: Locator; held?: Locator[];
}): Promise<void> {
  await expectBusyPattern(button, {
    name: opts.name, busyText: opts.busyText, live: opts.live ?? liveAfter(button),
    press: () => button.click(), seen: opts.hold.seen,
  });
  await expect(button, 'busy, not disabled, so it keeps focus').toBeFocused();
  await button.click();
  if (opts.field) await opts.field.press('Enter');
  await settle(page);
  expect(opts.hold.count(), 'one request, whatever was pressed meanwhile').toBe(1);
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expectHeld(page, opts.held ?? []);
  opts.hold.release();
  await expect(page.getByRole('alert')).toContainText(REFUSED);
  await expect(button).toHaveAttribute('aria-busy', 'false');
  for (const field of opts.held ?? []) await expect(field).toBeEditable();
}

test.describe('busy sign-in forms', () => {
  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('Sign in', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(`e2e-${fx.token}-nobody@sbg-e2e-suite.dev`);
    const password = page.getByLabel('Password', { exact: true });
    await password.fill('e2e-Password-123');
    const hold = await holdThenRefuse(page, '**/api/auth/login', 'POST');
    await busyThenRefused(page, page.getByRole('button', { name: 'Sign in', exact: true }), {
      name: 'Sign in', busyText: 'Signing in…', hold, field: password,
    });
  });

  test('Create account', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Email').fill(`e2e-${fx.token}-nobody@sbg-e2e-suite.dev`);
    const username = page.getByLabel('Username');
    await username.fill(`e2e_${fx.token}_nobody`);
    await page.getByLabel('Password', { exact: true }).fill('e2e-Password-123');
    const hold = await holdThenRefuse(page, '**/api/auth/register', 'POST');
    await busyThenRefused(page, page.getByRole('button', { name: 'Create account', exact: true }), {
      name: 'Create account', busyText: 'Creating account…', hold, field: username,
    });
  });

  test('Send reset link', async ({ page }) => {
    await page.goto('/forgot-password');
    const email = page.getByLabel('Email address');
    await email.fill(`e2e-${fx.token}-nobody@sbg-e2e-suite.dev`);
    const hold = await holdThenRefuse(page, '**/api/auth/forgot-password', 'POST');
    await busyThenRefused(page, page.getByRole('button', { name: 'Send reset link', exact: true }), {
      name: 'Send reset link', busyText: 'Sending…', hold, field: email,
    });
  });

  test('Update password, from a reset link', async ({ page }) => {
    await page.goto('/reset-password?token=e2e-not-a-token');
    const password = page.getByLabel('New password');
    await password.fill('e2e-Password-456');
    const hold = await holdThenRefuse(page, '**/api/auth/reset-password', 'POST');
    await busyThenRefused(page, page.getByRole('button', { name: 'Update password', exact: true }), {
      name: 'Update password', busyText: 'Updating…', hold, field: password,
    });
  });
});

test.describe('busy Settings', () => {
  let ip: string;
  let user: TestUser;
  let seq = 0;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, `busy${++seq}`);
    await apiRegister(page, user, ip);
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
  });

  test.afterEach(async ({ page }) => {
    await apiDeleteUser(page, user, ip);
  });

  const main = (page: Page) => page.locator('main');
  const saveChanges = (page: Page) => main(page).getByRole('button', { name: 'Save changes', exact: true });
  const avatarField = (page: Page) => main(page).getByPlaceholder('https://example.com/avatar.png');

  test('Save changes', async ({ page }) => {
    await page.goto('/settings');
    const username = main(page).getByPlaceholder('yourname');
    await username.fill(`${user.username}x`);
    const hold = await holdThenRefuse(page, '**/api/users/me', 'PATCH', 409);
    await busyThenRefused(page, saveChanges(page), {
      name: 'Save changes', busyText: 'Saving…', hold, field: username, held: [username, avatarField(page)],
    });
  });

  test('Remove, the avatar, which shows its own busy state and holds Save changes meanwhile', async ({ page }) => {
    expect(await setUserAvatar(user.username, AVATAR)).toBe(true);
    await page.goto('/settings');
    await main(page).getByPlaceholder('yourname').fill(`${user.username}x`);
    const remove = main(page).getByRole('button', { name: 'Remove', exact: true });
    const hold = await holdThenRefuse(page, '**/api/users/me', 'PATCH');
    await expectBusyPattern(remove, {
      name: 'Remove', busyText: 'Removing…', live: liveAfter(saveChanges(page)),
      press: () => remove.click(), seen: hold.seen,
    });
    // Save changes is refused meanwhile, and shows nothing of the Remove.
    await expect(saveChanges(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(saveChanges(page)).toHaveAttribute('aria-busy', 'false');
    await remove.click();
    await saveChanges(page).click({ force: true });
    await settle(page);
    expect(hold.count(), 'one request, whatever was pressed meanwhile').toBe(1);
    const fields = [main(page).getByPlaceholder('yourname'), avatarField(page)];
    await expectHeld(page, fields);
    hold.release();
    await expect(page.getByRole('alert')).toContainText(REFUSED);
    await expect(remove).toHaveAttribute('aria-busy', 'false');
    for (const field of fields) await expect(field).toBeEditable();
  });

  test('Update password', async ({ page }) => {
    await page.goto('/settings');
    const currentPassword = main(page).getByLabel('Current password');
    await currentPassword.fill('e2e-Password-123');
    const newPassword = main(page).getByLabel('New password');
    await newPassword.fill('e2e-Password-456');
    const hold = await holdThenRefuse(page, '**/api/auth/change-password', 'POST');
    await busyThenRefused(page, main(page).getByRole('button', { name: 'Update password', exact: true }), {
      name: 'Update password', busyText: 'Updating…', hold, field: newPassword, held: [currentPassword, newPassword],
    });
  });

  test('Sign out of all devices', async ({ page }) => {
    await page.goto('/settings');
    const hold = await holdThenRefuse(page, '**/api/auth/logout-all', 'POST');
    await busyThenRefused(page, main(page).getByRole('button', { name: 'Sign out', exact: true }), {
      name: 'Sign out', busyText: 'Signing out…', hold,
    });
  });

  test('Delete my account', async ({ page }) => {
    await page.goto('/settings');
    const confirm = main(page).getByLabel(`Type ${user.username} to confirm`);
    await confirm.fill(user.username);
    const hold = await holdThenRefuse(page, '**/api/users/me', 'DELETE');
    await busyThenRefused(page, main(page).getByRole('button', { name: 'Delete my account', exact: true }), {
      name: 'Delete my account', busyText: 'Deleting…', hold, field: confirm, held: [confirm],
    });
  });

  test('its refused buttons are grey in forced colours, as natively disabled ones were', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/settings');
    const grey = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'GrayText';
      document.body.append(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return colour;
    });
    // Nothing changed, both password fields empty, the username not typed.
    for (const name of ['Save changes', 'Update password', 'Delete my account']) {
      const button = main(page).getByRole('button', { name, exact: true });
      await expect(button, name).toHaveAttribute('aria-disabled', 'true');
      await expect.poll(() => button.evaluate(el => getComputedStyle(el).color), { message: name }).toBe(grey);
    }
  });

  test('a saved profile, and a changed password, are read out after their busy text', async ({ page }) => {
    await page.goto('/settings');
    // Answered as the server would, without renaming the account.
    await page.route('**/api/users/me', route => route.request().method() === 'PATCH' ? route.fulfill({ json: {} }) : route.fallback());
    await main(page).getByPlaceholder('yourname').fill(`${user.username}x`);
    await saveChanges(page).click();
    await expect(liveAfter(saveChanges(page))).toHaveText('Profile updated successfully.');

    await page.route('**/api/auth/change-password', route => route.fulfill({ json: {} }));
    // A changed password signs this browser out two seconds later; the page is
    // checked before then.
    await main(page).getByLabel('Current password').fill('e2e-Password-123');
    await main(page).getByLabel('New password').fill('e2e-Password-456');
    const update = main(page).getByRole('button', { name: 'Update password', exact: true });
    await update.click();
    await expect(liveAfter(update)).toHaveText('Password changed. Signing you out...');
  });
});
