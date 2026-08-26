import { test, expect } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp } from '../helpers/auth';

let fx: Fixtures;

test.describe('structured data', () => {
  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ 'x-real-ip': nextTestIp() });
  });

  test('walkthrough page carries BreadcrumbList + WebPage + Article ld+json', async ({ page }) => {
    await page.goto(`/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`);
    // Scripts are only injected after the walkthrough query resolves.
    await expect(page.getByText(fx.walkthroughTitle).first()).toBeVisible();

    const scripts = page.locator('head script[type="application/ld+json"]');
    await expect(scripts).toHaveCount(3);

    // The page re-appends all scripts on re-render (inline extraSchemas identity),
    // so parse inside a polling assertion rather than once.
    await expect
      .poll(async () => {
        const texts = await scripts.allTextContents();
        return texts
          .map((t) => {
            try {
              return (JSON.parse(t) as { '@type': string })['@type'];
            } catch {
              return 'unparseable';
            }
          })
          .sort();
      })
      .toEqual(['Article', 'BreadcrumbList', 'WebPage']);
  });
});
