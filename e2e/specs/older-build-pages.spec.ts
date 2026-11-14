import { test, expect, type APIRequestContext, type Page, type Request } from '@playwright/test';
import { nextTestIp, TEST_IP_HEADER } from '../helpers/auth';

// A page from an older build, rebuilt by a browser from its own cache, names entry files this
// build doesn't have: a request for its script gets a script that reloads the page once, and one
// for its stylesheet a 302 to this build's. These reach :8000 (uvicorn serving the built dist), as
// server-meta.spec.ts does.
const ORIGIN = 'http://localhost:8000';

const PAGE = `${ORIGIN}/levels/eidos-7`;
// Entry file names no build has.
const OLD_JS = 'index-AAAAAAAA.js';
const OLD_CSS = 'index-AAAAAAAA.css';
// How the server finds the entry files a page names (seo_head's _SHELL_ENTRY).
const ENTRY_JS = /<script\b[^>]*\ssrc="\/assets\/(index-[A-Za-z0-9_-]{8}\.js)"/;
const ENTRY_CSS = /<link\b[^>]*\shref="\/assets\/(index-[A-Za-z0-9_-]{8}\.css)"/;
const NAVIGATION_LOG = 'older-build-pages:navigations';

interface ServerPage { html: string; js: string; css: string }

let ip: string;

// The server's page for a path, and the entry files it names.
async function serverPage(request: APIRequestContext, path: string): Promise<ServerPage> {
  const res = await request.get(`${ORIGIN}${path}`, { headers: { [TEST_IP_HEADER]: ip } });
  expect(res.status(), path).toBe(200);
  const html = await res.text();
  const js = html.match(ENTRY_JS)?.[1];
  const css = html.match(ENTRY_CSS)?.[1];
  expect([js, css].every(Boolean), `${path} names its entry script and stylesheet`).toBe(true);
  return { html, js: js!, css: css! };
}

// The same page as an older build wrote it: its entry files under names this build lacks.
function asOlderBuild({ html, js, css }: ServerPage): string {
  for (const name of [js, css]) expect(html.split(`/assets/${name}`).length - 1, `${name} named once`).toBe(1);
  return html.replace(`/assets/${js}`, `/assets/${OLD_JS}`).replace(`/assets/${css}`, `/assets/${OLD_CSS}`);
}

// Answers the page's document requests in the browser (the first `times`, or all), as a cache
// holding the old page would. No ETag, as the old page's never matches this build's.
async function answerDocuments(page: Page, html: string, times?: number): Promise<{ count: number }> {
  const answered = { count: 0 };
  await page.route(PAGE, (route) => {
    answered.count += 1;
    return route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      headers: { 'cache-control': 'no-cache' },
      body: html,
    });
  }, { times });
  return answered;
}

// The page's document requests, in order.
function documentRequests(page: Page): Request[] {
  const documents: Request[] = [];
  page.on('request', (r) => {
    if (r.isNavigationRequest() && r.frame() === page.mainFrame()) documents.push(r);
  });
  return documents;
}

// Every answer for an entry file, as '<status> <path>', and every load of one that failed, as
// '<error> <path>' (Chromium cancels a stylesheet it refuses after its headers, with no response).
function entryFileAnswers(page: Page): string[] {
  const answers: string[] = [];
  const entryFile = (url: string) => url.startsWith(`${ORIGIN}/assets/index-`) && new URL(url).pathname;
  page.on('response', (r) => {
    const path = entryFile(r.url());
    if (path) answers.push(`${r.status()} ${path}`);
  });
  page.on('requestfailed', (r) => {
    const path = entryFile(r.url());
    if (path) answers.push(`${r.failure()?.errorText} ${path}`);
  });
  return answers;
}

// Each document logs the cross-document navigations it starts, with its own navigation type, in
// sessionStorage, which the tab keeps across reloads; location.reload() fires the Navigation API's
// navigate event inside the call. A document's module scripts run before its load event, so the log
// it reports at load is complete for it. `settled` is the log once no further document can come,
// decided by those reports alone, with no timer: at the reloaded document's load, at the first
// document's load with nothing logged, or as soon as a second navigation is logged.
async function watchNavigations(page: Page): Promise<{ settled: Promise<string[][]> }> {
  let settle!: (log: string[][]) => void;
  const settled = new Promise<string[][]>((resolve) => { settle = resolve; });
  await page.exposeBinding('__olderBuildLog', (_source, own: string, log: string[][], loaded: boolean) => {
    if (log.length > 1 || (loaded && (own === 'reload' || log.length === 0))) settle(log);
  });
  await page.addInitScript(({ origin, key }) => {
    if (location.origin !== origin) return; // the tab's first about:blank
    const w = window as unknown as {
      navigation?: EventTarget;
      __olderBuildLog: (own: string, log: string[][], loaded: boolean) => void;
    };
    const own = String((performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type);
    const read = () => JSON.parse(sessionStorage.getItem(key) ?? '[]') as string[][];
    w.navigation?.addEventListener('navigate', (e) => {
      const event = e as unknown as { navigationType: string; destination: { sameDocument: boolean } };
      if (event.destination.sameDocument) return;
      const log = [...read(), [own, event.navigationType]];
      sessionStorage.setItem(key, JSON.stringify(log));
      w.__olderBuildLog(own, log, false);
    });
    addEventListener('load', () => w.__olderBuildLog(own, read(), true));
  }, { origin: ORIGIN, key: NAVIGATION_LOG });
  return { settled };
}

test.describe('pages from an older build', () => {
  test.beforeEach(async ({ page }) => {
    ip = nextTestIp();
    // The page's, not the context's: those would replace any headers the config sets.
    await page.setExtraHTTPHeaders({ [TEST_IP_HEADER]: ip });
  });

  test("an older build's entry files get the reload script and this build's stylesheet", async ({ request }) => {
    const { css } = await serverPage(request, '/');
    const get = (path: string) => request.get(`${ORIGIN}${path}`, { headers: { [TEST_IP_HEADER]: ip }, maxRedirects: 0 });

    const script = await get(`/assets/${OLD_JS}`);
    expect(script.status()).toBe(200);
    expect(script.headers()['content-type']).toBe('text/javascript; charset=utf-8');
    expect(script.headers()['cache-control']).toBe('no-store');
    expect(await script.text()).toContain('location.reload()');

    const sheet = await get(`/assets/${OLD_CSS}`);
    expect(sheet.status()).toBe(302);
    expect(sheet.headers()['location']).toBe(`/assets/${css}`);
    expect(sheet.headers()['cache-control']).toBe('no-store');
    const current = await get(sheet.headers()['location']);
    expect(current.status()).toBe(200);
    expect(current.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  test("an older build's page reloads once into this build's", async ({ page, request }) => {
    const current = await serverPage(request, '/levels/eidos-7');
    const navigations = await watchNavigations(page);
    const documents = documentRequests(page);
    const answers = entryFileAnswers(page);
    const answered = await answerDocuments(page, asOlderBuild(current), 1);

    await page.goto(PAGE, { waitUntil: 'commit' });
    // The first document reloaded once, and the second started nothing.
    expect(await navigations.settled).toEqual([['navigate', 'reload']]);
    expect(documents.map((r) => r.url())).toEqual([PAGE, PAGE]);
    // The second came from the server: the route answered only the first.
    expect(answered.count).toBe(1);
    expect(await (await documents[1].response())?.text()).toBe(current.html);
    expect(await page.evaluate(() =>
      (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).type)).toBe('reload');
    await expect.poll(() => answers).toContain(`200 /assets/${OLD_JS}`);
    await expect.poll(() => answers).toContain(`200 /assets/${current.js}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Eidos 7');
  });

  test('a page that comes back old twice stays put', async ({ page, request }) => {
    // A deploy race, or a cache that keeps the page: the reload brings the old page again.
    const current = await serverPage(request, '/levels/eidos-7');
    const navigations = await watchNavigations(page);
    const documents = documentRequests(page);
    const answers = entryFileAnswers(page);
    const answered = await answerDocuments(page, asOlderBuild(current));

    await page.goto(PAGE, { waitUntil: 'commit' });
    // The second document is itself a reload, so its reload script leaves it there.
    expect(await navigations.settled).toEqual([['navigate', 'reload']]);
    expect(documents.map((r) => r.url())).toEqual([PAGE, PAGE]);
    expect(answered.count).toBe(2);
    await expect.poll(() => answers.filter((a) => a.endsWith('.js')))
      .toEqual([`200 /assets/${OLD_JS}`, `200 /assets/${OLD_JS}`]);
    await expect(page.locator('h1')).toHaveCount(0);
    await expect(page.locator('#root')).toBeEmpty();
  });

  test("an older build's page whose script is still cached runs it under this build's stylesheet", async ({ page, request }) => {
    const current = await serverPage(request, '/levels/eidos-7');
    const navigations = await watchNavigations(page);
    const documents = documentRequests(page);
    const answers = entryFileAnswers(page);
    await answerDocuments(page, asOlderBuild(current), 1);
    // The old script as the browser's cache would answer it: a stand-in that marks the page.
    await page.route(`${ORIGIN}/assets/${OLD_JS}`, (route) =>
      route.fulfill({ contentType: 'text/javascript', body: 'document.documentElement.dataset.olderBuild = "ran";' }));

    await page.goto(PAGE, { waitUntil: 'commit' });
    expect(await navigations.settled).toEqual([]);
    expect(documents.map((r) => r.url())).toEqual([PAGE]);
    await expect(page.locator('html')).toHaveAttribute('data-older-build', 'ran');
    await expect.poll(() => answers.filter((a) => a.endsWith('.css')))
      .toEqual([`302 /assets/${OLD_CSS}`, `200 /assets/${current.css}`]);
    // Its rules apply (a refused sheet's can't be read).
    expect(await page.evaluate(() => {
      try {
        return document.querySelector<HTMLLinkElement>('link[rel="stylesheet"]')?.sheet?.cssRules.length ?? 0;
      } catch {
        return 0;
      }
    })).toBeGreaterThan(0);
  });
});
