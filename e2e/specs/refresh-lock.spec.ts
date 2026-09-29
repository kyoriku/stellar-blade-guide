import { createHash } from 'node:crypto';
import { test, expect, type Page, type Request, type Response } from '@playwright/test';
import { readFixtures, redisClient, type Fixtures } from '../helpers/db';
import { nextTestIp, makeUser, apiRegister, apiDeleteUser, type TestUser } from '../helpers/auth';

// Tabs of one browser share the refresh cookie. The client holds a Web Lock across
// each refresh so tabs take turns: the next tab's request goes out only after the
// previous response set the rotated cookie. Without it, two tabs restoring at once
// present the same cookie and the server mints two live tokens, one never used.

// Must match REFRESH_LOCK in client/src/utils/refreshLock.ts.
const REFRESH_LOCK = 'sb_auth_refresh';
// Must match SESSION_FLAG in client/src/context/AuthContext.tsx.
const SESSION_FLAG = 'sb_has_session';

let fx: Fixtures;

const isRefresh = (url: URL) => url.pathname === '/api/auth/refresh';
const refreshOk = (r: Response) => r.url().includes('/api/auth/refresh') && r.status() === 200;

/** "{uid}:{token}", the refresh cookie's value. */
function splitCookie(value: string): { uid: string; token: string } {
  const at = value.indexOf(':');
  return { uid: value.slice(0, at), token: value.slice(at + 1) };
}

/** The token a Cookie or Set-Cookie header carries for refresh_token, if any. */
function tokenIn(header: string | null | undefined): string | null {
  const match = /refresh_token=("?)([^";]+)\1/.exec(header ?? '');
  return match ? splitCookie(match[2]).token : null;
}

function keyFor(uid: string, token: string): string {
  return `refresh:${uid}:${createHash('sha256').update(token).digest('hex')}`;
}

async function browserCookie(page: Page): Promise<{ uid: string; token: string }> {
  const cookie = (await page.context().cookies()).find((c) => c.name === 'refresh_token');
  if (!cookie) throw new Error('no refresh cookie in the context');
  return splitCookie(cookie.value);
}

/** Token keys (not session families) still at full lifetime; a rotated-out one sits at 60 s or less. */
async function liveTokenKeys(uid: string): Promise<string[]> {
  const redis = redisClient();
  try {
    const live: string[] = [];
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', `refresh:${uid}:*`, 'COUNT', 200);
      cursor = next;
      for (const key of keys) {
        if (key.includes(':family:')) continue;
        if ((await redis.ttl(key)) > 3600) live.push(key);
      }
    } while (cursor !== '0');
    return live.sort();
  } finally {
    redis.disconnect();
  }
}

test.describe('refresh lock', () => {
  let ip: string;
  let user: TestUser | null = null;
  let seq = 0;

  test.beforeAll(() => {
    fx = readFixtures();
  });

  test.beforeEach(async ({ page, context }) => {
    ip = nextTestIp();
    await context.setExtraHTTPHeaders({ 'x-real-ip': ip });
    user = makeUser(fx.token, `l${++seq}`);
    // Keeps the refresh cookie: every page in this context starts signed in.
    await apiRegister(page, user, ip);
    await context.addInitScript((flag) => localStorage.setItem(flag, '1'), SESSION_FLAG);
  });

  test.afterEach(async ({ page }) => {
    if (user) {
      await apiDeleteUser(page, user, ip);
      user = null;
    }
  });

  test('two tabs restoring at once take turns and leave one live token, the one the browser holds', async ({
    page: a,
    context,
  }) => {
    const b = await context.newPage();

    // Setup restores one tab after the other, so it makes no race of its own.
    for (const tab of [a, b]) {
      const restored = tab.waitForResponse(refreshOk);
      await tab.goto('/');
      await restored;
    }
    const before = await browserCookie(a);
    expect(await liveTokenKeys(before.uid)).toEqual([keyFor(before.uid, before.token)]);

    // Every refresh is held at the network until both tabs have shown their hand.
    // No hold is timed: the gate opens on evidence, and a request arriving after
    // it opened passes straight through.
    const arrived: Request[] = [];
    let release: () => void = () => {};
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    await context.route(isRefresh, async (route) => {
      arrived.push(route.request());
      await released;
      await route.continue();
    });

    try {
      const restoredA = a.waitForResponse(refreshOk);
      const restoredB = b.waitForResponse(refreshOk);
      // Only to commit: the waiting tab's 4 s lock wait starts at mount, and waiting
      // for load (the hero image) would spend it before the poll below could see
      // that tab queued.
      await Promise.all([a.reload({ waitUntil: 'commit' }), b.reload({ waitUntil: 'commit' })]);

      const queuedOnLock = async (): Promise<boolean> => {
        try {
          return await a.evaluate(async (name) => {
            const { pending = [] } = await navigator.locks.query();
            return pending.some((lock) => lock.name === name);
          }, REFRESH_LOCK);
        } catch {
          return false; // a navigation in flight; the next poll asks again
        }
      };
      // Without the lock both requests reach the network with the same cookie; with
      // it, one is held here and the other tab is queued behind it on the lock.
      let opened = '';
      await expect
        .poll(
          async () => {
            if (arrived.length >= 2) opened = 'both requests reached the network';
            else if (arrived.length === 1 && (await queuedOnLock())) opened = 'the second tab queued on the lock';
            return opened;
          },
          { intervals: [50], timeout: 20_000 },
        )
        .not.toBe('');
      test.info().annotations.push({ type: 'gate', description: opened });

      release();
      await Promise.all([restoredA, restoredB]);

      // One refresh per tab.
      expect(arrived).toHaveLength(2);
      // The second tab presented the cookie the first tab's response had just set.
      // Soft, so a race also reports its effect in Redis below.
      const [first, second] = arrived;
      const setByFirst = tokenIn(await (await first.response())?.headerValue('set-cookie'));
      const sentBySecond = tokenIn((await second.allHeaders())['cookie']);
      expect(setByFirst).not.toBeNull();
      expect.soft(sentBySecond).toBe(setByFirst);
      // One live token for the user, and it is the one the browser holds now.
      const after = await browserCookie(a);
      expect(await liveTokenKeys(after.uid)).toEqual([keyFor(after.uid, after.token)]);
    } finally {
      release();
      await context.unrouteAll({ behavior: 'ignoreErrors' });
    }
  });

  test('a browser without Web Locks still restores its session', async ({ page, context }) => {
    // Older Safari and insecure origins have no navigator.locks; a refresh must
    // then behave exactly as it did before the lock existed.
    await context.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'locks', { get: () => undefined, configurable: true });
    });
    const restored = page.waitForResponse(refreshOk, { timeout: 10_000 });
    await page.goto('/');
    expect(await page.evaluate(() => typeof navigator.locks)).toBe('undefined');
    await restored;
  });
});
