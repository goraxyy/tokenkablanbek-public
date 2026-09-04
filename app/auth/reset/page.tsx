'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const resetSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

type ResetForm = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })

  const onSubmit = async (data: ResetForm) => {
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    })

    if (error) console.error('[auth/reset]', error.message)

    // Always report success. Saying "no account with that email" turns this
    // form into an oracle for which addresses are registered.
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-peony-light via-cream to-blush flex items-center justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-[0_20px_80px_rgba(231,84,128,0.12)] p-8 md:p-10"
      >
        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">💌</div>
            <h1 className="font-serif text-2xl text-peony-deep font-semibold mb-3">Check your email</h1>
            <p className="text-sm text-peony-deep/70 leading-relaxed">
              If an account exists for that address, a link to set a new password is on its way.
              The link expires shortly, so use it soon.
            </p>
            <Link href="/auth" className="mt-6 inline-block text-sm text-peony-deep underline hover:no-underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl text-peony-deep">Reset password</h1>
              <p className="text-sm text-peony-deep/70 mt-2">We&apos;ll email you a link to set a new one</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-peony-deep mb-2">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full rounded-2xl border border-peony/20 bg-white/80 px-4 py-3 text-sm text-peony-deep outline-none focus:border-peony focus:ring-2 focus:ring-peony/20 transition"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="mt-2 text-xs text-rose-500">{errors.email.message}</p>}
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-2xl bg-peony text-white py-3 text-sm font-medium shadow-lg shadow-peony/20 hover:bg-peony-deep transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth" className="text-peony-deep text-sm hover:underline transition">
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
