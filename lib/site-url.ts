/**
 * Absolute base URL for links in outbound email.
 *
 * `NEXT_PUBLIC_APP_URL` is not set in Vercel, so this used to fall back to a
 * hardcoded domain that does not serve the app. Vercel injects
 * `VERCEL_PROJECT_PRODUCTION_URL` (host only, no scheme) automatically, which
 * is correct without anyone having to remember to configure it.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL
  if (explicit) return explicit.replace(/\/+$/, '')

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelHost) return `https://${vercelHost}`

  return 'http://localhost:3000'
}
