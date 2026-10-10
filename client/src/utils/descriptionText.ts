import type { Collectible } from '../services/api';

// Descriptions carry wikilinks, [[path#anchor|label]], which parseDescription
// renders as links. This is the pattern _strip_links uses in
// server/app/services/search.py for search snippets.
const WIKILINK = /\[\[[^\]|]+\|([^\]]+)\]\]/g;

// The text a reader sees: each link becomes its label.
export function stripLinks(text: string): string {
  return text.replace(WIKILINK, '$1');
}

// A description as plain text, for places that can't render links (the
// JSON-LD ItemList on type and level pages).
export function descriptionPlainText(description?: Collectible['description']): string | undefined {
  const text = description?.content || description?.items?.join(', ');
  return text ? stripLinks(text) : undefined;
}
