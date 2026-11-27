import { expect, type Locator } from '@playwright/test';

type SafariPress = { safariPress?: { landed?: boolean } };

// The next press on target as WebKit makes it, for a button or link with no tabindex, outside any
// element that has one. WebKit's mousedown focuses the nearest mouse-focusable element it lands
// in, or nothing, unless the page prevents its default (EventHandler::dispatchMouseEvent), and a
// button or link is mouse-focusable there only with a tabindex: so the press blurs what had focus
// and focuses nothing. Chromium would focus it.
async function blurOnNextPress(target: Locator): Promise<void> {
  await target.evaluate(el => {
    const press: { landed?: boolean } = {};
    (window as unknown as SafariPress).safariPress = press;
    window.addEventListener('mousedown', e => {
      press.landed = e.target instanceof Node && el.contains(e.target);
      if (!press.landed || e.defaultPrevented) return;
      e.preventDefault();
      (document.activeElement as HTMLElement | null)?.blur();
    }, { once: true });
  });
}

// The press's mousedown landed in target: one that missed it got Chromium's focus. Polled, since a
// tap's mousedown follows its touchend.
async function expectLanded(target: Locator): Promise<void> {
  await expect.poll(() => target.page().evaluate(() => (window as unknown as SafariPress).safariPress?.landed),
    "the press's mousedown, in its target").toBe(true);
}

// A click as Safari makes it.
export async function pressAsSafari(target: Locator): Promise<void> {
  await blurOnNextPress(target);
  await target.click();
  await expectLanded(target);
}

// A tap as Safari on iOS makes it.
export async function tapAsSafari(target: Locator): Promise<void> {
  await blurOnNextPress(target);
  await target.tap();
  await expectLanded(target);
}
