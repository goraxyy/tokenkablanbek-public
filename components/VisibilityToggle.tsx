'use client'

import { useState, useTransition } from 'react'
import { setItemVisibility } from '@/actions/visibility'

type Table = 'memories' | 'letters' | 'bucket_list' | 'date_invitations'

export default function VisibilityToggle({
  table,
  id,
  initialHidden,
}: {
  table: Table
  id: string
  initialHidden: boolean
}) {
  const [hidden, setHidden] = useState(initialHidden)
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    const next = !hidden
    setHidden(next) // optimistic
    startTransition(async () => {
      const result = await setItemVisibility(table, id, next)
      if (result?.error) {
        setHidden(!next) // revert on failure
      }
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      title={hidden ? 'Hidden from default role — click to make visible' : 'Visible to default role — click to hide'}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
        hidden
          ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
      }`}
    >
      <span aria-hidden>{hidden ? '🙈' : '👁️'}</span>
      {hidden ? 'Hidden' : 'Visible'}
    </button>
  )
}
