/**
 * Escapes a value for interpolation into an HTML document.
 *
 * Used for outbound transactional email: those bodies are built by string
 * concatenation (no JSX auto-escaping), and the values come from user input,
 * so unescaped text lets a sender inject arbitrary markup into a message that
 * is delivered from our own verified domain.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
