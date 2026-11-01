import { test, expect, type Locator, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { holdRoute } from '../helpers/route';
import { BULK_COPY } from '../../client/src/constants/bulkProgressCopy';

// A refused (aria-disabled) control is grey in forced colours, as a natively disabled
// button is: GrayText for its text and border, hover included (index.css). Forced
// colours replace the tints and borders that mark these as refused in normal colours,
// and the browser greys only :disabled, so before that rule a refusal shown by a tint
// or the cursor alone looked enabled there. One control of each kind, on the progress
// card and its dialog, compared with the colour a GrayText probe gets in the same palette.
// The comment Save and post buttons have their own check in comment-focus.spec.ts.

let fx: Fixtures;

async function systemColour(page: Page, name: string): Promise<string> {
  return page.evaluate(colour => {
    const probe = document.createElement('span');
    probe.style.color = colour;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, name);
}

const colours = (l: Locator) => l.evaluate(el => {
  const style = getComputedStyle(el);
  return { text: style.color, border: style.borderTopColor };
});
// These buttons fade between colours (transition-colors, transition-all), so a check
// made as one turns refused waits for the fade to end.
const settled = (l: Locator) => expect.poll(() => colours(l));
const settledText = (l: Locator) => expect.poll(async () => (await colours(l)).text);

test.describe('refused controls in forced colours', () => {
  let ip: string;
  let user: TestUser;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
    user = makeUser(fx.token, 'forced');
    await apiRegister(page, user, ip);
    await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
    await page.emulateMedia({ forcedColors: 'active' });
    const stats = page.waitForResponse(r => r.url().endsWith('/api/users/me/stats') && r.status() === 200);
    await page.goto('/progress');
    await stats;
    await page.getByRole('button', { name: BULK_COPY.heading }).click();
    await expect(page.getByLabel(BULK_COPY.scopeLabel)).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    await apiDeleteUser(page, user, ip);
  });

  test('on the card, the button a count refuses is grey, border and hover included, and the busy one keeps its colour', async ({ page }) => {
    const grey = await systemColour(page, 'GrayText');
    const clear = page.getByRole('button', { name: BULK_COPY.clearButton, exact: true });
    const mark = page.getByRole('button', { name: BULK_COPY.markButton, exact: true });
    await page.getByLabel(BULK_COPY.scopeLabel).selectOption('level:Eidos 7');
    expect((await colours(clear)).text, 'available').not.toBe(grey);
    expect((await colours(mark)).text, 'available').not.toBe(grey);

    // Mark all found counts, so Clear progress is refused. In normal colours that is
    // its opacity and a red border; here it is GrayText, border included.
    const preview = await holdRoute(page, '**/api/progress/bulk/preview');
    await mark.click();
    await preview.seen;
    await expect(mark).toHaveAttribute('aria-busy', 'true');
    await expect(clear).toHaveAttribute('aria-disabled', 'true');
    await settled(clear).toEqual({ text: grey, border: grey });
    // The browser draws a hovered button's border in Highlight; a refused one stays grey.
    await clear.hover();
    await settled(clear).toEqual({ text: grey, border: grey });
    expect((await colours(mark)).text, 'busy keeps its colour').not.toBe(grey);
    preview.release();
    const dialog = page.getByRole('alertdialog');
    await dialog.getByRole('button', { name: BULK_COPY.cancel, exact: true }).click();
    await expect(dialog).toHaveCount(0);

    // Clear progress counts, so Mark all found is refused: a tint alone in normal colours.
    await page.unroute('**/api/progress/bulk/preview');
    const second = await holdRoute(page, '**/api/progress/bulk/preview');
    await clear.click();
    await second.seen;
    await expect(mark).toHaveAttribute('aria-disabled', 'true');
    await settledText(mark).toBe(grey);
    second.release();
  });

  test("in the dialog, Close and Cancel refused while the write is out, and a confirm the typed word hasn't unlocked, are grey", async ({ page }) => {
    const grey = await systemColour(page, 'GrayText');
    const dialog = page.getByRole('alertdialog');

    // Everything: Mark N found stays refused until the word is typed, a tint alone in
    // normal colours.
    await page.getByLabel(BULK_COPY.scopeLabel).selectOption('everything');
    await page.getByRole('button', { name: BULK_COPY.markButton, exact: true }).click();
    const everythingConfirm = dialog.getByRole('button', { name: /^Mark .* found$/ });
    await expect(everythingConfirm).toHaveAttribute('aria-disabled', 'true');
    await settledText(everythingConfirm).toBe(grey);
    await dialog.getByRole('button', { name: BULK_COPY.cancel, exact: true }).click();
    await expect(dialog).toHaveCount(0);

    // One level, with the write held: Close is refused by its cursor alone in normal
    // colours, and Cancel by its opacity.
    await page.getByLabel(BULK_COPY.scopeLabel).selectOption('level:Eidos 7');
    await page.getByRole('button', { name: BULK_COPY.markButton, exact: true }).click();
    const confirm = dialog.getByRole('button', { name: /^Mark .* found$/ });
    const write = await holdRoute(page, '**/api/progress/bulk');
    await confirm.click();
    await write.seen;
    const close = dialog.getByRole('button', { name: BULK_COPY.close, exact: true });
    const cancel = dialog.getByRole('button', { name: BULK_COPY.cancel, exact: true });
    await expect(close).toHaveAttribute('aria-disabled', 'true');
    await expect(cancel).toHaveAttribute('aria-disabled', 'true');
    await settledText(close).toBe(grey);
    await settled(cancel).toEqual({ text: grey, border: grey });
    expect((await colours(confirm)).text, 'busy keeps its colour').not.toBe(grey);
    write.release();
    await expect(dialog).toHaveCount(0);
  });
});
