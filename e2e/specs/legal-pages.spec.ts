import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// The three legal pages soften their title, body text and section headings to 90% of
// their palette colours (text-gray-100/90, text-gray-300/90, and [&_h2]:text-gray-200/90
// on the card), and narrow their column to max-w-2xl so body lines run near 80
// characters. Links and the "Last Updated" line keep their colours. Blood Rain shares
// the section-heading component and the card pattern, and keeps its colours and width.

type Reading = {
  title: number;
  heading: number;
  body: number;
  email: number;
  updated: number;
  maxWidth: string;
};

// WCAG 2 contrast of each element's text against the nearest opaque surface behind it,
// from the colours the browser computed. A colour with alpha is painted over that
// surface on a one-pixel canvas, as the browser blends text, so each number is the one
// on screen. An element the page doesn't have reads NaN, which fails every range.
function read(page: Page): Promise<Reading> {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const surfaceOf = (el: Element): Element => {
      for (let node: Element | null = el; node; node = node.parentElement) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return node;
      }
      return document.body;
    };
    const paint = (surface: Element, colour: string): number[] => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = getComputedStyle(surface).backgroundColor;
      ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = colour;
      ctx.fillRect(0, 0, 1, 1);
      return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3));
    };
    const luminance = (rgb: number[]): number => rgb
      .map(v => v / 255)
      .map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const contrast = (el: Element | null | undefined): number => {
      if (!el) return NaN;
      const surface = surfaceOf(el);
      const text = luminance(paint(surface, getComputedStyle(el).color));
      const behind = luminance(paint(surface, 'transparent'));
      return (Math.max(text, behind) + 0.05) / (Math.min(text, behind) + 0.05);
    };

    const h1 = document.querySelector('h1')!;
    const column = h1.closest('.container')!;
    const card = column.querySelector('.bg-secondary.shadow-lg')!;
    return {
      title: contrast(h1),
      heading: contrast(card.querySelector('h2')),
      body: contrast(card.querySelector('p')),
      email: contrast(card.querySelector('a[href^="mailto:"]')),
      updated: contrast([...card.querySelectorAll(':scope > div')].find(d => d.textContent?.trim().startsWith('Last Updated'))),
      maxWidth: getComputedStyle(column).maxWidth,
    };
  });
}

function expectBetween(value: number, low: number, high: number, what: string): void {
  expect(value, `${what}: ${value.toFixed(2)}:1`).toBeGreaterThanOrEqual(low);
  expect(value, `${what}: ${value.toFixed(2)}:1`).toBeLessThanOrEqual(high);
}

test.describe('legal pages: softer text and a narrower column', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  for (const path of ['/privacy', '/terms', '/disclaimer']) {
    test(`${path} softens its text to 90% and keeps links and the date as they were`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      const r = await read(page);
      // 90% of gray-100 on the page, and of gray-200 and gray-300 on the card.
      expectBetween(r.title, 13.6, 14.3, 'title');
      expectBetween(r.heading, 11.2, 11.9, 'section heading');
      expectBetween(r.body, 9.45, 10.05, 'body text');
      // Unchanged: cyan-400 links and the gray-400 date.
      expectBetween(r.email, 9.2, 9.8, 'email link');
      expectBetween(r.updated, 6.4, 6.9, 'Last Updated');
      // max-w-2xl, 42rem.
      expect(r.maxWidth).toBe('672px');
    });
  }

  test('Blood Rain keeps its colours and its wider column', async ({ page }) => {
    await page.goto('/blood-rain');
    await expect(page.locator('h1')).toBeVisible();
    const r = await read(page);
    // gray-100, gray-200 and gray-300 at full strength, as before.
    expectBetween(r.title, 16.8, 17.6, 'title');
    expectBetween(r.heading, 13.6, 14.3, 'section heading');
    expectBetween(r.body, 11.4, 12.1, 'body text');
    // max-w-4xl, 56rem.
    expect(r.maxWidth).toBe('896px');
  });
});
