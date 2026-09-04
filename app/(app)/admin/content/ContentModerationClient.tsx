'use client'

import { useEffect, useState } from 'react'
import { listAllContentForModeration, type ModerationItem } from '@/actions/visibility'
import VisibilityToggle from '@/components/VisibilityToggle'

const LABELS: Record<string, string> = {
  memories: 'Memories',
  letters: 'Letters',
  bucket_list: 'Bucket List',
  date_invitations: 'Date Invites',
}

export default function ContentModerationClient() {
  const [items, setItems] = useState<ModerationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listAllContentForModeration().then((res) => {
      if (res.error) setError(res.error)
      setItems(res.items)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <p className="text-sm text-peony-deep/60">Loading content…</p>
  }

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>
  }

  const grouped = items.reduce<Record<string, ModerationItem[]>>((acc, item) => {
    acc[item.table] = acc[item.table] || []
    acc[item.table].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <p className="text-sm text-peony-deep/70">
        Toggle any item below to hide or show it for the <strong>default</strong> role.
        The <strong>main</strong> and <strong>admin</strong> roles always see everything.
      </p>

      {Object.keys(grouped).length === 0 && (
        <p className="text-sm text-peony-deep/60">Nothing here yet.</p>
      )}

      {Object.entries(grouped).map(([table, rows]) => (
        <section key={table}>
          <h2 className="mb-3 font-serif text-lg font-semibold text-peony-deep">
            {LABELS[table] ?? table}
          </h2>
          <ul className="space-y-2">
            {rows.map((item) => (
              <li
                key={`${item.table}-${item.id}`}
                className="glass-card flex items-center justify-between gap-4 rounded-xl px-4 py-3"
              >
                <span className="truncate text-sm text-peony-deep">{item.title}</span>
                <VisibilityToggle
                  table={item.table}
                  id={item.id}
                  initialHidden={item.hidden_from_viewer}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
