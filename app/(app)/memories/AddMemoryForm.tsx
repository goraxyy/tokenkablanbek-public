'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { createMemory, type MemoryFormData } from '@/actions/memory'

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

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
})

interface Props {
  onSuccess: (memory: MemoryWithPhotos) => void
}

async function compressImage(file: File, maxDimension = 1600, quality = 0.82): Promise<File> {
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
    return file
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      if (width <= maxDimension && height <= maxDimension && file.size < 2 * 1024 * 1024) {
        resolve(file)
        return
      }

      const scale = Math.min(maxDimension / width, maxDimension / height, 1)
      width = Math.round(width * scale)
      height = Math.round(height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    img.src = url
  })
}

export default function AddMemoryForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<FileList | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemoryFormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: MemoryFormData) => {
    setLoading(true)
    setError(null)
    setUploadProgress(null)

    try {
      const rawFiles = photos ? Array.from(photos) : []
      let photoFiles: File[] = rawFiles

      if (rawFiles.length > 0) {
        setUploadProgress('Preparing photos…')
        photoFiles = await Promise.all(rawFiles.map((f) => compressImage(f)))
      }

      const totalBytes = photoFiles.reduce((sum, f) => sum + f.size, 0)
      const MAX_TOTAL_MB = 40
      if (totalBytes > MAX_TOTAL_MB * 1024 * 1024) {
        setError(`Total size exceeds ${MAX_TOTAL_MB} MB after compression. Please select fewer or smaller photos.`)
        setLoading(false)
        return
      }

      let photoFormData: FormData | undefined
      if (photoFiles.length > 0) {
        setUploadProgress(`Uploading ${photoFiles.length} photo${photoFiles.length > 1 ? 's' : ''}…`)
        photoFormData = new FormData()
        photoFiles.forEach((file) => photoFormData!.append('photos', file))
      }

      const result = await createMemory(data, photoFormData)

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (!result.data) {
        setError('Memory could not be saved. Please try again.')
        setLoading(false)
        return
      }

      onSuccess({
        ...result.data,
        memory_photos: (result.uploadedPhotos ?? []).map((p) => ({
          image_url: p.image_url,
          storage_path: p.storage_path,
        })),
      })

      reset()
      setPhotos(null)
      setUploadProgress(null)
      setLoading(false)
    } catch (networkErr: unknown) {
      console.error('Create memory failed:', networkErr)
      const msg = networkErr instanceof Error ? networkErr.message : ''
      if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('fetch')) {
        setError('Upload timed out. Try again with smaller photos.')
      } else {
        setError('Could not reach the server. Please check your connection and try again.')
      }
      setUploadProgress(null)
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-8 max-w-2xl mx-auto">
      <h2
        className="font-serif text-2xl font-bold mb-6"
        style={{ fontFamily: 'Nunito, ui-rounded, sans-serif', color: '#6b2f5f' }}
      >
        ✨ New Memory
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label
            className="block text-sm font-semibold mb-1.5"
            style={{ color: '#9a6090', fontFamily: 'Nunito, ui-rounded, sans-serif' }}
          >
            Title
          </label>
          <input
            {...register('title')}
            placeholder="Our first picnic..."
            className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/80 focus:outline-none focus:ring-2 focus:ring-peony-dark/50 transition"
            style={{ fontFamily: 'Nunito, ui-rounded, sans-serif', color: '#7c3f6e' }}
          />
          {errors.title && <p className="text-rose-400 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-sm font-semibold mb-1.5"
              style={{ color: '#9a6090', fontFamily: 'Nunito, ui-rounded, sans-serif' }}
            >
              Date
            </label>
            <input
              {...register('date')}
              type="date"
              className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/80 focus:outline-none focus:ring-2 focus:ring-peony-dark/50 transition"
              style={{ fontFamily: 'Nunito, ui-rounded, sans-serif', color: '#7c3f6e' }}
            />
            {errors.date && <p className="text-rose-400 text-xs mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-1.5"
              style={{ color: '#9a6090', fontFamily: 'Nunito, ui-rounded, sans-serif' }}
            >
              Location
            </label>
            <input
              {...register('location')}
              placeholder="Central Park, NYC"
              className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/80 focus:outline-none focus:ring-2 focus:ring-peony-dark/50 transition"
              style={{ fontFamily: 'Nunito, ui-rounded, sans-serif', color: '#7c3f6e' }}
            />
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-1.5"
            style={{ color: '#9a6090', fontFamily: 'Nunito, ui-rounded, sans-serif' }}
          >
            Description
          </label>
          <textarea
            {...register('description')}
            placeholder="Tell the story of this memory..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white/60 border border-white/80 focus:outline-none focus:ring-2 focus:ring-peony-dark/50 transition resize-none"
            style={{ fontFamily: 'Nunito, ui-rounded, sans-serif', color: '#7c3f6e' }}
          />
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-1.5"
            style={{ color: '#9a6090', fontFamily: 'Nunito, ui-rounded, sans-serif' }}
          >
            Photos
          </label>
          <div
            className="border-2 border-dashed border-peony/50 rounded-xl p-6 text-center hover:border-peony-dark/60 transition cursor-pointer"
            style={{ background: 'rgba(255,240,250,0.5)' }}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setPhotos(e.target.files)}
              className="hidden"
              id="photo-upload"
            />
            <label htmlFor="photo-upload" className="cursor-pointer">
              <span className="text-3xl block mb-2">📸</span>
              <span
                className="text-sm"
                style={{ color: '#b07aa0', fontFamily: 'Nunito, ui-rounded, sans-serif' }}
              >
                {photos && photos.length > 0
                  ? `${photos.length} photo${photos.length > 1 ? 's' : ''} selected`
                  : 'Click to upload photos (up to 12 photos, 6 MB each)'}
              </span>
            </label>
          </div>
        </div>

        {uploadProgress && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'rgba(237,220,255,0.6)',
              color: '#7c3f6e',
              fontFamily: 'Nunito, ui-rounded, sans-serif',
            }}
          >
            ⏳ {uploadProgress}
          </div>
        )}

        {error && (
          <div
            className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-rose-500 text-sm whitespace-pre-line"
            style={{ fontFamily: 'Nunito, ui-rounded, sans-serif' }}
          >
            {error}
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-60"
        >
          {loading ? uploadProgress ?? 'Saving...' : 'Save Memory 💕'}
        </motion.button>
      </form>
    </div>
  )
}