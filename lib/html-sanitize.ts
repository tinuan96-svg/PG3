// Whitelist-based HTML sanitizer.
//
// Works in both Node.js (SSR) and the browser — no DOM dependency.
// Strips all tag attributes (preventing onerror, onclick, style, href=javascript:)
// and removes all tags not in ALLOWED_TAGS.
//
// Content comes from our own AI system, but we still sanitize defensively.

const ALLOWED_TAGS = new Set([
  'p', 'h2', 'h3', 'h4', 'h5',
  'ul', 'ol', 'li',
  'strong', 'em', 'b', 'i', 'br',
  'span', 'div', 'blockquote',
])

export function sanitizeHtml(html: string): string {
  if (!html) return ''

  return html
    // Remove script/style blocks and their content entirely
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Process all remaining tags
    .replace(/<\/?[a-zA-Z][^>]*>/g, (tag) => {
      const nameMatch = tag.match(/^<\/?([a-zA-Z][a-zA-Z0-9]*)/)
      if (!nameMatch) return ''
      const tagName = nameMatch[1].toLowerCase()
      const isClosing = tag.startsWith('</')
      if (ALLOWED_TAGS.has(tagName)) {
        // Return clean tag with no attributes
        return isClosing ? `</${tagName}>` : `<${tagName}>`
      }
      // Disallowed tag: strip entirely but keep its text content
      return ''
    })
    .trim()
}

// Returns true if the string contains HTML markup.
export function isHtmlContent(text: string): boolean {
  return /<[a-zA-Z][\s\S]*>/i.test(text)
}
