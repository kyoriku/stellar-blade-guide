import { test, expect, type Page } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// The level and type pages' cycle pills, and the type page's A–Z toggle, say which is
// on through aria-pressed: the tint shows it only to someone who can see it.

// Each cycle pill is titled "Show …", All included.
const cyclePills = (page: Page) => page.locator('main button[title^="Show "]');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

// The row's pills as the page renders them, with only `selected` pressed.
async function expectSelected(page: Page, selected: string): Promise<string[]> {
  await expect(cyclePills(page).first()).toBeVisible();
  const labels = await cyclePills(page).allTextContents();
  expect(labels.length, 'a row of pills').toBeGreaterThan(1);
  for (const label of labels) {
    await expect(button(page, label), label).toHaveAttribute('aria-pressed', String(label === selected));
  }
  return labels;
}

async function expectToggles(page: Page): Promise<void> {
  const az = button(page, 'A–Z');
  await expect(az).toHaveAttribute('aria-pressed', 'false');
  await az.click();
  await expect(az).toHaveAttribute('aria-pressed', 'true');
  await az.click();
  await expect(az).toHaveAttribute('aria-pressed', 'false');
}

test.describe('filter pills', () => {
  test.beforeEach(async ({ context }) => {
    await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: nextTestIp() });
  });

  test("a level page's cycle pills say which one is selected", async ({ page }) => {
    await page.goto('/levels/eidos-7');
    const labels = await expectSelected(page, 'All');
    const last = labels[labels.length - 1];
    await button(page, last).click();
    await expectSelected(page, last);
  });

  test("a type page's cycle pills and its A–Z say which is on", async ({ page }) => {
    await page.goto('/cosmetics/nano-suits');
    const labels = await expectSelected(page, 'All');
    const last = labels[labels.length - 1];
    await button(page, last).click();
    await expectSelected(page, last);
    await expectToggles(page);
  });

  test("a type page with one cycle shows no pills, and its A–Z says when it's on", async ({ page }) => {
    await page.goto('/collectibles/cans');
    await expect(button(page, 'A–Z')).toBeVisible();
    await expect(cyclePills(page)).toHaveCount(0);
    await expectToggles(page);
  });
});
