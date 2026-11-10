import { test, expect } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// The Google and Discord buttons light up under the mouse. Their resting fill, bg-primary,
// was a hand-written unlayered rule until it became a theme colour, and an unlayered rule
// beats every utility beside it, so their hover:bg-gray-800/60 never showed.
const REST = 'rgb(13, 17, 23)';

test.describe('the provider buttons', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  for (const path of ['/login', '/register']) {
    test(`light up under the mouse on ${path}`, async ({ page }) => {
      await page.goto(path);
      for (const name of ['Continue with Google', 'Continue with Discord']) {
        const button = page.getByRole('button', { name });
        const fill = () => button.evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(await fill(), `${name} at rest`).toBe(REST);
        await button.hover();
        await expect.poll(fill, { message: `${name} under the mouse` }).not.toBe(REST);
        await page.mouse.move(0, 0);
        await expect.poll(fill, { message: `${name} after the mouse leaves` }).toBe(REST);
      }
    });
  }
});
