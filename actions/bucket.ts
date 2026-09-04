'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertCanEdit, assertCanRead, dbError, type ActionResult } from '@/lib/authz'
import { getSafeExtension, validatePhoto } from '@/lib/uploads'
import { signPath, signPaths } from '@/lib/storage'

const bucketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
})

export type BucketFormData = z.infer<typeof bucketSchema>

export async function createBucketItem(formData: BucketFormData): Promise<ActionResult<any>> {
  const parsed = bucketSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error: authError, caller } = await assertCanEdit()
  if (authError || !caller) return { error: authError }

  const { data, error } = await (caller.supabase.from('bucket_list') as any)
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
    })
    .select()
    .single()

  if (error) return dbError('createBucketItem', error)

  revalidatePath('/bucket-list')
  return { data }
}

export async function getBucketList(): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertCanRead()
  if (authError || !caller) return { error: authError }

  const { data, error } = await caller.supabase
    .from('bucket_list')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return dbError('getBucketList', error)

  const items = (data ?? []) as Array<Record<string, any>>
  const signed = await signPaths(
    caller.supabase,
    'bucket-list',
    items.map((item) => item.storage_path)
  )

  return {
    data: items.map((item) => ({
      ...item,
      photo_url: item.storage_path ? signed.get(item.storage_path) ?? null : null,
    })),
  }
}

export async function completeBucketItem(id: string, photoFile?: File): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertCanEdit()
  if (authError || !caller) return { error: authError }

  let photo_url: string | null = null
  let storage_path: string | null = null

  if (photoFile) {
    // Previously this uploaded whatever it was handed, taking the stored
    // extension straight from the client-supplied filename. Same validation
    // as the memories uploader now applies.
    const validationError = validatePhoto(photoFile)
    if (validationError) return { error: validationError }

    const path = `${id}/${Date.now()}-${crypto.randomUUID()}.${getSafeExtension(photoFile)}`

    const { error: uploadError } = await caller.supabase.storage
      .from('bucket-list')
      .upload(path, await photoFile.arrayBuffer(), {
        contentType: photoFile.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) return dbError('completeBucketItem:upload', uploadError)

    // Store the path, not a permanent public URL - see lib/storage.ts.
    storage_path = path
    photo_url = await signPath(caller.supabase, 'bucket-list', path)
  }

  const { data, error } = await (caller.supabase.from('bucket_list') as any)
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      ...(storage_path ? { storage_path } : {}),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return dbError('completeBucketItem', error)

  revalidatePath('/bucket-list')
  return { data: { ...(data as Record<string, any>), photo_url } }
}

export async function deleteBucketItem(id: string): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertCanEdit()
  if (authError || !caller) return { error: authError }

  const { error } = await caller.supabase.from('bucket_list').delete().eq('id', id)
  if (error) return dbError('deleteBucketItem', error)

  revalidatePath('/bucket-list')
  return { success: true }
}
