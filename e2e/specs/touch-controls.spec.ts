import { test, expect, type Locator, type Page } from '@playwright/test';
import { readFixtures, type Fixtures } from '../helpers/db';
import { nextTestIp, TEST_IP_HEADER, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';
import { BULK_COPY } from '../../client/src/constants/bulkProgressCopy';

// Form controls are 16px on touch screens (client/src/index.css), so iOS Safari
// never zooms the page into one; desktop keeps the sizes the classes give. Focus
// outlines are outline-hidden, so forced colors still draws them.

let fx: Fixtures;
let ip: string;
let user: TestUser | null = null;
let seq = 0;

test.beforeAll(() => {
  fx = readFixtures();
});

test.beforeEach(async ({ context }) => {
  ip = nextTestIp();
  await context.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
  user = null;
});

test.afterEach(async ({ page }) => {
  if (user) await apiDeleteUser(page, user, ip);
});

async function signIn(page: Page): Promise<void> {
  user = makeUser(fx.token, `touch${++seq}`);
  await apiRegister(page, user, ip);
  await page.addInitScript(() => localStorage.setItem('sb_has_session', '1'));
}

type Control = { what: string; cls: string; size: string };

// Every form control in the document, hidden ones included: the rule goes by tag.
const controls = (page: Page): Promise<Control[]> => page.evaluate(() =>
  [...document.querySelectorAll('input, select, textarea')].map(el => ({
    what: `${el.tagName.toLowerCase()}[${el.getAttribute('type') ?? ''}]${el.id ? '#' + el.id : ''}`,
    cls: el.getAttribute('class') ?? '',
    size: getComputedStyle(el).fontSize,
  })));

const anyControl = (page: Page) => page.locator('input:visible, select:visible, textarea:visible').first();

async function expectAll16(page: Page, screen: string): Promise<void> {
  await expect(anyControl(page)).toBeVisible();
  const off = (await controls(page)).filter(c => c.size !== '16px');
  expect(off, `${screen}: every form control at 16px`).toEqual([]);
}

const subtypeSelect = (page: Page) => page.getByTitle('Show Documents of a specific subtype');

// What a guest can reach. The drawer's search is the only one below lg.
const GUEST_SCREENS: [string, (page: Page) => Promise<unknown>][] = [
  ['login', page => page.goto('/login')],
  ['register', page => page.goto('/register')],
  ['forgot password', page => page.goto('/forgot-password')],
  ['reset password', page => page.goto('/reset-password?token=e2e')],
  ['documents', async page => {
    await page.goto('/collectibles/documents');
    await expect(subtypeSelect(page)).toBeVisible();
  }],
];

async function openDrawerSearch(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await expect(page.getByPlaceholder('Search collectibles, walkthroughs, levels...')).toBeVisible();
}

for (const [name, viewport] of [
  ['portrait', { width: 390, height: 844 }],
  ['landscape', { width: 844, height: 390 }],
] as const) {
  test.describe(`a phone in ${name}`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      // Without a coarse pointer the rule never applies and every check below is moot.
      expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    });

    test("a guest's form controls are 16px", async ({ page }) => {
      for (const [screen, open] of GUEST_SCREENS) {
        await open(page);
        await expectAll16(page, screen);
      }
      await openDrawerSearch(page);
      await expectAll16(page, 'drawer search');
    });

    test("a signed-in user's form controls are 16px", async ({ page }) => {
      await signIn(page);
      await page.goto('/settings');
      await expect(page.getByLabel(`Type ${user!.username} to confirm`, { exact: true })).toBeVisible();
      await expectAll16(page, 'settings');

      // The Scope select and the cycle pills' radios, then the everything dialog's word.
      await page.goto('/progress');
      await page.getByRole('button', { name: BULK_COPY.heading }).click();
      await page.getByLabel(BULK_COPY.scopeLabel).selectOption('everything');
      await expectAll16(page, 'manage progress');
      await page.getByRole('button', { name: BULK_COPY.markButton }).click();
      await expect(page.getByLabel(BULK_COPY.confirmWordLabel(BULK_COPY.confirmWord))).toBeVisible();
      await expectAll16(page, 'everything dialog');
      await page.getByRole('alertdialog').getByRole('button', { name: BULK_COPY.cancel }).click();

      await page.goto(`/walkthroughs/e2e-fixture/${fx.walkthroughSlug}`);
      await expect(page.locator('textarea').first()).toBeVisible();
      await expectAll16(page, 'comment form');
    });
  });
}

test.describe('a tablet in landscape', () => {
  // A coarse pointer at lg and up: the bar's own search, not the drawer's.
  test.use({ viewport: { width: 1180, height: 820 }, isMobile: true, hasTouch: true });

  test("the bar's search is 16px", async ({ page }) => {
    await page.goto('/');
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    await page.getByRole('button', { name: 'Search (Ctrl+K)' }).click();
    await expect(page.getByPlaceholder('Search...')).toBeVisible();
    await expectAll16(page, 'bar search');
  });
});

test.describe('desktop', () => {
  test('form controls keep the sizes their classes give', async ({ page }) => {
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(false);
    let small = 0;
    const check = async (screen: string) => {
      await expect(anyControl(page)).toBeVisible();
      for (const c of await controls(page)) {
        if (/(^|\s)text-sm(\s|$)/.test(c.cls)) {
          small += 1;
          expect(c.size, `${screen}: ${c.what}`).toBe('14px');
        } else if (/(^|\s)text-base(\s|$)/.test(c.cls)) {
          expect(c.size, `${screen}: ${c.what}`).toBe('16px');
        }
      }
    };
    for (const [screen, open] of GUEST_SCREENS) {
      await open(page);
      await check(screen);
    }
    await page.getByRole('button', { name: 'Search (Ctrl+K)' }).click();
    await expect(page.getByPlaceholder('Search...')).toBeVisible();
    await check('bar search');
    expect(small, 'some text-sm control was measured').toBeGreaterThan(0);
  });

  test('forced colors still draws the focus outline', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/login');
    const email = page.getByLabel('Email');
    await email.focus();
    await expect(email).toBeFocused();
    expect(await email.evaluate(el => [getComputedStyle(el).outlineStyle, getComputedStyle(el).outlineWidth]))
      .toEqual(['solid', '2px']);
  });

  test("the subtype select draws Scope's chevron, at Scope's inset", async ({ page }) => {
    // The chevron is the select's next sibling in both places.
    const chevron = (select: Locator) => select.evaluate(el => {
      const s = el.getBoundingClientRect();
      const c = (el.nextElementSibling as Element).getBoundingClientRect();
      return {
        appearance: getComputedStyle(el).appearance,
        rightInset: Math.round(s.right - c.right),
        offCentre: Math.round((s.top + s.bottom) / 2 - (c.top + c.bottom) / 2),
      };
    });
    await page.goto('/collectibles/documents');
    const subtype = await chevron(subtypeSelect(page));

    await signIn(page);
    await page.goto('/progress');
    await page.getByRole('button', { name: BULK_COPY.heading }).click();
    const scope = await chevron(page.getByLabel(BULK_COPY.scopeLabel));

    expect(scope).toEqual({ appearance: 'none', rightInset: 12, offCentre: 0 });
    expect(subtype).toEqual(scope);
  });
});
