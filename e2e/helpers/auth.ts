import type { Page } from '@playwright/test';

// Each test gets a unique client IP via the x-real-ip header, which the
// server's rate limiter trusts unconditionally (get_client_ip). This keeps
// the Redis-backed fixed-window limits ON while giving every test a private
// bucket (register is 5/min, delete-me 5/min — shared IP would 429).
let ipSeq = 0;
// Decorrelate back-to-back suite runs: the rate-limit windows are Redis-backed
// and survive the process, so a fixed sequence reuses the same IPs when the
// suite runs twice within a minute (register is 5/min -> setup 429s). Shift
// the third octet by wall-clock second so each run gets a fresh block.
const runOffset = Math.floor(Date.now() / 1000) % 250;
export function nextTestIp(): string {
  ipSeq += 1;
  return `10.77.${(runOffset + Math.floor(ipSeq / 200)) % 250}.${(ipSeq % 200) + 1}`;
}

export interface TestUser {
  email: string;
  username: string;
  password: string;
}

export function makeUser(token: string, name: string): TestUser {
  return {
    // Not a special-use TLD: the server's email_validator rejects .test/.invalid
    // even with check_deliverability=False. No mail is ever sent on register.
    email: `e2e-${token}-${name}@sbg-e2e-suite.dev`,
    username: `e2e_${token}_${name}`,
    password: 'e2e-Password-123',
  };
}

/** Register via the API. Note: also sets the refresh cookie on the page's context. */
export async function apiRegister(page: Page, user: TestUser, ip: string): Promise<void> {
  const res = await page.request.post('/api/auth/register', {
    data: user,
    headers: { 'x-real-ip': ip },
  });
  if (res.status() !== 201) {
    throw new Error(`register failed: ${res.status()} ${await res.text()}`);
  }
}

/** Delete the user via the API (login → Bearer → DELETE /users/me). Progress rows cascade. */
export async function apiDeleteUser(page: Page, user: TestUser, ip: string): Promise<boolean> {
  const login = await page.request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
    headers: { 'x-real-ip': ip },
  });
  if (login.status() !== 200) return false;
  const { access_token } = (await login.json()) as { access_token: string };
  const del = await page.request.delete('/api/users/me', {
    headers: { Authorization: `Bearer ${access_token}`, 'x-real-ip': ip },
  });
  return del.status() === 204;
}
