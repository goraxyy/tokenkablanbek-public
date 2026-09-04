'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin, dbError, type ActionResult } from '@/lib/authz'

export type UserRoleRow = {
  user_id: string
  role: string
  banned: boolean
  requires_approval: boolean
  approved: boolean
  created_at?: string
  updated_at?: string
  name?: string | null
  email?: string | null
}

/**
 * Admin-only: list every row in user_roles for the admin dashboard.
 * Deliberately avoids embedding a `profiles` relationship - there is no
 * foreign key between user_roles and profiles, so a PostgREST nested
 * select (`profiles(name,email)`) throws a "could not find relationship"
 * error at request time. That crash is what made the admin page fail to
 * open at all.
 */
export async function listUserRoles() {
  const { error: authError, caller } = await assertAdmin()
  if (authError || !caller) return { error: authError, users: [] as UserRoleRow[] }

  const { data, error } = await caller.supabase
    .from('user_roles')
    .select('user_id, role, banned, requires_approval, approved, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) return { ...dbError('listUserRoles', error), users: [] as UserRoleRow[] }

  const roles = (data ?? []) as UserRoleRow[]

  // Fetched separately rather than as a PostgREST embed: there is no foreign
  // key between user_roles and profiles, so a nested select throws
  // "could not find relationship" at request time.
  const { data: profiles, error: profileError } = await caller.supabase
    .from('profiles')
    .select('id, name, email')
    .in('id', roles.map((r) => r.user_id))

  if (profileError) {
    console.error('[db:listUserRoles:profiles]', profileError.message)
    return { error: null, users: roles }
  }

  const byId = new Map(
    ((profiles ?? []) as Array<{ id: string; name: string | null; email: string | null }>).map((p) => [p.id, p])
  )

  return {
    error: null,
    users: roles.map((r) => ({
      ...r,
      name: byId.get(r.user_id)?.name ?? null,
      email: byId.get(r.user_id)?.email ?? null,
    })),
  }
}

export async function upsertUserRole(
  userId: string,
  data: { role?: string; banned?: boolean; requires_approval?: boolean; approved?: boolean }
): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertAdmin()
  if (authError || !caller) return { error: authError }

  const { error } = await (caller.supabase.from('user_roles') as any)
    .update(data as Record<string, unknown>)
    .eq('user_id', userId)

  if (error) return dbError('admin', error)

  revalidatePath('/admin')
  return { success: true }
}

export async function toggleBan(userId: string, banned: boolean): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertAdmin()
  if (authError || !caller) return { error: authError }

  const { error } = await (caller.supabase.from('user_roles') as any).update({ banned }).eq('user_id', userId)
  if (error) return dbError('admin', error)

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Used by AdminClient's role <select>. Sets a user's role directly
 * (guest / viewer / editor / admin).
 */
export async function updateUserRole(userId: string, role: string): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertAdmin()
  if (authError || !caller) return { error: authError }

  const { error } = await (caller.supabase.from('user_roles') as any).update({ role }).eq('user_id', userId)
  if (error) return dbError('admin', error)

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Used by AdminClient's "Awaiting approval" / "Approved" badge toggle.
 * Flips the approved flag directly.
 */
export async function toggleApproval(userId: string, approved: boolean): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertAdmin()
  if (authError || !caller) return { error: authError }

  const { error } = await (caller.supabase.from('user_roles') as any)
    .update({ approved, requires_approval: false })
    .eq('user_id', userId)

  if (error) return dbError('admin', error)

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Admin approves a pending signup: promotes the user from 'guest' to
 * 'editor' with full read/write access.
 */
export async function approveUser(userId: string): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertAdmin()
  if (authError || !caller) return { error: authError }

  const { error } = await (caller.supabase.from('user_roles') as any)
    .update({ role: 'editor', approved: true, requires_approval: false })
    .eq('user_id', userId)

  if (error) return dbError('admin', error)

  revalidatePath('/admin')
  return { success: true }
}

/**
 * Admin declines a pending signup: the user moves from 'guest' to the
 * permanent 'viewer' role (read-only, limited visibility) and stops
 * showing up as "pending" in both the admin panel and their own
 * pending-approval screen.
 */
export async function declineUser(userId: string): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertAdmin()
  if (authError || !caller) return { error: authError }

  const { error } = await (caller.supabase.from('user_roles') as any)
    .update({ role: 'viewer', approved: true, requires_approval: false })
    .eq('user_id', userId)

  if (error) return dbError('admin', error)

  revalidatePath('/admin')
  return { success: true }
}
