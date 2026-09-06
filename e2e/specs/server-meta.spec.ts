import { test, expect } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp } from '../helpers/auth';

// Raw-HTML proofs for the server-injected head tags: these fetch :8000
// directly (uvicorn serving the built dist with heads spliced at the
// <!--seo--> marker) — never :3000, whose Vite dev shell has no injection.
// global-setup rebuilds the dist when the marker is missing, and the server
// re-reads the shell per request in DEBUG, so these never race a stale build.

let fx: Fixtures;

test.describe('server-injected head tags', () => {
  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ 'x-real-ip': nextTestIp() });
  });

  test('raw HTML carries the level head', async ({ request }) => {
    const res = await request.get('http://localhost:8000/levels/great-desert');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/<title data-seo="server">All \d+ Great Desert Collectibles \| Stellar Blade Guide<\/title>/);
    expect(body).toContain('href="https://stellarbladeguide.com/levels/great-desert"');
    expect(body).toMatch(/property="og:image" content="https:\/\/img\.stellarbladeguide\.com\/[^"]+-w1200\.webp"/);
  });

  test('raw HTML matches the hydrated DOM', async ({ page, request }) => {
    // Cross-language parity guard: the Python renderer and SEO.tsx must agree.
    const body = await (await request.get('http://localhost:8000/collectibles/passcodes')).text();
    const rawTitle = body.match(/<title data-seo="server">([^<]+)<\/title>/)?.[1];
    const rawDescription = body.match(/name="description" content="([^"]+)"/)?.[1];
    expect(rawTitle).toBeTruthy();
    expect(rawDescription).toBeTruthy();
    await page.goto('/collectibles/passcodes');
    await expect(page).toHaveTitle(rawTitle!);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', rawDescription!);
  });

  test('noindex routes carry robots meta in raw HTML', async ({ request }) => {
    const body = await (await request.get('http://localhost:8000/login')).text();
    expect(body).toContain('content="noindex, nofollow"');
  });

  test('unknown paths get the 404-mirror head', async ({ request }) => {
    const body = await (await request.get('http://localhost:8000/definitely-not-a-page')).text();
    expect(body).toContain('<title data-seo="server">404 Page Not Found | Stellar Blade Guide</title>');
    expect(body).toContain('content="noindex, nofollow"');
    expect(body).not.toContain('rel="canonical"');
  });

  test('etag revalidation returns 304', async ({ request }) => {
    const first = await request.get('http://localhost:8000/levels/nest');
    const etag = first.headers()['etag'];
    expect(etag).toBeTruthy();
    const second = await request.get('http://localhost:8000/levels/nest', {
      headers: { 'If-None-Match': etag },
    });
    expect(second.status()).toBe(304);
  });

  test('a seeded walkthrough gets a DB-derived head', async ({ request }) => {
    // The fixture's e2e-fixture mission type passes the type gate via the
    // DEBUG bypass; the title comes from the DB row, proving new walkthroughs
    // need no code or JSON change.
    const body = await (await request.get(
      `http://localhost:8000/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`,
    )).text();
    expect(body).toContain(
      `<title data-seo="server">${fx.walkthroughTitle} Walkthrough | Stellar Blade Guide</title>`,
    );
  });

  test('hydration dedupes the server head', async ({ page }) => {
    await page.goto('http://localhost:8000/levels/great-desert');
    await expect(page.getByText(/^\d+ collectibles$/)).toBeVisible();
    expect(await page.locator('title').count()).toBe(1);
    expect(await page.locator('head [data-seo="server"]').count()).toBe(0);
    await expect(page).toHaveTitle(/^All \d+ Great Desert Collectibles \| Stellar Blade Guide$/);
  });
});
