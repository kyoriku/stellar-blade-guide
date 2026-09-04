import { WALKTHROUGHS } from '../constants/navigation';

// Mission-type display names for walkthrough head tags and headers. Known
// slugs resolve through navigation because those names carry punctuation
// ("NieR: Automata DLC") that title-casing a slug cannot reproduce; unknown
// types (e.g. the e2e fixture's mission type) fall back to a title-cased slug.
export function walkthroughTypeName(type: string): string {
  const known = WALKTHROUGHS.find(w => w.slug === type);
  if (known) return known.name;
  return type
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
