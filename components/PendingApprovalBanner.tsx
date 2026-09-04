'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Shown on the memories page (and anywhere else it is mounted) right after a
 * new user logs in. New accounts start out with the 'default' (viewer) role:
 * they can browse, but everything is read-only until an admin reviews and
 * approves their request to become a 'main' (editor) collaborator.
 */
export default function PendingApprovalBanner() {
  const [status, setStatus] = useState<'loading' | 'pending' | 'none'>('loading')

  useEffect(() => {
    let active = true
    const supabase = createClient()

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (active) setStatus('none')
        return
      }

      const { data } = await supabase
        .from('user_roles')
        .select('requires_approval, approved, banned')
        .eq('user_id', user.id)
        .maybeSingle()

      const row = data as { requires_approval?: boolean; approved?: boolean; banned?: boolean } | null

      if (active) {
        setStatus(row?.requires_approval && !row?.approved && !row?.banned ? 'pending' : 'none')
      }
    }

    check()
    return () => {
      active = false
    }
  }, [])

  if (status !== 'pending') return null

  return (
    <div className="glass-card mb-6 flex items-start gap-3 rounded-2xl border border-peony-dark/20 bg-peony-light/60 p-4">
      <span className="text-2xl" aria-hidden>
        💌
      </span>
      <div>
        <p className="font-serif text-sm font-semibold text-peony-deep">
          Your request is being considered
        </p>
        <p className="mt-1 text-xs leading-relaxed text-peony-deep/70">
          You&apos;re browsing with the default role for now — everything is visible, but
          editing is off until an admin reviews your account. You&apos;ll get full access
          as soon as it&apos;s approved.
        </p>
      </div>
    </div>
  )
}
