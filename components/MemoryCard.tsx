'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Lightbox from 'yet-another-react-lightbox'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/captions.css'
import { formatDate } from '@/lib/utils'
import { deleteMemory, updateMemory } from '@/actions/memory'
import type { MemoryFormData } from '@/actions/memory'
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
  memory: MemoryWithPhotos
  onDelete?: (id: string) => void
  onUpdate?: (updated: MemoryWithPhotos) => void
}

export default function MemoryCard({ memory, onDelete, onUpdate }: Props) {
  const canEdit = useCanEdit()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [form, setForm] = useState<MemoryFormData>({
    title: memory.title,
    description: memory.description ?? '',
    location: memory.location ?? '',
    date: memory.date,
  })

  const coverPhoto = memory.memory_photos[0]

  const slides = useMemo(
    () =>
      memory.memory_photos.map((photo, index) => ({
        src: photo.image_url,
        title: memory.title,
        description: `${memory.description || formatDate(memory.date)}${
          memory.location ? ` • ${memory.location}` : ''
        }`,
        alt: `${memory.title} photo ${index + 1}`,
      })),
    [memory]
  )

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this memory?')) return
    setDeleting(true)
    const result = await deleteMemory(memory.id)
    setDeleting(false)
    if (result.error) {
      alert(result.error)
      return
    }
    onDelete?.(memory.id)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setEditError(null)
    const result = await updateMemory(memory.id, form)
    setSaving(false)
    if (result.error) {
      setEditError(result.error)
      return
    }
    if (result.data) {
      onUpdate?.({ ...memory, ...form })
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <motion.div className="glass-card p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h3
          className="font-serif text-peony-deep font-semibold mb-4"
          style={{ fontFamily: 'Nunito, ui-rounded, sans-serif', color: '#7c3f6e' }}
        >
          Edit Memory
        </h3>
        <form onSubmit={handleSave} className="space-y-3">
          <input
            className="w-full px-3 py-2 rounded-xl bg-white/60 border border-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-peony-dark/50"
            style={{ fontFamily: 'Nunito, ui-rounded, sans-serif', color: '#7c3f6e' }}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title"
            required
          />
          <input
            type="date"
            className="w-full px-3 py-2 rounded-xl bg-white/60 border border-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-peony-dark/50"
            style={{ fontFamily: 'Nunito, ui-rounded, sans-serif', color: '#7c3f6e' }}
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
          />
          <input
            className="w-full px-3 py-2 rounded-xl bg-white/60 border border-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-peony-dark/50"
            style={{ fontFamily: 'Nunito, ui-rounded, sans-serif', color: '#7c3f6e' }}
            value={form.location ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="Location"
          />
          <textarea
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-white/60 border border-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-peony-dark/50 resize-none"
            style={{ fontFamily: 'Nunito, ui-rounded, sans-serif', color: '#7c3f6e' }}
            value={form.description ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description"
          />
          {editError && <p className="text-red-400 text-xs">{editError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-xl bg-peony text-white text-sm font-semibold hover:bg-peony-dark transition disabled:opacity-60"
              style={{ fontFamily: 'Nunito, ui-rounded, sans-serif' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 py-2 rounded-xl bg-white/50 text-sm hover:bg-white/70 transition"
              style={{ fontFamily: 'Nunito, ui-rounded, sans-serif', color: '#9a6090' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    )
  }

  const THUMBNAIL_SLOTS = 5

  return (
    <>
      <motion.div
        className="glass-card overflow-hidden group cursor-pointer"
        whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(180,100,200,0.25)' }}
        transition={{ duration: 0.3 }}
        onClick={() => coverPhoto && openLightbox(0)}
      >
        <div className="relative h-52 overflow-hidden rounded-t-2xl" style={{ background: 'rgba(237,220,255,0.4)' }}>
          {coverPhoto ? (
            <Image src={coverPhoto.image_url} alt={memory.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-5xl opacity-40">📸</span>
            </div>
          )}
          {memory.memory_photos.length > 1 && (
            <div
              className="absolute top-3 right-3 backdrop-blur-md bg-white/60 border border-white/70 text-xs px-2 py-1 rounded-full font-semibold"
              style={{ color: '#7c3f6e', fontFamily: 'Nunito, ui-rounded, sans-serif' }}
            >
              +{memory.memory_photos.length - 1} more
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-serif text-lg font-bold mb-1 line-clamp-1" style={{ fontFamily: 'Nunito, ui-rounded, sans-serif', color: '#6b2f5f' }}>
            {memory.title}
          </h3>
          <div className="flex items-center gap-3 text-xs mb-3" style={{ color: '#b07aa0', fontFamily: 'Nunito, ui-rounded, sans-serif' }}>
            <span>🗓 {formatDate(memory.date)}</span>
            {memory.location && <span>📍 {memory.location}</span>}
          </div>
          {memory.description && (
            <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: '#9a6090', fontFamily: 'Nunito, ui-rounded, sans-serif' }}>
              {memory.description}
            </p>
          )}
          {memory.memory_photos.length > 1 && (
            <div className="flex gap-1.5 mt-4 overflow-hidden">
              {memory.memory_photos.slice(0, THUMBNAIL_SLOTS).map((photo, i) => (
                <div
                  key={photo.id ?? `${photo.image_url}-${i}`}
                  className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer border-2 border-white/70"
                  onClick={(e) => {
                    e.stopPropagation()
                    openLightbox(i)
                  }}
                >
                  <Image src={photo.image_url} alt={`${memory.title} thumbnail ${i + 1}`} fill className="object-cover hover:scale-110 transition-transform duration-300" />
                  {i === THUMBNAIL_SLOTS - 1 && memory.memory_photos.length > THUMBNAIL_SLOTS && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-medium" style={{ fontFamily: 'Nunito, ui-rounded, sans-serif' }}>
                      +{memory.memory_photos.length - THUMBNAIL_SLOTS}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {canEdit && (
            <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex-1 py-1.5 rounded-xl bg-white/50 text-xs font-bold hover:bg-white/70 transition border border-white/70"
                style={{ color: '#7c3f6e', fontFamily: 'Nunito, ui-rounded, sans-serif' }}
              >
                ✏️ Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-xl bg-rose-50/70 text-rose-400 text-xs hover:bg-rose-100/80 transition disabled:opacity-50 border border-rose-100"
                style={{ fontFamily: 'Nunito, ui-rounded, sans-serif' }}
              >
                {deleting ? '...' : '✕'}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
        plugins={[Captions]}
        captions={{ descriptionTextAlign: 'center', descriptionMaxLines: 2 }}
        on={{ view: ({ index }) => setLightboxIndex(index) }}
        styles={{
          root: { '--yarl__color_backdrop': 'rgba(0, 0, 0, 0.92)' } as unknown as Record<`--yarl__${string}`, string>,
          captionsTitle: { textAlign: 'center' },
          captionsDescription: { textAlign: 'center' },
        }}
      />
    </>
  )
}
