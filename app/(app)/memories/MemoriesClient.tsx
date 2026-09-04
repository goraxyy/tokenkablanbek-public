'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MemoryCard from '@/components/MemoryCard'
import AddMemoryForm from './AddMemoryForm'
import { useCanEdit } from '@/hooks/useCanEdit'

type MemoryWithPhotos = {
  id: string
  title: string
  description: string | null
  location: string | null
  date: string
  created_at?: string
  updated_at?: string
  memory_photos: {
    id?: string
    memory_id?: string
    image_url: string
    storage_path?: string
    created_at?: string
  }[]
}

interface Props {
  initialMemories: MemoryWithPhotos[]
  error?: string
}

export default function MemoriesClient({ initialMemories, error }: Props) {
  const canEdit = useCanEdit()
  const [memories, setMemories] = useState<MemoryWithPhotos[]>(initialMemories)
  const [showForm, setShowForm] = useState(false)

  const handleMemoryAdded = (newMemory: MemoryWithPhotos) => {
    setMemories((prev) => [newMemory, ...prev])
    setShowForm(false)
  }

  const handleMemoryDeleted = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id))
  }

  const handleMemoryUpdated = (updated: MemoryWithPhotos) => {
    setMemories((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)))
  }

  if (error) {
    return <div className="text-center py-12 text-rose-400">Error loading memories: {error}</div>
  }

  return (
    <div>
      {canEdit && (
        <div className="flex justify-center mb-10">
          <motion.button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <span>{showForm ? '✕' : '+'}</span>
            {showForm ? 'Cancel' : 'Add a Memory'}
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {showForm && canEdit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-10"
          >
            <AddMemoryForm onSuccess={handleMemoryAdded} />
          </motion.div>
        )}
      </AnimatePresence>

      {memories.length === 0 ? (
        <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="text-6xl block mb-4">📸</span>
          <p className="font-serif text-xl text-peony-deep/60">Your story begins here</p>
          <p className="text-sm text-muted-foreground mt-2">Add your first memory above</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((memory, i) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <MemoryCard
                memory={memory}
                onDelete={handleMemoryDeleted}
                onUpdate={handleMemoryUpdated}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
