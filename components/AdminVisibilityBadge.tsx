'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { setItemVisibility } from '@/actions/visibility'

type Table = 'memories' | 'letters' | 'bucket_list' | 'date_invitations'

/**
 * Self-contained, admin-only toggle. Renders nothing for non-admins.
 * Drop this into any memory / letter / bucket-list item / date invite
 * card to let an admin hide or show that specific item from the
 * 'viewer' role, without touching what editors/admins see.
 */
export default function AdminVisibilityBadge({
  table,
  id,
  initialHidden,
}: {
  table: Table
  id: string
  initialHidden: boolean
}) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [hidden, setHidden] = useState(initialHidden)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let active = true
    const supabase = createClient()

    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      const role = (data as { role?: string } | null)?.role
      if (active && role === 'admin') setIsAdmin(true)
    }

    checkAdmin()
    return () => {
      active = false
    }
  }, [])

  if (!isAdmin) return null

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = !hidden
    setHidden(next)
    setPending(true)
    const result = await setItemVisibility(table, id, next)
    setPending(false)
    if (result?.error) setHidden(!next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      title={
        hidden
          ? 'Hidden from the viewer role — click to make visible'
          : 'Visible to the viewer role — click to hide'
      }
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold transition disabled:opacity-50 ${
        hidden
          ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
      }`}
    >
      <span aria-hidden>{hidden ? '🙈' : '👁️'}</span>
      {hidden ? 'Hidden' : 'Visible'}
    </button>
  )
}
