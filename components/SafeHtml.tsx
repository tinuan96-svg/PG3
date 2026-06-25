import { sanitizeHtml, isHtmlContent } from '@/lib/html-sanitize'

interface Props {
  html: string
  className?: string
  compact?: boolean
}

// Renders AI-generated HTML safely.
// - Sanitizes via whitelist (no external deps, SSR-safe)
// - Falls back to plain-text rendering when content has no HTML markup
// - Applies pg-prose typography classes
export default function SafeHtml({ html, className = '', compact = false }: Props) {
  if (!html?.trim()) return null

  const proseClass = compact ? 'pg-prose pg-prose-sm' : 'pg-prose'

  if (isHtmlContent(html)) {
    const clean = sanitizeHtml(html)
    return (
      <div
        className={`${proseClass} ${className}`}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    )
  }

  // Plain text — convert newlines to paragraphs
  const paragraphs = html.split(/\n{2,}/).filter(Boolean)
  if (paragraphs.length > 1) {
    return (
      <div className={`${proseClass} ${className}`}>
        {paragraphs.map((para, i) => (
          <p key={i}>{para.trim()}</p>
        ))}
      </div>
    )
  }

  return (
    <div className={`${proseClass} ${className}`}>
      <p style={{ whiteSpace: 'pre-wrap' }}>{html}</p>
    </div>
  )
}
