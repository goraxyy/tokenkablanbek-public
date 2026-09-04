'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminVisibilityBadge from './AdminVisibilityBadge'

type Table = 'memories' | 'letters' | 'bucket_list' | 'date_invitations'

type Item = {
  id: string
  label: string
  hidden_from_viewer?: boolean | null
}

/**
 * Admin-only panel that lists every item on the current page with a
 * visible/invisible toggle for the 'viewer' role. Renders nothing for
 * non-admins. Safe to drop into any content page without touching that
 * page's existing card/list components.
 */
export default function AdminItemVisibilityPanel({
  table,
  items,
}: {
  table: Table
  items: Item[]
}) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let active = true
    const supabase = createClient()

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (active && (data as { role?: string } | null)?.role === 'admin') {
        setIsAdmin(true)
      }
    }

    check()
    return () => {
      active = false
    }
  }, [])

  if (!isAdmin || items.length === 0) return null

  return (
    <div className="max-w-4xl mx-auto mb-8 rounded-2xl border border-peony/20 bg-white/50 backdrop-blur-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-peony-deep hover:bg-white/40 transition"
      >
        <span>🛡️ Admin: control what the viewer role sees ({items.length})</span>
        <span className="text-xs">{open ? '▲ hide' : '▼ show'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-2 max-h-80 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2"
            >
              <span className="truncate text-sm text-peony-deep">{item.label}</span>
              <AdminVisibilityBadge
                table={table}
                id={item.id}
                initialHidden={!!item.hidden_from_viewer}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
