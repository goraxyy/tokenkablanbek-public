'use client'

import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

export default function BannedPage() {
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-peony-light to-blush px-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-card p-10 max-w-md text-center"
      >
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="font-serif text-2xl text-peony-deep font-semibold mb-3">
          Access suspended
        </h1>
        <p className="text-peony-deep/60 text-sm leading-relaxed">
          An admin has restricted this account, so it can&apos;t reach any page in
          the app right now - not even the pending-approval screen. This is
          separate from your role (guest, viewer, editor, or admin); a ban
          overrides all of them.
        </p>
        <p className="text-peony-deep/50 text-xs leading-relaxed mt-4">
          If you think this is a mistake, reach out to whoever manages this
          space and ask them to lift the ban from the admin panel.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-6 text-xs font-medium text-peony-deep underline hover:no-underline"
        >
          Sign out
        </button>
      </motion.div>
    </div>
  )
}
