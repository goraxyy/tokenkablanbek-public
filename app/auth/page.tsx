'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const authSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type AuthForm = z.infer<typeof authSchema>

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
  })

  const onSubmit = async (data: AuthForm) => {
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        })

        if (error) throw error

        // If email confirmation is disabled in the Supabase project, signUp
        // returns a live session immediately and the new 'guest' account is
        // already signed in - send them straight to the pending screen.
        if (signUpData.session) {
          router.refresh()
          router.push('/pending-approval')
          return
        }

        setMessage('Check your email to confirm your account, then sign in.')
        setIsSignUp(false)
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error

      // Every successful login lands on the pending/status screen first.
      // Approved viewers/editors/admins are bounced onward to /memories
      // automatically by the middleware; guests stay on the pending screen.
      router.refresh()
      router.push('/pending-approval')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-peony-light via-cream to-blush flex items-center justify-center px-6 py-10">
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-peony/20"
            initial={{
              y: -20,
              x: `${10 + i * 10}%`,
              rotate: 0,
              opacity: 0,
            }}
            animate={{
              y: '110vh',
              rotate: 360,
              opacity: [0, 0.4, 0.2, 0],
              x: `calc(${10 + i * 10}% + ${i % 2 === 0 ? 20 : -20}px)`,
            }}
            transition={{
              duration: 10 + i,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 1.2,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-[0_20px_80px_rgba(231,84,128,0.12)] p-8 md:p-10"
      >
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-peony-deep">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-peony-deep/70 mt-2">
            {isSignUp ? 'Start your story' : 'Continue your story'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-peony-deep mb-2">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full rounded-2xl border border-peony/20 bg-white/80 px-4 py-3 text-sm text-peony-deep outline-none focus:border-peony focus:ring-2 focus:ring-peony/20 transition"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-2 text-xs text-rose-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-peony-deep mb-2">
              Password
            </label>
            <input
              type="password"
              {...register('password')}
              className="w-full rounded-2xl border border-peony/20 bg-white/80 px-4 py-3 text-sm text-peony-deep outline-none focus:border-peony focus:ring-2 focus:ring-peony/20 transition"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-2 text-xs text-rose-500">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-2xl bg-peony text-white py-3 text-sm font-medium shadow-lg shadow-peony/20 hover:bg-peony-deep transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setMessage(null)
            }}
            className="text-peony-deep text-sm hover:underline transition"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>

          {!isSignUp && (
            <div className="mt-3">
              <Link href="/auth/reset" className="text-peony-deep/60 text-xs hover:underline transition">
                Forgot your password?
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
