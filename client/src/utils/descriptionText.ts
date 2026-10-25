import type { Collectible } from '../services/api';
import { textBlocks } from './textBlocks';

// Descriptions carry wikilinks, [[path#anchor|label]], which parseDescription
// renders as links. This is the pattern _strip_links uses in
// server/app/services/search.py for search snippets.
const WIKILINK = /\[\[[^\]|]+\|([^\]]+)\]\]/g;

// The text a reader sees: each link becomes its label.
export function stripLinks(text: string): string {
  return text.replace(WIKILINK, '$1');
}

// Text on one line, for places that show it as one: unchanged unless it holds a
// list; otherwise its blocks joined by a space (a paragraph's own newlines too)
// and each list's items by ", ". plain_text in server/app/services/search_text.py
// gives the same, case for case.
export function plainText(text: string): string {
  const blocks = textBlocks(text);
  if (!blocks.some((block) => block.kind === 'list')) return text;
  return blocks
    .map((block) => (block.kind === 'list' ? block.items.join(', ') : block.text.replace(/\n/g, ' ')))
    .join(' ');
}

// A description as plain text, for places that can't render links or lists (the
// JSON-LD ItemList on type and level pages).
export function descriptionPlainText(description?: Collectible['description']): string | undefined {
  const text = description?.content ? plainText(description.content) : description?.items?.join(', ');
  return text ? stripLinks(text) : undefined;
}
