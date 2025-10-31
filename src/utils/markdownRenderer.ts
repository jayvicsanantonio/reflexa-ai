/**
 * Simple markdown renderer for converting markdown text to HTML
 * Handles common markdown patterns like bold, italic, lists, etc.
 */

/**
 * Convert markdown text to HTML
 * @param markdown - Markdown text to convert
 * @returns HTML string
 */
export function renderMarkdown(markdown: string): string {
  let html = markdown;

  // Remove markdown headings (##, ###, etc.) - just keep the text
  html = html.replace(/^#{1,6}\s+/gm, '');

  // Remove list markers (* or - at start of line)
  html = html.replace(/^[*-]\s+/gm, '');

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_ (but not list markers)
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Code: `code`
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

/**
 * Convert markdown array (like bullet points) to HTML list
 * @param items - Array of markdown strings
 * @param ordered - Whether to use ordered list (ol) or unordered (ul)
 * @returns HTML string
 */
export function renderMarkdownList(items: string[], ordered = false): string {
  const tag = ordered ? 'ol' : 'ul';
  const listItems = items
    .map((item) => `<li>${renderMarkdown(item)}</li>`)
    .join('');
  return `<${tag}>${listItems}</${tag}>`;
}
