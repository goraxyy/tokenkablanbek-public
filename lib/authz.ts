import { createClient } from '@/lib/supabase/server'

export type Role = 'guest' | 'viewer' | 'editor' | 'admin'

/** Roles allowed to create/update/delete content. */
const EDITOR_ROLES: readonly Role[] = ['editor', 'admin'] as const

export type Caller = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  role: Role
  banned: boolean
}

type Guard = { error: string; caller: null } | { error?: undefined; caller: Caller }

/**
 * Resolves the caller's identity and role.
 *
 * `middleware.ts` protects *page navigations*, but a Server Action is a POST
 * to whatever route the browser happens to be on - including public ones - so
 * middleware is not a reliable authorization boundary for actions. Every
 * action therefore re-checks here, and RLS remains the final backstop.
 *
 * Fails closed: an unreadable role row yields no privileges rather than
 * defaulting to a permissive role.
 */
export async function getCaller(): Promise<Guard> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated', caller: null }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role, banned')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[authz] role lookup failed:', error.message)
    return { error: 'Not authorized', caller: null }
  }

  const row = data as { role?: string; banned?: boolean } | null

  return {
    caller: {
      supabase,
      userId: user.id,
      role: (row?.role as Role) ?? 'guest',
      banned: row?.banned ?? false,
    },
  }
}

/** Signed in, not banned, and past the guest/pending stage. */
export async function assertCanRead(): Promise<Guard> {
  const { error, caller } = await getCaller()
  if (error || !caller) return { error: error ?? 'Not authorized', caller: null }

  if (caller.banned) return { error: 'Your account has been restricted', caller: null }
  if (caller.role === 'guest') return { error: 'Your account is awaiting approval', caller: null }

  return { caller }
}

/** Everything `assertCanRead` requires, plus an editor/admin role. */
export async function assertCanEdit(): Promise<Guard> {
  const { error, caller } = await assertCanRead()
  if (error || !caller) return { error: error ?? 'Not authorized', caller: null }

  if (!EDITOR_ROLES.includes(caller.role)) {
    return { error: 'You do not have permission to make changes', caller: null }
  }

  return { caller }
}

/** Admin-only operations. */
export async function assertAdmin(): Promise<Guard> {
  const { error, caller } = await assertCanRead()
  if (error || !caller) return { error: error ?? 'Not authorized', caller: null }

  if (caller.role !== 'admin') return { error: 'Admin access required', caller: null }

  return { caller }
}

/**
 * Logs the real database error server-side and returns a generic message.
 * Raw Postgres errors name tables, columns, constraints and policies, which
 * hands an attacker a free schema map.
 */
export function dbError(context: string, error: { message: string }) {
  console.error(`[db:${context}]`, error.message)
  return { error: 'Something went wrong. Please try again.' }
}

/**
 * Shared shape for Server Action results.
 *
 * Guards and `dbError` return `{ error }` while success paths return
 * `{ data }` or `{ success }`. Annotating actions with this keeps callers
 * able to read `result.error` instead of having to narrow a union at every
 * call site.
 */
export type ActionResult<T = unknown> = {
  error?: string
  warning?: string
  success?: boolean
  data?: T
}
