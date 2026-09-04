'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Status = 'loading' | 'pending' | 'error'

export default function PendingApprovalPage() {
  const [status, setStatus] = useState<Status>('loading')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let active = true

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (active) router.push('/auth')
        return
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!active) return

      // The static copy below already explains what this state means. The
      // raw Postgres text (table, column and policy names) stays out of the
      // browser and goes to the console instead - this screen is reachable
      // by any unapproved signup.
      if (error) {
        console.error('[pending-approval] role lookup failed:', error.message)
        setStatus('error')
        return
      }

      const role = (data as { role?: string } | null)?.role ?? 'guest'

      if (role === 'guest') {
        setStatus('pending')
      } else {
        router.push('/memories')
      }
    }

    check()
    const interval = setInterval(check, 15000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // Force a hard navigation instead of router.push() so no stale
    // Router Cache state lingers after sign-out.
    window.location.href = '/auth'
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-peony-light to-blush px-4">
        <div className="text-peony-deep/50 text-sm">Checking your account…</div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-peony-light to-blush px-4">
        <div className="glass-card p-10 max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="font-serif text-2xl text-peony-deep font-semibold mb-3">
            Setup issue, not a review
          </h1>
          <p className="text-peony-deep/60 text-sm leading-relaxed">
            Your account can&apos;t be checked right now because of a database
            configuration problem, not because you&apos;re waiting for approval.
            Ask the admin to run the pending Supabase migrations.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 text-xs font-medium text-peony-deep underline hover:no-underline"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-peony-light to-blush px-4">
      <div className="glass-card p-10 max-w-md text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="font-serif text-2xl text-peony-deep font-semibold mb-3">
          Waiting for approval
        </h1>
        <p className="text-peony-deep/60 text-sm leading-relaxed">
          Your account is pending review by the admin. You&apos;ll get full read/write
          access as soon as it&apos;s approved, or read-only access if it&apos;s declined.
          This page checks automatically - no need to refresh.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-6 text-xs font-medium text-peony-deep underline hover:no-underline"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
