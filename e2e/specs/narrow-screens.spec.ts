import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// No collectible page scrolls sideways on a 320px phone. The container draws the site's font
// stack in DejaVu Sans, wider than San Francisco and Roboto, so a page that fits here fits there.

// e2e cannot import the client's JSON constants, so the file is read directly.
const SEO = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', '..', 'client', 'src', 'constants', 'seo.json'), 'utf-8',
));
const LEVEL_PAGES = Object.keys(SEO.levels).map((slug) => `/levels/${slug}`);
const TYPE_PAGES = Object.entries(SEO.types as Record<string, object>)
  .flatMap(([category, types]) => Object.keys(types).map((slug) => `/${category}/${slug}`));

// How far the page scrolls sideways, and what sticks out past the right edge (fixed boxes and
// anything inside a clipping box can't widen the page, so they're left out).
const sideways = (page: Page) => page.evaluate(() => {
  const root = document.documentElement;
  const edge = root.clientWidth;
  const out = (el: Element) => el.getBoundingClientRect().right > edge + 0.5;
  const held = (el: Element) => {
    for (let a: Element | null = el; a && a !== root; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.position === 'fixed' || (a !== el && a !== document.body && s.overflowX !== 'visible')) return true;
    }
    return false;
  };
  const culprits = [...document.body.querySelectorAll('*')]
    .filter((el) => out(el) && !out(el.parentElement!) && !held(el))
    .map((el) => `${el.tagName.toLowerCase()} "${el.textContent!.trim().slice(0, 60)}"`);
  return { by: root.scrollWidth - edge, culprits: culprits.join(', ') };
});

const open = async (page: Page, url: string) => {
  await page.goto(url);
  await expect(page.locator('section[id] article[id]').first()).toBeVisible();
};

test.describe('collectible pages at 320px', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  for (const url of LEVEL_PAGES) {
    test(`${url} doesn't scroll sideways`, async ({ page }) => {
      await open(page, url);
      const { by, culprits } = await sideways(page);
      expect(by, `past the edge: ${culprits}`).toBe(0);
    });
  }

  for (const url of TYPE_PAGES) {
    test(`${url} doesn't scroll sideways, grouped or A–Z`, async ({ page }) => {
      await open(page, url);
      const grouped = await sideways(page);
      expect(grouped.by, `past the edge: ${grouped.culprits}`).toBe(0);

      // A–Z swaps the headings for a place line on each card.
      const az = page.getByRole('button', { name: 'A–Z', exact: true });
      await az.click();
      await expect(az).toHaveAttribute('aria-pressed', 'true');
      const sorted = await sideways(page);
      expect(sorted.by, `past the edge in A–Z: ${sorted.culprits}`).toBe(0);
    });
  }

  test('the A–Z label stays on one line beside the cycle pills', async ({ page }) => {
    await open(page, '/cosmetics/nano-suits');
    const lines = await page.getByRole('button', { name: 'A–Z', exact: true }).evaluate((button) => {
      const range = document.createRange();
      range.selectNodeContents(button);
      return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
    });
    expect(lines).toBe(1);
  });
});
