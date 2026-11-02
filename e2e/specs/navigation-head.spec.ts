import { test, expect } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// A page's head names that page for as long as it is on screen. A link moves the address
// bar at once, but React renders the next page later, as a transition, and a press
// meanwhile still re-renders the page on screen. Read from window.location, the
// canonical link (SEO.tsx, for a page that passes none) and the JSON-LD page URL
// (StructuredData.tsx) named the next page in that window; they take the router's
// location instead. Outside the router, the root error page still names its address.

const SITE = 'https://stellarbladeguide.com';

// The URL of the page's own schema, the one StructuredData builds.
function schemaUrl(): string | undefined {
  for (const s of document.querySelectorAll('head script[type="application/ld+json"]')) {
    const schema = JSON.parse(s.textContent ?? '{}') as { '@type'?: string; url?: string };
    if (schema['@type'] === 'CollectionPage') return schema.url;
  }
  return undefined;
}

test.describe('the head during a navigation', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test("a page's canonical link keeps naming it until the next page renders", async ({ page }) => {
    await page.goto('/login');
    const canonical = page.locator('head link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', `${SITE}/login`);

    const seen = await page.evaluate(async () => {
      document.querySelector<HTMLElement>('main a[href="/forgot-password"]')!.click();
      await Promise.resolve();
      // Typing re-renders the sign-in page at once. React takes a field's new value
      // from the native setter plus an input event.
      const email = document.querySelector<HTMLInputElement>('#email')!;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(email, 'e');
      email.dispatchEvent(new Event('input', { bubbles: true }));
      for (let i = 0; i < 5; i++) await Promise.resolve();
      return {
        path: location.pathname,
        heading: document.querySelector('h1')?.textContent,
        canonical: document.querySelector('head link[rel="canonical"]')?.getAttribute('href'),
      };
    });
    expect(seen.path, 'the address bar has moved').toBe('/forgot-password');
    expect(seen.heading, 'the sign-in page is still on screen').toBe('Welcome back');
    expect(seen.canonical).toBe(`${SITE}/login`);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Forgot password?');
    await expect(canonical).toHaveAttribute('href', `${SITE}/forgot-password`);
  });

  test("a page's JSON-LD keeps its URL until the next page renders", async ({ page }) => {
    await page.goto('/levels/eidos-7');
    await expect.poll(() => page.evaluate(schemaUrl)).toBe(`${SITE}/levels/eidos-7`);

    // All in one task, so the next page can't render before the read.
    const seen = await page.evaluate(async () => {
      document.querySelector<HTMLElement>('main a[href="/levels/xion"]')!.click();
      await Promise.resolve();
      // A cycle pill re-renders Eidos 7 at once.
      const pill = document.querySelector<HTMLElement>('main button[title="Show NG+ collectibles"]')!;
      pill.click();
      for (let i = 0; i < 5; i++) await Promise.resolve();
      const schemas = Array.from(document.querySelectorAll('head script[type="application/ld+json"]'),
        s => JSON.parse(s.textContent ?? '{}') as { '@type'?: string; url?: string });
      return {
        path: location.pathname,
        heading: document.querySelector('h1')?.textContent,
        pressed: pill.getAttribute('aria-pressed'),
        url: schemas.find(schema => schema['@type'] === 'CollectionPage')?.url,
      };
    });
    expect(seen.path, 'the address bar has moved').toBe('/levels/xion');
    expect(seen.heading, 'Eidos 7 is still on screen').toBe('Eidos 7');
    expect(seen.pressed, 'and has re-rendered').toBe('true');
    expect(seen.url).toBe(`${SITE}/levels/eidos-7`);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Xion');
    await expect.poll(() => page.evaluate(schemaUrl)).toBe(`${SITE}/levels/xion`);
  });

  test('the root error page, outside the router, names its own address', async ({ page }) => {
    // Locations with no collectibles list make the level page throw while it renders,
    // which only the root error boundary, above the router, catches.
    await page.route('**/api/levels/eidos-7', route =>
      route.fulfill({ json: [{ location_name: 'Broken', collectibles: null }] }));
    await page.goto('/levels/eidos-7');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Something went wrong');
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/levels/eidos-7`);
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });
});
