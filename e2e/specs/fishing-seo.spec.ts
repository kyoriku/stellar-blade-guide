import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';
import { holdRoute } from '../helpers/route';

// The hand-written head copy for the Fishing category and its four pages lives
// in seo.json, which both the server's head injection (seo_head.py) and the
// client (constants/walkthroughSeo.ts) read. These pin that both sides serve it,
// raw and hydrated, and that a category without copy keeps the generated head.
// e2e cannot import the client's JSON constants, so the file is read directly.
// The pages need the dev seed (walkthroughs/fishing/1-fishing-overview.json to
// 4-bait-and-fishing-data.json).

type PageCopy = { title: string; description: string };
const SEO = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', '..', 'client', 'src', 'constants', 'seo.json'), 'utf-8',
));
const FISHING: PageCopy & { intro: string; pages: Record<string, PageCopy> } = SEO.walkthroughTypes.fishing;
// Slug and page heading, in the category's reading order.
const PAGES: [string, string][] = [
  ['fishing-overview', 'Fishing Overview'],
  ['all-fish', 'All Fish'],
  ['fishing-spots', 'Fishing Spots'],
  ['bait-and-fishing-data', 'Bait and Fishing Data'],
];
const SUFFIX = ' | Stellar Blade Guide';

// seo_head.py escapes with html.escape(quote=True).
const escapeHtml = (s: string) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

test.describe('fishing head copy', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test('the list page serves its seo.json copy raw and hydrated', async ({ page, request }) => {
    const body = await (await request.get('http://localhost:8000/walkthroughs/fishing')).text();
    expect(body).toContain(`<title data-seo="server">${escapeHtml(FISHING.title)}${SUFFIX}</title>`);
    expect(body).toContain(`name="description" content="${escapeHtml(FISHING.description)}"`);

    await page.goto('/walkthroughs/fishing');
    await expect(page.getByRole('heading', { level: 1, name: 'Fishing' })).toBeVisible();
    await expect(page.getByText(FISHING.intro, { exact: true })).toBeVisible();
    await expect(page).toHaveTitle(`${FISHING.title}${SUFFIX}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', FISHING.description);
  });

  for (const [slug, heading] of PAGES) {
    test(`${slug} serves its own copy raw and hydrated`, async ({ page, request }) => {
      const copy = FISHING.pages[slug];
      const body = await (await request.get(`http://localhost:8000/walkthroughs/fishing/${slug}`)).text();
      expect(body).toContain(`<title data-seo="server">${escapeHtml(copy.title)}${SUFFIX}</title>`);
      expect(body).toContain(`name="description" content="${escapeHtml(copy.description)}"`);
      expect(body).not.toContain(`${heading} Walkthrough`);

      await page.goto(`/walkthroughs/fishing/${slug}`);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expect(page).toHaveTitle(`${copy.title}${SUFFIX}`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', copy.description);
    });
  }

  test('the overview uses its copy while it loads', async ({ page }) => {
    const copy = FISHING.pages['fishing-overview'];
    // Held, the page stays in its loading branch, which must already use the copy.
    const api = await holdRoute(page, '**/api/walkthroughs/fishing/fishing-overview');
    await page.goto('/walkthroughs/fishing/fishing-overview', { waitUntil: 'domcontentloaded' });
    await api.seen;
    await expect(page).toHaveTitle(`${copy.title}${SUFFIX}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', copy.description);
    api.release();
    await expect(page.getByRole('heading', { level: 1, name: 'Fishing Overview' })).toBeVisible();
  });

  test('a category without copy keeps the generated head', async ({ page, request }) => {
    const body = await (await request.get('http://localhost:8000/walkthroughs/side-quests')).text();
    expect(body).toContain(`<title data-seo="server">Side Quests Walkthroughs${SUFFIX}</title>`);
    await page.goto('/walkthroughs/side-quests');
    await expect(page).toHaveTitle(`Side Quests Walkthroughs${SUFFIX}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content', /^Complete Side Quests walkthroughs for Stellar Blade\. \d+ detailed guides/,
    );
  });
});
