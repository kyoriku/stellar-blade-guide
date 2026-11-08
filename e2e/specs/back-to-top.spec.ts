import { test, expect } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// The desktop Back to top (BackToTop) only fades out near the top of the page. Inert keeps
// it out of the tab order while it's hidden; it takes focus once it shows.

const LEVEL = '/levels/eidos-7';

test.describe('the desktop Back to top', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('takes focus only while it shows', async ({ page }) => {
    await page.goto(LEVEL);
    await expect(page.locator('section[id] article[id]').first()).toBeVisible();
    const backToTop = page.locator('aside button[aria-label="Back to top"]');

    await backToTop.focus();
    await expect(backToTop).not.toBeFocused();

    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect(backToTop).toHaveCSS('opacity', '1');
    await backToTop.focus();
    await expect(backToTop).toBeFocused();

    // Pressed, it hides again and lets go of focus; Tab carries on into the page.
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(backToTop).not.toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'All', exact: true })).toBeFocused();
  });
});
