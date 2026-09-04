'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * True only for the 'editor' and 'admin' roles. 'guest' and 'viewer'
 * (and signed-out visitors) get false, so any UI gated on this hook
 * hides add/edit/delete controls for read-only accounts.
 */
export function useCanEdit() {
  const [canEdit, setCanEdit] = useState(false)

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

      const role = (data as { role?: string } | null)?.role
      if (active && (role === 'editor' || role === 'admin')) {
        setCanEdit(true)
      }
    }

    check()
    return () => {
      active = false
    }
  }, [])

  return canEdit
}
