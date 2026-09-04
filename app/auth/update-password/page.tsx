'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(12, 'Use at least 12 characters')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a digit'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type PasswordForm = z.infer<typeof passwordSchema>

export default function UpdatePasswordPage() {
  const [ready, setReady] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  // /auth/callback exchanged the emailed code for a session before redirecting
  // here. No session means the link was already used, expired, or tampered
  // with - don't render the form.
  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (active) setReady(!!data.user)
    })
    return () => {
      active = false
    }
  }, [supabase])

  const onSubmit = async (data: PasswordForm) => {
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password: data.password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Drop the recovery session so the new password has to be used at least
    // once, and any other session opened from the same link is not left live.
    await supabase.auth.signOut()
    setDone(true)
    setLoading(false)
  }

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-peony-light via-cream to-blush flex items-center justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-[0_20px_80px_rgba(231,84,128,0.12)] p-8 md:p-10"
      >
        {children}
      </motion.div>
    </div>
  )

  if (ready === null) return shell(<p className="text-center text-sm text-peony-deep/50">Checking your link…</p>)

  if (done)
    return shell(
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="font-serif text-2xl text-peony-deep font-semibold mb-3">Password updated</h1>
        <p className="text-sm text-peony-deep/70 leading-relaxed">You can sign in with your new password now.</p>
        <a href="/auth" className="mt-6 inline-block text-sm text-peony-deep underline hover:no-underline">
          Go to sign in
        </a>
      </div>
    )

  if (!ready)
    return shell(
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="font-serif text-2xl text-peony-deep font-semibold mb-3">This link is no longer valid</h1>
        <p className="text-sm text-peony-deep/70 leading-relaxed">
          Reset links can only be used once and expire quickly. Request a new one to continue.
        </p>
        <a href="/auth/reset" className="mt-6 inline-block text-sm text-peony-deep underline hover:no-underline">
          Send a new link
        </a>
      </div>
    )

  return shell(
    <>
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl text-peony-deep">Set a new password</h1>
        <p className="text-sm text-peony-deep/70 mt-2">Choose something you don&apos;t use anywhere else</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-peony-deep mb-2">New password</label>
          <input
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className="w-full rounded-2xl border border-peony/20 bg-white/80 px-4 py-3 text-sm text-peony-deep outline-none focus:border-peony focus:ring-2 focus:ring-peony/20 transition"
            placeholder="••••••••••••"
          />
          {errors.password && <p className="mt-2 text-xs text-rose-500">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-peony-deep mb-2">Confirm password</label>
          <input
            type="password"
            autoComplete="new-password"
            {...register('confirm')}
            className="w-full rounded-2xl border border-peony/20 bg-white/80 px-4 py-3 text-sm text-peony-deep outline-none focus:border-peony focus:ring-2 focus:ring-peony/20 transition"
            placeholder="••••••••••••"
          />
          {errors.confirm && <p className="mt-2 text-xs text-rose-500">{errors.confirm.message}</p>}
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">{error}</div>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-2xl bg-peony text-white py-3 text-sm font-medium shadow-lg shadow-peony/20 hover:bg-peony-deep transition disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving…' : 'Update password'}
        </motion.button>
      </form>
    </>
  )
}
