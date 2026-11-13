import { test, expect } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// In production the bot filter answers a page address it refuses (an underscore, a letter outside
// ASCII, punctuation, an empty segment, a file name, a word starting with a bot signature) with
// the client's 404 page, so the client renders each of these there. Dev runs no bot filter and
// Vite serves the same shell, so this pins the client's half; test_bot_filter.py pins the server's.
const REFUSED = [
  '/levels/eidos_7', '/levels/eidos-7:', '/levels/eidos-7.', '/privacy.', '/levels/%C3%A9idos-7',
  '/collectibles/memory_sticks', '/walkthroughs/main_story', '/walkthroughs/main-story/no-such-mission;',
  '/index.html', '/docs', '/content-creators', '/levels//eidos-7',
];

test.describe('addresses the bot filter refuses', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('each gets the 404 page in the layout, never a crash or an empty page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    for (const address of REFUSED) {
      await page.goto(address);
      await expect(page.getByRole('heading', { level: 1 }), address).toHaveText('Page Not Found');
      await expect(page.getByRole('navigation', { name: 'Footer' }), address).toBeVisible();
      await expect(page.locator('head meta[name="robots"]'), address).toHaveAttribute('content', 'noindex, nofollow');
    }
    expect(errors).toEqual([]);
  });
});
