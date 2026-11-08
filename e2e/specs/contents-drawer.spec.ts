import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// The phone Contents drawer (FloatingTOC) slides out of view when it closes. Inert keeps
// its links out of the tab order then, its close button has a name, and closing it from
// the keyboard gives focus back to the Contents button instead of dropping it.

const LEVEL = '/levels/eidos-7';
const SECTION = 'parking-tower';

const contents = (page: Page) => page.getByRole('button', { name: 'Open table of contents' });
const closeButton = (page: Page) => page.getByRole('button', { name: 'Close table of contents' });
// The drawer's copy of an entry: the sidebar's copy is display:none below lg.
const drawerEntry = (page: Page) => page.locator(`a[href="#${SECTION}"]:not(aside a)`);

// Where the focused element sits, against the viewport: the closed drawer is below it.
const focusedBox = (page: Page) => page.evaluate(() => {
  const r = document.activeElement!.getBoundingClientRect();
  return { top: Math.round(r.top), viewport: window.innerHeight };
});

const openByKeyboard = async (page: Page) => {
  await contents(page).focus();
  await page.keyboard.press('Enter');
  await expect(closeButton(page)).toBeVisible();
};

test.describe('the phone Contents drawer', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ context, page }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
    await page.goto(LEVEL);
    await expect(page.locator('section[id] article[id]').first()).toBeVisible();
  });

  test('keeps its links out of the tab order while closed', async ({ page }) => {
    await drawerEntry(page).focus();
    await expect(drawerEntry(page)).not.toBeFocused();

    // The drawer follows the Contents button in the page, so Tab would enter it.
    await contents(page).focus();
    await page.keyboard.press('Tab');
    const { top, viewport } = await focusedBox(page);
    expect(top, 'the next stop is on screen, not in the hidden drawer').toBeLessThan(viewport);
  });

  test('names its close button and hands focus back on each way out', async ({ page }) => {
    await openByKeyboard(page);
    await page.keyboard.press('Tab');
    await expect(closeButton(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(contents(page)).toBeFocused();

    await openByKeyboard(page);
    await drawerEntry(page).focus();
    await page.keyboard.press('Escape');
    await expect(contents(page)).toBeFocused();

    // Choosing an entry jumps to it, and focus still comes back to the button.
    await openByKeyboard(page);
    await drawerEntry(page).focus();
    await page.keyboard.press('Enter');
    await expect(contents(page)).toBeFocused();
    await expect.poll(() => page.evaluate((id) =>
      Math.round(document.getElementById(id)!.getBoundingClientRect().top), SECTION)).toBe(81);
  });
});
