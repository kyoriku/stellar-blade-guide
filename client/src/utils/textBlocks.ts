export type TextBlock = { kind: 'paragraph'; text: string } | { kind: 'list'; items: string[] };

// How walkthrough and collectible text is laid out: blank lines separate blocks, and a
// block of two or more lines that all start with "- " is a list (its items without the
// "- "). Anything else is a paragraph, newlines and all. text_blocks in
// server/app/services/search_text.py is the same rule, and both pin the same cases.
export function textBlocks(text: string): TextBlock[] {
  return text.split('\n\n').map((block): TextBlock => {
    const lines = block.split('\n');
    return lines.length > 1 && lines.every((line) => line.startsWith('- '))
      ? { kind: 'list', items: lines.map((line) => line.slice(2)) }
      : { kind: 'paragraph', text: block };
  });
}
