import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// A hash that doesn't decode names nothing, so the page opens as it would with no hash
// (utils/hashTarget.ts).

const MALFORMED = ['%', '100%', '%E0', '%CE%B1%CE'];

// Card and step ids appear only once the data has landed; the skeletons carry none.
const CARD = 'section[id] article[id]';
const LEVEL = { path: '/levels/eidos-7', ready: CARD };
const TYPE = { path: '/cosmetics/nano-suits', ready: CARD };
const PASSCODES = { path: '/collectibles/passcodes', ready: CARD };
const WALKTHROUGH = { path: '/walkthroughs/main-story/eye-of-the-hurricane', ready: 'section > div.walkthrough-content[id]' };

const crashPage = (page: Page) => page.getByRole('heading', { name: 'Something went wrong', exact: true });
const hashNow = (page: Page) => page.evaluate(() => location.hash);

// The page's content or the crash page, whichever the data's arrival brings.
async function settled(page: Page, ready: string) {
  await expect(page.locator(ready).or(crashPage(page)).first()).toBeVisible();
}

// Where the hash effect puts a card: the card, or its section when it's the section's first.
const landingTop = (page: Page, id: string) => page.evaluate((id) => {
  const el = document.getElementById(id)!;
  const section = el.closest('section[id]');
  return (section?.querySelector('article') === el ? section! : el).getBoundingClientRect().top;
}, id);

test.describe('hash decoding', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  for (const { path, ready } of [LEVEL, TYPE, PASSCODES, WALKTHROUGH]) {
    test(`${path} opens with a hash that doesn't decode`, async ({ page }) => {
      for (const hash of MALFORMED) {
        // From a blank page, so each is a cold load rather than a same-document hash change.
        await page.goto('about:blank');
        await page.goto(`${path}#${hash}`);
        expect(await hashNow(page)).toBe(`#${hash}`);
        await settled(page, ready);
        await expect(crashPage(page), `#${hash}`).toHaveCount(0);
      }
    });
  }

  test("an open page takes a hash that doesn't decode", async ({ page }) => {
    await page.goto(TYPE.path);
    await settled(page, TYPE.ready);

    // A fragment navigation the browser makes, as an edit in the address bar does. React renders
    // a navigation inside the browser's popstate, so any crash is on the page when goto returns.
    await page.goto(`${TYPE.path}#%`);
    expect(await hashNow(page)).toBe('#%');
    await expect(crashPage(page)).toHaveCount(0);
    await expect(page.locator(TYPE.ready).first()).toBeVisible();
  });

  test('a percent-encoded Greek hash lands on its card', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PASSCODES.path);
    await page.locator(PASSCODES.ready).first().waitFor();

    // A card with Greek in its id that the page can scroll to the 97px landing line.
    const id = await page.evaluate(() => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const target = (el: Element) => {
        const section = el.closest('section[id]');
        return section?.querySelector('article') === el ? section! : el;
      };
      const reachable = [...document.querySelectorAll('section[id] article[id]')].filter((el) => {
        const landing = target(el).getBoundingClientRect().top + window.scrollY - 97;
        return /[^\x00-\x7f]/.test(el.id) && landing > 0 && landing < maxScroll;
      });
      return reachable[Math.floor(reachable.length / 2)]?.id ?? null;
    });
    expect(id, 'a card with Greek in its id on the passcodes page').not.toBeNull();

    await page.goto('about:blank');
    await page.goto(`${PASSCODES.path}#${encodeURIComponent(id!)}`);
    await expect(async () => {
      const top = await landingTop(page, id!);
      expect(top).toBeGreaterThanOrEqual(96);
      expect(top).toBeLessThanOrEqual(98);
    }).toPass({ timeout: 10_000 });
  });
});
