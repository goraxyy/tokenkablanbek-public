import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that never require authentication.
const PUBLIC_PATHS = ['/', '/auth', '/banned', '/pending-approval']

// Password-recovery routes. A recovery link signs the user in before they
// reach /auth/update-password, so these have to stay reachable for signed-in
// users too - including guests, who would otherwise be bounced to the
// pending-approval screen and could never finish resetting their password.
const AUTH_FLOW_PATHS = ['/auth/reset', '/auth/callback', '/auth/update-password']

function isAuthFlowPath(pathname: string) {
  return AUTH_FLOW_PATHS.includes(pathname)
}

// Route prefixes that live inside the authenticated app shell.
const PROTECTED_PREFIXES = [
  '/memories',
  '/letters',
  '/bucket-list',
  '/together',
  '/invite',
  '/admin',
]

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // --- 1. No session: only public routes (landing + login + pending + banned) are reachable. ---
  if (!user) {
    if (isProtectedPath(pathname)) {
      // No `next` parameter: sign-in always routes through /pending-approval,
      // which forwards approved users on. An unused redirect parameter is a
      // gadget waiting to be wired up carelessly.
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // --- 2. We have a session: look up the caller's role/ban/approval state. ---
  const { data: roleRow, error: roleError } = await supabase
    .from('user_roles')
    .select('role, banned, requires_approval, approved')
    .eq('user_id', user.id)
    .maybeSingle()

  // A role-lookup failure (e.g. a Supabase migration/RLS problem on the
  // project) is treated the same as "not yet reviewed" - it blocks access
  // to protected content instead of silently letting everyone through.
  // The pending-approval page runs the same query client-side and will
  // surface the actual error message so it's obviously a setup problem
  // and not a real pending review.
  const role = roleError ? 'guest' : (roleRow as { role?: string } | null)?.role ?? 'guest'
  const banned = roleError ? false : (roleRow as { banned?: boolean } | null)?.banned ?? false

  // Banned users are always redirected to the ban screen, no matter what.
  if (banned) {
    if (isAuthFlowPath(pathname)) return supabaseResponse
    if (pathname !== '/banned') {
      const url = request.nextUrl.clone()
      url.pathname = '/banned'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Guests (brand-new signups awaiting review, or anyone whose role could
  // not be resolved) may only ever reach the pending-approval screen.
  // Everything else - including /auth, /memories, and /admin - bounces
  // them back there.
  if (role === 'guest') {
    if (pathname === '/pending-approval' || isAuthFlowPath(pathname)) {
      return supabaseResponse
    }
    const url = request.nextUrl.clone()
    url.pathname = '/pending-approval'
    return NextResponse.redirect(url)
  }

  // Already-reviewed users (viewer/editor/admin) shouldn't sit on the
  // login or pending screens once they're in.
  if ((pathname === '/auth' || pathname === '/pending-approval') && !isAuthFlowPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/memories'
    return NextResponse.redirect(url)
  }

  // Only admins may reach the admin dashboard.
  if (pathname.startsWith('/admin') && role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/memories'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
