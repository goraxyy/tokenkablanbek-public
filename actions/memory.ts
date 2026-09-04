'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertCanEdit, assertCanRead, dbError, type Caller, type ActionResult } from '@/lib/authz'
import { getSafeExtension, validatePhotos } from '@/lib/uploads'
import { signPath, signPaths } from '@/lib/storage'

const memorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
  location: z.string().max(300).optional(),
  date: z.string().min(1, 'Date is required'),
})

export type MemoryFormData = z.infer<typeof memorySchema>

type CreateMemoryResult = ActionResult<any> & {
  uploadedPhotos?: Array<{ image_url: string; storage_path: string }>
  partialErrors?: string[]
}

async function uploadSingleMemoryPhoto(supabase: Caller['supabase'], memoryId: string, photo: File) {
  const path = `${memoryId}/${Date.now()}-${crypto.randomUUID()}.${getSafeExtension(photo)}`

  const { error: uploadError } = await supabase.storage.from('memories').upload(path, await photo.arrayBuffer(), {
    contentType: photo.type,
    cacheControl: '3600',
    upsert: false,
  })

  if (uploadError) return { error: uploadError.message }

  // Only the path is stored. Every URL handed to a browser is signed and
  // short-lived (lib/storage.ts); persisting a permanent public URL is what
  // made the bucket's contents readable by anyone who ever saw one.
  const { error: photoInsertError } = await (supabase.from('memory_photos') as any).insert({
    memory_id: memoryId,
    storage_path: path,
  })

  if (photoInsertError) {
    await supabase.storage.from('memories').remove([path])
    return { error: photoInsertError.message }
  }

  const signedUrl = await signPath(supabase, 'memories', path)

  return { data: { image_url: signedUrl ?? '', storage_path: path } }
}

export async function createMemory(
  formData: MemoryFormData,
  photoFiles?: FormData
): Promise<CreateMemoryResult> {
  const parsed = memorySchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error: authError, caller } = await assertCanEdit()
  if (authError || !caller) return { error: authError }

  const photos = photoFiles
    ? (photoFiles.getAll('photos') as File[]).filter((file) => file instanceof File)
    : []

  const photoValidationError = validatePhotos(photos)
  if (photoValidationError) return { error: photoValidationError }

  const { data: memory, error } = await (caller.supabase.from('memories') as any)
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      location: parsed.data.location || null,
      date: parsed.data.date,
    })
    .select()
    .single()

  if (error) return dbError('createMemory', error)

  const uploadedPhotos: Array<{ image_url: string; storage_path: string }> = []
  const uploadErrors: string[] = []

  for (const photo of photos) {
    try {
      const result = await uploadSingleMemoryPhoto(caller.supabase, memory.id, photo)
      if (result.error) {
        console.error('[db:createMemory:upload]', result.error)
        uploadErrors.push(`${photo.name} could not be uploaded`)
      } else if (result.data) {
        uploadedPhotos.push(result.data)
      }
    } catch (photoErr) {
      console.error('[db:createMemory:upload]', photoErr)
      uploadErrors.push(`${photo.name} could not be uploaded`)
    }
  }

  revalidatePath('/memories')

  return {
    data: memory,
    uploadedPhotos,
    partialErrors: uploadErrors.length > 0 ? uploadErrors : undefined,
  }
}

export async function updateMemory(id: string, formData: MemoryFormData): Promise<ActionResult<any>> {
  const parsed = memorySchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error: authError, caller } = await assertCanEdit()
  if (authError || !caller) return { error: authError }

  const { data, error } = await (caller.supabase.from('memories') as any)
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      location: parsed.data.location || null,
      date: parsed.data.date,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return dbError('updateMemory', error)

  revalidatePath('/memories')
  return { data }
}

export async function getMemoriesWithPhotos(): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertCanRead()
  if (authError || !caller) return { error: authError }

  const { data, error } = await (caller.supabase.from('memories') as any)
    .select(`
      *,
      memory_photos (*)
    `)
    .order('date', { ascending: false })

  if (error) return dbError('getMemoriesWithPhotos', error)

  const memories = (data ?? []) as Array<Record<string, any>>
  const signed = await signPaths(
    caller.supabase,
    'memories',
    memories.flatMap((m) => (m.memory_photos ?? []).map((p: any) => p.storage_path))
  )

  // A photo whose URL could not be signed is dropped rather than rendered
  // with a stale public link - fail closed.
  return {
    data: memories.map((m) => ({
      ...m,
      memory_photos: (m.memory_photos ?? [])
        .map((p: any) => ({ ...p, image_url: signed.get(p.storage_path) ?? null }))
        .filter((p: any) => p.image_url),
    })),
  }
}

export async function deleteMemory(id: string): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertCanEdit()
  if (authError || !caller) return { error: authError }

  const { data: photos } = await (caller.supabase.from('memory_photos') as any)
    .select('storage_path')
    .eq('memory_id', id)

  if (photos && photos.length > 0) {
    await caller.supabase.storage
      .from('memories')
      .remove(photos.map((p: { storage_path: string }) => p.storage_path))
  }

  const { error } = await (caller.supabase.from('memories') as any).delete().eq('id', id)
  if (error) return dbError('deleteMemory', error)

  revalidatePath('/memories')
  return { success: true }
}
