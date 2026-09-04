'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin, dbError, type ActionResult } from '@/lib/authz'

const ALLOWED_TABLES = ['memories', 'letters', 'bucket_list', 'date_invitations'] as const
type AllowedTable = (typeof ALLOWED_TABLES)[number]

/**
 * Toggle whether a single memory / letter / bucket-list item / date invite is
 * visible to the 'viewer' (default) role. Editors and admins always see
 * everything regardless of this flag. Admin-only.
 */
export async function setItemVisibility(table: AllowedTable, id: string, hidden: boolean): Promise<ActionResult<any>> {
  if (!ALLOWED_TABLES.includes(table)) {
    return { error: 'Invalid table' }
  }

  const { error: authError, caller } = await assertAdmin()
  if (authError || !caller) return { error: authError }

  const { error } = await (caller.supabase.from(table) as any)
    .update({ hidden_from_viewer: hidden })
    .eq('id', id)

  if (error) return dbError('setItemVisibility', error)

  revalidatePath('/memories')
  revalidatePath('/letters')
  revalidatePath('/bucket-list')
  revalidatePath('/together')
  revalidatePath('/admin')

  return { success: true }
}

export type ModerationItem = {
  table: AllowedTable
  label: string
  id: string
  title: string
  hidden_from_viewer: boolean
  created_at: string | null
}

function pickTitle(row: Record<string, any>): string {
  return (
    row.title ??
    row.name ??
    row.note ??
    row.item ??
    row.description ??
    row.message ??
    'Untitled'
  ).toString().slice(0, 80)
}

/**
 * Pulls every row from every content table (id, a best-effort display title,
 * hidden_from_viewer) so the admin "Content visibility" panel can list
 * everything in one place, regardless of each table's exact column layout.
 * Admin-only.
 */
export async function listAllContentForModeration() {
  const { error: authError, caller } = await assertAdmin()
  if (authError || !caller) return { error: authError, items: [] as ModerationItem[] }

  const items: ModerationItem[] = []
  const tables: { table: AllowedTable; label: string }[] = [
    { table: 'memories', label: 'Memory' },
    { table: 'letters', label: 'Letter' },
    { table: 'bucket_list', label: 'Bucket list item' },
    { table: 'date_invitations', label: 'Date invite' },
  ]

  for (const { table, label } of tables) {
    const { data, error } = await (caller.supabase.from(table) as any)
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) continue

    for (const row of data as Record<string, any>[]) {
      items.push({
        table,
        label,
        id: row.id,
        title: pickTitle(row),
        hidden_from_viewer: !!row.hidden_from_viewer,
        created_at: row.created_at ?? null,
      })
    }
  }

  return { error: null, items }
}
