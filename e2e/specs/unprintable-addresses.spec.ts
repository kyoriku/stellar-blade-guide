import { test, expect, type Page } from '@playwright/test';
import { readFixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';
import { SECTION_LABELS } from '../../client/src/constants/sections';

// No page is named with a character that isn't printable text, so an address whose path holds
// one is the 404 page. The router matches no route at all for an LF, CR, LS or PS outside a
// parameter, which left the page empty, so App.tsx checks the path before <Routes> does
// (utils/textPath.ts). In production the server's 404 page comes first (server-meta.spec.ts).

// Percent-encoded, as they arrive: tab, NUL, DEL, US and every line break Python knows.
const CHARACTERS = ['%0A', '%0D', '%0D%0A', '%09', '%0B', '%0C', '%1C', '%1D', '%1E', '%1F', '%00', '%7F',
  '%C2%85', '%E2%80%A8', '%E2%80%A9'];

// Addresses with an escape that doesn't decode, the last with a line break escape as well.
const MALFORMED = ['/%', '/levels/%', '/levels/%E0%A4%A', '/lev%0Aels%'];

const heading = (page: Page) => page.getByRole('heading', { level: 1 });

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
}

async function expectNotFoundInLayout(page: Page, address: string) {
  await expect(heading(page), address).toHaveText('Page Not Found');
  await expect(page.getByRole('navigation', { name: 'Footer' }), address).toBeVisible();
  await expect(page.locator('head meta[name="robots"]'), address).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page, address).toHaveURL(address);
}

test.describe('unprintable addresses', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  for (const c of CHARACTERS) {
    test(`${c} gets the 404 page in the layout and asks the API nothing`, async ({ page }) => {
      const fx = readFixtures();
      const errors = watchErrors(page);
      const unmatched: string[] = [];
      const asked: string[] = [];
      page.on('console', (m) => { if (m.text().includes('No routes matched')) unmatched.push(m.text()); });
      page.on('request', (r) => { if (new URL(r.url()).pathname.startsWith('/api/')) asked.push(r.url()); });
      for (const address of [`/lev${c}els`, `/levels${c}`, `/walkthroughs/e2e-fixture/${fx.walkthroughSlug}${c}`]) {
        await page.goto(address);
        await expectNotFoundInLayout(page, address);
      }
      expect(unmatched).toEqual([]);
      expect(asked).toEqual([]);
      expect(errors).toEqual([]);
    });
  }

  test('a navbar link leaves the 404 page, and Back and Forward return to each page', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/lev%0Aels');
    await expectNotFoundInLayout(page, '/lev%0Aels');
    const levels = page.locator('nav').getByRole('link', { name: SECTION_LABELS.levels, exact: true })
      .filter({ visible: true });
    await levels.click();
    await expect(page).toHaveURL('/levels');
    await expect(heading(page)).toHaveText(SECTION_LABELS.levels);
    // The layout stays mounted, so the link keeps focus, as on any other page.
    await expect(levels).toBeFocused();
    // Back renders the 404 page in the layout again, never an empty page.
    await page.goBack();
    await expectNotFoundInLayout(page, '/lev%0Aels');
    await expect(levels).toBeFocused();
    await page.goForward();
    await expect(page).toHaveURL('/levels');
    await expect(heading(page)).toHaveText(SECTION_LABELS.levels);
    expect(errors).toEqual([]);
  });

  test("an address with an escape that doesn't decode gets the 404 page, never a crash", async ({ page }) => {
    const errors = watchErrors(page);
    // Vite answers these with an empty 404, so the test serves the shell there, as uvicorn does
    // with DEBUG on. With DEBUG off, the bot filter refuses the first three before the client runs.
    const shell = await (await page.request.get('/')).text();
    await page.route((url) => MALFORMED.includes(url.pathname),
      (route) => route.fulfill({ status: 200, contentType: 'text/html', body: shell }));
    for (const address of MALFORMED) {
      await page.goto(address);
      await expectNotFoundInLayout(page, address);
    }
    expect(errors).toEqual([]);
  });
});
