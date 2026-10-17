import type { Page } from '@playwright/test';

// Holds every request to `url` until released, answering from the real server
// (through `edit` when given). `seen` resolves on the first request.
export async function holdRoute(page: Page, url: string, edit?: (body: string) => string) {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let arrived!: () => void;
  const seen = new Promise<void>(resolve => { arrived = resolve; });
  await page.route(url, async route => {
    arrived();
    await held;
    const response = await route.fetch();
    await route.fulfill(edit ? { response, body: edit(await response.text()) } : { response });
  });
  return { release, seen };
}
