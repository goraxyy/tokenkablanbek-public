'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createInvitation, updateInvitation, deleteInvitation, updateInvitationStatus } from '@/actions/invite'
import type { InviteFormData } from '@/actions/invite'
import { useCanEdit } from '@/hooks/useCanEdit'

const schema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(1, 'Location is required'),
  note: z.string().optional(),
  recipient_email: z.string().email().optional().or(z.literal('')),
})

type Invitation = {
  id: string
  date: string
  time: string
  location: string
  note?: string | null
  status: string
  created_at: string
}

type ActionResult = { data?: Invitation; error?: string }
type DeleteResult = { success?: boolean; error?: string }

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-yellow-100 text-yellow-700', label: '⏳ Pending' },
  accepted: { color: 'bg-green-100 text-green-700', label: '✓ Accepted' },
  declined: { color: 'bg-red-100 text-red-700', label: '✕ Declined' },
  went: { color: 'bg-purple-100 text-purple-700', label: '💜 Went on date!' },
}

export default function InviteClient({ initialInvitations }: { initialInvitations: Invitation[] }) {
  const canEdit = useCanEdit()
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<InviteFormData>({
    resolver: zodResolver(schema),
  })

  const startEdit = (inv: Invitation) => {
    setEditingId(inv.id)
    setValue('date', inv.date)
    setValue('time', inv.time)
    setValue('location', inv.location)
    setValue('note', inv.note ?? '')
    setShowForm(true)
    setError(null)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    reset()
    setError(null)
  }

  const onSubmit = async (data: InviteFormData) => {
    setSubmitting(true)
    setSuccess(false)
    setError(null)

    if (editingId) {
      const result = (await updateInvitation(editingId, data)) as ActionResult
      setSubmitting(false)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.data) {
        setInvitations((prev) => prev.map((inv) => (inv.id === editingId ? { ...inv, ...result.data } : inv)))
        cancelForm()
      }
    } else {
      const result = (await createInvitation(data)) as ActionResult
      setSubmitting(false)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.data) {
        setInvitations((prev) => [result.data!, ...prev])
        setSuccess(true)
        reset()
        setTimeout(() => {
          setSuccess(false)
          setShowForm(false)
        }, 2000)
      }
    }
  }

  const handleStatusUpdate = async (id: string, status: 'accepted' | 'declined' | 'went') => {
    setError(null)
    const result = (await updateInvitationStatus(id, status)) as ActionResult
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.data) {
      setInvitations((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status } : inv)))
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (!window.confirm('Delete this invitation?')) return
    setDeletingId(id)
    setError(null)
    const result = (await deleteInvitation(id)) as DeleteResult
    setDeletingId(null)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.success) {
      setInvitations((prev) => prev.filter((inv) => inv.id !== id))
    }
  }

  return (
    <div className="space-y-8">
      {canEdit && (
        <div className="text-center">
          <motion.button
            onClick={() => {
              if (showForm && !editingId) cancelForm()
              else {
                cancelForm()
                setShowForm(true)
              }
            }}
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            {showForm ? '✕ Cancel' : '✨ Plan a Date'}
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
              {editingId ? 'Edit Date Invitation ✏️' : 'Create a Date Invitation 🌸'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-peony-deep/70 mb-1">Date</label>
                <input type="date" {...register('date')} className="input-field" />
                {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-peony-deep/70 mb-1">Time</label>
                <input type="time" {...register('time')} className="input-field" />
                {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-peony-deep/70 mb-1">Location</label>
                <input type="text" placeholder="Where are we going?" {...register('location')} className="input-field" />
                {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-peony-deep/70 mb-1">A little message 💕</label>
                <textarea rows={3} placeholder="Something sweet..." {...register('note')} className="input-field resize-none" />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-peony-deep/70 mb-1">Send to email (optional)</label>
                  <input type="email" placeholder="her@email.com" {...register('recipient_email')} className="input-field" />
                  {errors.recipient_email && <p className="text-red-400 text-xs mt-1">{errors.recipient_email.message}</p>}
                </div>
              )}
              <motion.button type="submit" disabled={submitting} className="btn-primary w-full" whileTap={{ scale: 0.97 }}>
                {editingId
                  ? submitting ? 'Saving...' : 'Save Changes ✓'
                  : success ? '✓ Sent!' : submitting ? 'Sending...' : 'Send Invitation 💌'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {invitations.length === 0 ? (
        <div className="text-center py-16 text-peony-deep/40">
          <div className="text-5xl mb-4">💌</div>
          <p className="font-serif text-lg">No date plans yet — create the first one!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {invitations.map((inv, i) => {
            const cfg = statusConfig[inv.status] ?? { color: 'bg-gray-100 text-gray-600', label: inv.status }
            return (
              <motion.div key={inv.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${cfg.color}`}>{cfg.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-peony-deep/40">{new Date(inv.created_at).toLocaleDateString()}</span>
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            startEdit(inv)
                          }}
                          className="ml-1 px-2 py-1 rounded-lg bg-peony-light/50 text-peony-deep text-xs hover:bg-peony-light transition"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, inv.id)}
                          disabled={deletingId === inv.id}
                          className="px-2 py-1 rounded-lg bg-red-50 text-red-400 text-xs hover:bg-red-100 transition disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === inv.id ? '...' : '✕'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-peony-deep/80">
                  <div className="flex items-center gap-2"><span>📅</span><span>{inv.date}</span></div>
                  <div className="flex items-center gap-2"><span>⏰</span><span>{inv.time}</span></div>
                  <div className="flex items-center gap-2"><span>📍</span><span>{inv.location}</span></div>
                  {inv.note && <div className="flex items-start gap-2"><span>💕</span><span className="italic">{inv.note}</span></div>}
                </div>

                {inv.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <button type="button" onClick={() => handleStatusUpdate(inv.id, 'accepted')} className="flex-1 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200 transition">✓ Accept</button>
                    <button type="button" onClick={() => handleStatusUpdate(inv.id, 'declined')} className="flex-1 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition">✕ Decline</button>
                  </div>
                )}
                {inv.status === 'accepted' && (
                  <div className="mt-4">
                    <button type="button" onClick={() => handleStatusUpdate(inv.id, 'went')} className="w-full py-1.5 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold hover:bg-purple-200 transition">💜 We went on this date!</button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
