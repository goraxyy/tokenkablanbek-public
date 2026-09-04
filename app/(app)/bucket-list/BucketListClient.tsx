'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  createBucketItem,
  completeBucketItem,
  deleteBucketItem,
} from '@/actions/bucket'
import type { BucketFormData } from '@/actions/bucket'
import confetti from 'canvas-confetti'
import { useCanEdit } from '@/hooks/useCanEdit'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

type BucketItem = {
  id: string
  title: string
  description?: string | null
  completed: boolean
  completed_at?: string | null
  photo_url?: string | null
  created_at: string
}

type BucketActionResult = { data?: BucketItem; error?: string }
type CompleteBucketResult = {
  data?: { id?: string; photo_url?: string | null; completed?: boolean; completed_at?: string | null }
  error?: string
}
type DeleteBucketResult = { success?: boolean; error?: string }

export default function BucketListClient({ initialItems }: { initialItems: BucketItem[] }) {
  const canEdit = useCanEdit()
  const [items, setItems] = useState<BucketItem[]>(initialItems)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [completing, setCompleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BucketFormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: BucketFormData) => {
    setSubmitting(true)
    setError(null)

    const result = (await createBucketItem(data)) as BucketActionResult

    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.data) {
      setItems((prev) => [result.data!, ...prev])
      reset()
      setShowForm(false)
    }
  }

  const handleComplete = async (id: string) => {
    setCompleting(id)
    setError(null)

    const result = (await completeBucketItem(id)) as CompleteBucketResult

    setCompleting(null)

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.data) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                completed: true,
                completed_at: result.data?.completed_at ?? new Date().toISOString(),
                photo_url: result.data?.photo_url ?? it.photo_url ?? null,
              }
            : it
        )
      )

      confetti({
        particleCount: 360,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FFB3C6', '#FF85A1', '#E75480', '#FFD6E7'],
      })
    }
  }

  const handleDelete = async (id: string) => {
    setError(null)

    const result = (await deleteBucketItem(id)) as DeleteBucketResult

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.success) {
      setItems((prev) => prev.filter((it) => it.id !== id))
    }
  }

  const pending = items.filter((it) => !it.completed)
  const done = items.filter((it) => it.completed)

  return (
    <div className="space-y-8">
      {canEdit && (
        <div className="text-center">
          <motion.button
            onClick={() => {
              setError(null)
              setShowForm(!showForm)
            }}
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            {showForm ? '✕ Cancel' : '🌟 Add a Dream'}
          </motion.button>
        </div>
      )}

      {error && (
        <div className="max-w-lg mx-auto rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <AnimatePresence>
        {showForm && canEdit && (
          <motion.div className="card max-w-lg mx-auto" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <h2 className="font-serif text-xl text-peony-deep mb-6 text-center">
              Add to our bucket list ✨
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-peony-deep/70 mb-1">Dream</label>
                <input
                  type="text"
                  placeholder="See the Northern Lights together..."
                  {...register('title')}
                  className="input-field"
                />
                {errors.title && (
                  <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-peony-deep/70 mb-1">Details (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Where, how, why..."
                  {...register('description')}
                  className="input-field resize-none"
                />
              </div>

              <motion.button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full"
                whileTap={{ scale: 0.97 }}
              >
                {submitting ? 'Adding...' : 'Add Dream ✨'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <div className="text-center py-16 text-peony-deep/40">
          <div className="text-5xl mb-4">✨</div>
          <p className="font-serif text-lg">
            Your adventure list is empty — start dreaming!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <div>
              <h2 className="font-serif text-lg text-peony-deep mb-4">
                🌟 Dreams to fulfill ({pending.length})
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {pending.map((item, i) => (
                  <motion.div
                    key={item.id}
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    layout
                  >
                    <h3 className="font-serif text-peony-deep font-semibold mb-1">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-sm text-peony-deep/60 mb-3">
                        {item.description}
                      </p>
                    )}

                    {canEdit && (
                      <div className="flex gap-2 mt-3">
                        <motion.button
                          type="button"
                          onClick={() => handleComplete(item.id)}
                          disabled={completing === item.id}
                          className="flex-1 py-1.5 rounded-lg bg-peony-light/60 text-peony-deep text-xs font-semibold hover:bg-peony-light transition"
                          whileTap={{ scale: 0.97 }}
                        >
                          {completing === item.id
                            ? '✓ Marking...'
                            : '🎉 Mark Complete'}
                        </motion.button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-400 text-xs hover:bg-red-100 transition"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <h2 className="font-serif text-lg text-peony-deep mb-4">
                🎉 Done together ({done.length})
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {done.map((item, i) => (
                  <motion.div
                    key={item.id}
                    className="card opacity-80"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 0.85, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    {item.photo_url && (
                      <img
                        src={item.photo_url}
                        alt={item.title}
                        className="w-full h-36 object-cover rounded-xl mb-3"
                      />
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-lg">✅</span>
                      <h3 className="font-serif text-peony-deep font-semibold line-through opacity-70">
                        {item.title}
                      </h3>
                    </div>

                    {item.completed_at && (
                      <p className="text-xs text-peony-deep/40 mt-2">
                        Completed{' '}
                        {new Date(item.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
