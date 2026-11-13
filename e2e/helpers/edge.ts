import type { Route } from '@playwright/test';

// Answers the API never sends, as Cloudflare or a middlebox gives them: status, content type,
// and headers as Cloudflare's docs give them, the markup shortened, since the client never
// renders it, only tries to read it as JSON.

export type Answer = NonNullable<Parameters<Route['fulfill']>[0]>;

const page = (status: number, title: string, body: string, headers: Record<string, string> = {}): Answer => ({
  status,
  contentType: 'text/html; charset=UTF-8',
  headers,
  body: `<!DOCTYPE html><html lang="en-US"><head><title>${title}</title></head><body>${body}</body></html>`,
});

export const EDGE = {
  // A block page: a WAF rule's, or an IP or country block's.
  block403: () => page(403, 'Attention Required! | Cloudflare', '<h1>Sorry, you have been blocked</h1>'),
  // A Managed Challenge, which only a page load can pass.
  challenge403: () => page(403, 'Just a moment...', '<noscript>Enable JavaScript and cookies to continue</noscript>', { 'cf-mitigated': 'challenge' }),
  // Cloudflare's own 5xx page.
  cf522: () => page(522, 'stellarbladeguide.com | 522: Connection timed out', '<h1>Connection timed out</h1><p>Error code 522</p>'),
  // A 200 whose body isn't JSON, as a middlebox's page would be.
  html200: () => page(200, 'Just a moment...', '<p>One moment.</p>'),
  // A 404 from something in front of the API, such as a platform misroute.
  html404: () => page(404, '404 Not Found', '<h1>Not Found</h1>'),
};
