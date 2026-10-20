const SITE_URL = 'https://stellarbladeguide.com';

// One step of a page's trail below Home: the name that page's h1 shows, and its
// canonical path.
export type Crumb = { name: string; path: string };

// A page's JSON-LD BreadcrumbList: Home, then the trail the page passes. The names
// come from the pages, never from the URL, which title-cased "A Gift for a Fishing
// Maniac" as "Gift For A Fishing Maniac".
export function breadcrumbList(trail: readonly Crumb[]) {
  const crumbs = [{ name: 'Home', path: '/' }, ...trail];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}
