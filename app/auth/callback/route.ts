import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Exchanges the one-time `code` on a Supabase email link (password recovery,
 * email confirmation) for a session, then forwards to `next`.
 *
 * `next` is deliberately restricted to a fixed set of in-app paths. Echoing an
 * arbitrary caller-supplied path back into a redirect is how an open redirect
 * gets built, and this endpoint is reachable from a link in an email.
 */
const ALLOWED_NEXT = new Set(['/auth/update-password', '/pending-approval', '/memories'])

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const requested = searchParams.get('next')
  const next = requested && ALLOWED_NEXT.has(requested) ? requested : '/pending-approval'

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] code exchange failed:', error.message)
    return NextResponse.redirect(`${origin}/auth?error=invalid_link`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
