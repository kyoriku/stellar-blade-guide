import { expect, type Locator } from '@playwright/test';

type Box = { x: number; y: number; width: number; height: number };

// The site's busy pattern (client/src/components/BusyLabel.tsx). Busy, a button keeps
// its idle size and its accessible name, a spinner takes its label's place, the label
// stays but turns transparent, no busy text shows inside it, and the live region beside
// it reads the busy text out.

const spinnerOf = (button: Locator) => button.locator('svg.animate-spin');
// BusyLabel's label: the item of its grid ahead of the spinner.
const labelOf = (button: Locator) => button.locator('span.grid > span');
const labelOpacity = (button: Locator) => labelOf(button).evaluate(el => getComputedStyle(el).opacity);

// The button at rest: no spinner, its label showing. Returns its size, to compare.
export async function idleBox(button: Locator): Promise<Box> {
  await expect(labelOf(button), 'its label sits in BusyLabel').toHaveCount(1);
  await expect(spinnerOf(button)).toHaveCount(0);
  expect(await labelOpacity(button), 'the label shows when idle').toBe('1');
  return (await button.boundingBox())!;
}

// The button busy now, against the size idleBox returned.
export async function expectBusyNow(button: Locator, idle: Box, opts: { name: string | RegExp; busyText: string; live: Locator }): Promise<void> {
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(spinnerOf(button)).toBeVisible();
  // Playwright counts a transparent element as visible, so the label goes by its style.
  await expect.poll(() => labelOpacity(button), { message: 'the label turns transparent' }).toBe('0');
  await expect(button.getByText(opts.busyText, { exact: true }), 'no busy text in the button').toHaveCount(0);
  await expect(button).toHaveAccessibleName(opts.name);
  const busy = (await button.boundingBox())!;
  expect([busy.width, busy.height], 'the same size, idle or busy').toEqual([idle.width, idle.height]);
  await expect(opts.live).toHaveText(opts.busyText);
}

// Both around one press: `press` puts the button to work, with its request held by the
// caller so the busy state stays put, and `seen` resolves once that request arrives.
export async function expectBusyPattern(button: Locator, opts: {
  name: string | RegExp;
  busyText: string;
  live: Locator;
  press: () => Promise<unknown>;
  seen: Promise<unknown>;
}): Promise<void> {
  await expect(button).toHaveAccessibleName(opts.name);
  const idle = await idleBox(button);
  await opts.press();
  await opts.seen;
  await expectBusyNow(button, idle, opts);
}
