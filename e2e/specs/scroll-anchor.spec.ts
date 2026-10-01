import { test, expect, type Page } from '@playwright/test';
import { nextTestIp } from '../helpers/auth';

// Every in-page jump lands its target at the `scroll-anchor` margin
// (client/src/index.css): 77px below the viewport top on phones, 97px from md
// up. window.scrollTo ignores scroll-margin, so the JS paths (the three detail
// pages' hash effects and both Contents components) go through
// utils/scrollToElement, which reads the margin back. A target that lost the
// utility, or a path that went back to a hardcoded offset, lands elsewhere.
//
// Targets are picked from the rendered page rather than named, so a content
// edit cannot break the spec: the middle one of those the page can actually
// scroll to the offset, since a target near the end is clamped by the page
// bottom. Below lg the Contents list is FloatingTOC's drawer; from lg up it
// is the TableOfContents sidebar.

const WIDTHS = [
  { name: 'phone', viewport: { width: 390, height: 844 }, offset: 77 },
  { name: 'desktop', viewport: { width: 1280, height: 800 }, offset: 97 },
];

const LEVEL = '/levels/great-desert';
const TYPE = '/collectibles/documents';
const WALKTHROUGH = '/walkthroughs/main-story/eye-of-the-hurricane';

// The loading skeletons carry section ids too, but never a card id, so
// requiring one also waits for the data.
const LOCATION = 'section[id]:has(article[id])';
const LATER_CARD = 'section[id] article[id]:not(:first-child)';
const TYPE_LEVEL = 'div[id]:has(> section[id] article[id])';
const STEP = 'section > div.walkthrough-content[id]';

// `linked` keeps only targets the Contents list links to (an untitled
// walkthrough section has no entry).
async function pickTarget(page: Page, selector: string, offset: number, linked = false): Promise<string> {
  await page.locator(selector).first().waitFor();
  const id = await page.evaluate(({ selector, offset, linked }) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const hrefs = new Set([...document.links].map((a) => a.getAttribute('href')));
    const reachable = [...document.querySelectorAll(selector)].filter((el) => {
      const landing = el.getBoundingClientRect().top + window.scrollY - offset;
      return el.id && (!linked || hrefs.has(`#${el.id}`)) && landing > 0 && landing < maxScroll;
    });
    return reachable[Math.floor(reachable.length / 2)]?.id ?? null;
  }, { selector, offset, linked });
  expect(id, `no ${selector} on the page can be scrolled to ${offset}px`).not.toBeNull();
  return id!;
}

// Retried until the jump has happened: a hash effect runs once the page's data
// arrives, and FloatingTOC jumps only after its drawer has closed.
async function expectLandsAt(page: Page, id: string, offset: number) {
  await expect(async () => {
    const top = await page.evaluate((id) => document.getElementById(id)!.getBoundingClientRect().top, id);
    expect(top, `#${id} top edge`).toBeGreaterThanOrEqual(offset - 1);
    expect(top, `#${id} top edge`).toBeLessThanOrEqual(offset + 1);
  }).toPass({ timeout: 10_000 });
}

// Picks on a plain load, then loads again with the hash from about:blank: a
// goto that changes only the fragment would be a same-document navigation,
// not the cold load the hash effect handles.
async function hashLoad(page: Page, path: string, selector: string, offset: number) {
  await page.goto(path);
  const id = await pickTarget(page, selector, offset);
  await page.goto('about:blank');
  await page.goto(`${path}#${encodeURIComponent(id)}`);
  await expectLandsAt(page, id, offset);
}

async function tocClick(page: Page, path: string, selector: string, offset: number) {
  await page.goto(path);
  const id = await pickTarget(page, selector, offset, true);
  const drawer = page.getByRole('button', { name: 'Open table of contents' });
  if (await drawer.isVisible()) await drawer.click();
  await page.locator(`a[href="#${id}"]`).filter({ visible: true }).click();
  await expectLandsAt(page, id, offset);
}

for (const { name, viewport, offset } of WIDTHS) {
  test.describe(`scroll anchor, ${name}`, () => {
    test.use({ viewport });

    test.beforeEach(async ({ context }) => {
      await context.setExtraHTTPHeaders({ 'x-real-ip': nextTestIp() });
    });

    test(`level hash lands a location ${offset}px down`, async ({ page }) => {
      await hashLoad(page, LEVEL, LOCATION, offset);
    });

    test(`level Contents link lands a location ${offset}px down`, async ({ page }) => {
      await tocClick(page, LEVEL, LOCATION, offset);
    });

    // A first card is swapped for its section, so only later cards land
    // themselves.
    test(`type hash lands a card ${offset}px down`, async ({ page }) => {
      await hashLoad(page, TYPE, LATER_CARD, offset);
    });

    test(`type Contents link lands a level ${offset}px down`, async ({ page }) => {
      await tocClick(page, TYPE, TYPE_LEVEL, offset);
    });

    test(`walkthrough hash lands a section ${offset}px down`, async ({ page }) => {
      await hashLoad(page, WALKTHROUGH, STEP, offset);
    });

    test(`walkthrough Contents link lands a section ${offset}px down`, async ({ page }) => {
      await tocClick(page, WALKTHROUGH, STEP, offset);
    });
  });
}
