'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createLetter, updateLetter, deleteLetter, unlockLetter } from '@/actions/letters'
import type { LetterFormData } from '@/actions/letters'
import { useCanEdit } from '@/hooks/useCanEdit'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  unlock_date: z.string().optional().nullable(),
  locked: z.boolean().default(true),
})

type Letter = {
  id: string
  title: string
  content: string | null
  locked: boolean
  unlock_date?: string | null
  created_at: string
}

type ActionResult = { data?: Letter; error?: string }
type DeleteResult = { success?: boolean; error?: string }

export default function LettersClient({ initialLetters }: { initialLetters: Letter[] }) {
  const canEdit = useCanEdit()
  const [letters, setLetters] = useState<Letter[]>(initialLetters)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [openLetterId, setOpenLetterId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LetterFormData>({
    resolver: zodResolver(schema),
    defaultValues: { locked: true },
  })

  const startEdit = (letter: Letter) => {
    setEditingId(letter.id)
    setValue('title', letter.title)
    setValue('content', letter.content ?? '')
    setValue('unlock_date', letter.unlock_date ?? '')
    setValue('locked', letter.locked)
    setShowForm(true)
    setError(null)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    reset({ title: '', content: '', unlock_date: '', locked: true })
    setError(null)
  }

  const onSubmit = async (data: LetterFormData) => {
    setSubmitting(true)
    setError(null)

    if (editingId) {
      const result = (await updateLetter(editingId, data)) as ActionResult
      setSubmitting(false)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.data) {
        setLetters((prev) => prev.map((l) => (l.id === editingId ? { ...l, ...result.data } : l)))
        cancelForm()
      }
    } else {
      const result = (await createLetter(data)) as ActionResult
      setSubmitting(false)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.data) {
        setLetters((prev) => [result.data!, ...prev])
        cancelForm()
      }
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (!window.confirm('Delete this letter? This cannot be undone.')) return
    setDeletingId(id)
    setError(null)
    const result = (await deleteLetter(id)) as DeleteResult
    setDeletingId(null)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.success) {
      setLetters((prev) => prev.filter((l) => l.id !== id))
      if (openLetterId === id) setOpenLetterId(null)
    }
  }

  const handleUnlock = async (id: string) => {
    setError(null)
    const result = (await unlockLetter(id)) as ActionResult
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.data) {
      setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, locked: false } : l)))
    }
  }

  const canOpen = (letter: Letter) => {
    if (!letter.locked) return true
    if (!letter.unlock_date) return false
    return new Date(letter.unlock_date) <= new Date()
  }

  return (
    <div className="space-y-8">
      {canEdit && (
        <div className="text-center">
          <motion.button
            onClick={() => {
              setError(null)
              if (showForm) cancelForm()
              else setShowForm(true)
            }}
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            {showForm ? '✕ Cancel' : '✍️ Write a Letter'}
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
              {editingId ? 'Edit Letter ✏️' : 'A letter for when... 💌'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-peony-deep/70 mb-1">Open When...</label>
                <input type="text" placeholder="you need a hug, you miss me..." {...register('title')} className="input-field" />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-peony-deep/70 mb-1">The letter</label>
                <textarea rows={6} placeholder="My darling..." {...register('content')} className="input-field resize-none" />
                {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-peony-deep/70 mb-1">Unlock date (optional)</label>
                <input type="date" {...register('unlock_date')} className="input-field" />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="locked" {...register('locked')} className="w-4 h-4 accent-peony-dark" />
                <label htmlFor="locked" className="text-sm text-peony-deep/70">Keep locked until unlock date</label>
              </div>

              <motion.button type="submit" disabled={submitting} className="btn-primary w-full" whileTap={{ scale: 0.97 }}>
                {editingId
                  ? submitting ? 'Saving...' : 'Save Changes ✓'
                  : submitting ? 'Saving...' : 'Seal the Letter 💌'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {letters.length === 0 ? (
        <div className="text-center py-16 text-peony-deep/40">
          <div className="text-5xl mb-4">📝</div>
          <p className="font-serif text-lg">No letters yet — write the first one</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {letters.map((letter, i) => (
            <motion.div
              key={letter.id}
              className="card cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => {
                if (!letter.locked) {
                  setOpenLetterId(openLetterId === letter.id ? null : letter.id)
                }
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-serif text-peony-deep font-semibold">
                  Open When {letter.title}
                </h3>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <span className="text-xl">{letter.locked ? '🔒' : '💌'}</span>
                  {canEdit && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEdit(letter)
                        }}
                        className="px-2 py-1 rounded-lg bg-peony-light/50 text-peony-deep text-xs hover:bg-peony-light transition"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, letter.id)}
                        disabled={deletingId === letter.id}
                        className="px-2 py-1 rounded-lg bg-red-50 text-red-400 text-xs hover:bg-red-100 transition disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === letter.id ? '...' : '✕'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {openLetterId === letter.id && !letter.locked && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-peony-deep/80 leading-relaxed italic border-t border-peony-light/40 pt-3 mt-3 whitespace-pre-wrap">
                      {letter.content}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {letter.locked && (
                <div className="mt-3">
                  {letter.unlock_date && (
                    <p className="text-xs text-peony-deep/50 mb-2">
                      Unlocks: {new Date(letter.unlock_date).toLocaleDateString()}
                    </p>
                  )}

                  {canOpen(letter) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnlock(letter.id)
                      }}
                      className="text-xs bg-peony-light/60 text-peony-deep px-3 py-1.5 rounded-full hover:bg-peony-light transition"
                    >
                      🔓 Open Now
                    </button>
                  )}
                </div>
              )}

              <p className="text-xs text-peony-deep/40 mt-3">
                {new Date(letter.created_at).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
