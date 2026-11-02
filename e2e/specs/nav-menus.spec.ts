import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// The desktop nav menus (components/navbar/DesktopDropdown.tsx) open from their arrow by
// keyboard as well as by hover. The arrow's press used to bubble to the menu's own click,
// which closes it, so Enter and Space left a menu shut and its items out of reach. Escape
// closes an open menu, focus leaving it closes it, and keyboard focus lights an item.

test.use({ viewport: { width: 1280, height: 800 } });

// The Levels menu: its arrow, the panel the arrow names, and the panel's links.
async function levelsMenu(page: Page) {
  const arrow = page.getByRole('button', { name: 'Toggle levels menu' });
  const panel = page.locator(`[id="${await arrow.getAttribute('aria-controls')}"]`);
  return { arrow, panel, items: panel.getByRole('link') };
}

const focusInside = (panel: ReturnType<Page['locator']>) => panel.evaluate(el => el.contains(document.activeElement));

test.describe('desktop nav menus', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
    // No menu is the current section here, and the mouse never comes near the bar.
    await page.goto('/privacy');
  });

  test('a menu opens from the keyboard, focus in it shows, and Escape closes it with focus back on the arrow', async ({ page }) => {
    const { arrow, items } = await levelsMenu(page);
    await arrow.focus();
    await page.keyboard.press('Enter');
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await expect(items.first()).toBeVisible();
    // Space works as well, both ways.
    await page.keyboard.press('Space');
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Space');
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');

    // Tab reaches the items, and a focused item lights as a hovered one does (white text
    // on a tint), since the panel clips an outline drawn outside a full-width link.
    await page.keyboard.press('Tab');
    await expect(items.first()).toBeFocused();
    await expect(items.first()).toHaveCSS('color', 'rgb(255, 255, 255)');
    expect(await items.first().evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');

    await page.keyboard.press('Escape');
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    await expect(arrow).toBeFocused();
  });

  test("a menu's items can take focus in the frame it opens", async ({ page }) => {
    // All in one task: the press, React's commit (a microtask), then the reads, before any
    // frame runs. The panel fades in, and with visibility in that transition it stayed
    // hidden until the fade's first step, so a Tab straight after Enter skipped the items
    // (and closed the menu as focus left).
    const { arrow } = await levelsMenu(page);
    const seen = await arrow.evaluate(async el => {
      el.click();
      await Promise.resolve();
      await Promise.resolve();
      const panel = document.getElementById(el.getAttribute('aria-controls')!)!;
      const first = panel.querySelector('a')!;
      first.focus();
      return { expanded: el.getAttribute('aria-expanded'), visibility: getComputedStyle(panel).visibility, focused: document.activeElement === first };
    });
    expect(seen).toEqual({ expanded: 'true', visibility: 'visible', focused: true });
  });

  test('a menu stays open while focus moves through it, and closes once focus leaves it', async ({ page }) => {
    const { arrow, panel, items } = await levelsMenu(page);
    await arrow.focus();
    await page.keyboard.press('Enter');
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    const count = await items.count();
    expect(count, 'a menu of items').toBeGreaterThan(1);
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
      await expect(items.nth(i)).toBeFocused();
      await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    }
    // Past the last item: the next section's link, outside this menu.
    await page.keyboard.press('Tab');
    expect(await focusInside(panel)).toBe(false);
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
  });

  test('Enter on an item goes to its page, and the menu closes', async ({ page }) => {
    const { arrow, items } = await levelsMenu(page);
    await arrow.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    const href = await items.first().getAttribute('href');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(href!);
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
  });

  test("a click on the arrow toggles its menu, whether or not hover opened it", async ({ page }) => {
    const { arrow } = await levelsMenu(page);
    await arrow.hover();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
    await arrow.click();
    await expect(arrow).toHaveAttribute('aria-expanded', 'false');
    // The pointer hasn't left, so only the click can open it again.
    await arrow.click();
    await expect(arrow).toHaveAttribute('aria-expanded', 'true');
  });
});
