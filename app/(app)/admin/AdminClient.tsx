'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  updateUserRole,
  toggleBan,
  approveUser,
  declineUser,
} from '@/actions/admin'

type UserRole = {
  user_id: string
  role: string
  banned: boolean
  requires_approval: boolean
  approved: boolean
  created_at?: string
  name?: string | null
  email?: string | null
}

export default function AdminClient({ roles }: { roles: UserRole[] }) {
  const [users, setUsers] = useState<UserRole[]>(roles)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const pending = users.filter((u) => u.role === 'guest' && u.requires_approval && !u.approved)
  const everyoneElse = users.filter((u) => !(u.role === 'guest' && u.requires_approval && !u.approved))

  const handleApprove = async (userId: string) => {
    setBusyId(userId)
    setError(null)
    const result = await approveUser(userId)
    setBusyId(null)
    if (result.error) {
      setError(result.error)
      return
    }
    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, role: 'editor', approved: true, requires_approval: false } : u))
    )
  }

  const handleDecline = async (userId: string) => {
    setBusyId(userId)
    setError(null)
    const result = await declineUser(userId)
    setBusyId(null)
    if (result.error) {
      setError(result.error)
      return
    }
    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, role: 'viewer', approved: true, requires_approval: false } : u))
    )
  }

  const handleRoleChange = async (userId: string, role: string) => {
    setError(null)
    const result = await updateUserRole(userId, role)
    if (result.error) {
      setError(result.error)
      return
    }
    setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, role, requires_approval: false } : u)))
  }

  const handleBanToggle = async (userId: string, banned: boolean) => {
    setError(null)
    const result = await toggleBan(userId, !banned)
    if (result.error) {
      setError(result.error)
      return
    }
    setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, banned: !banned } : u)))
  }

  return (
    <div className="space-y-10">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <section>
        <h2 className="font-serif text-lg font-semibold text-peony-deep mb-3">
          Pending requests {pending.length > 0 && `(${pending.length})`}
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-peony-deep/50">No new sign-ups waiting for review.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((u) => (
              <motion.div
                key={u.user_id}
                className="glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl px-4 py-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div>
                  <p className="text-sm font-medium text-peony-deep">{u.name ?? u.email ?? 'Unknown user'}</p>
                  <p className="text-xs font-mono text-peony-deep/50 break-all">{u.email ?? u.user_id}</p>
                  {u.created_at && (
                    <p className="text-xs text-peony-deep/40">
                      Requested {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === u.user_id}
                    onClick={() => handleApprove(u.user_id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition disabled:opacity-50"
                  >
                    ✓ Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === u.user_id}
                    onClick={() => handleDecline(u.user_id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-rose-100 text-rose-600 hover:bg-rose-200 transition disabled:opacity-50"
                  >
                    ✕ Decline → Viewer
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-lg font-semibold text-peony-deep mb-3">All users</h2>
        {everyoneElse.length === 0 ? (
          <p className="text-sm text-peony-deep/50">No other users yet.</p>
        ) : (
          <div className="space-y-3">
            {everyoneElse.map((u) => (
              <div
                key={u.user_id}
                className="glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-peony-deep">{u.name ?? u.email ?? 'Unknown user'}</p>
                  <p className="text-xs font-mono text-peony-deep/50 break-all">{u.email ?? u.user_id}</p>
                  <div className="flex gap-2 mt-1">
                    {u.banned && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Banned</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                    className="text-xs rounded-lg border border-peony/30 bg-white px-2 py-1.5 text-peony-deep focus:outline-none focus:ring-2 focus:ring-peony/30"
                  >
                    <option value="guest">🚪 Guest (pending only)</option>
                    <option value="viewer">👁️ Viewer (read-only)</option>
                    <option value="editor">✏️ Editor (full access)</option>
                    <option value="admin">🛡️ Admin (full control)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleBanToggle(u.user_id, u.banned)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                      u.banned
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                    }`}
                  >
                    {u.banned ? '✓ Unban' : '🚫 Ban'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
