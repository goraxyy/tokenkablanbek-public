'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertCanEdit, assertCanRead, dbError, type ActionResult } from '@/lib/authz'

const letterSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(20000),
  unlock_date: z.string().optional().nullable(),
  locked: z.boolean().default(true),
})

export type LetterFormData = z.infer<typeof letterSchema>

type LetterRow = {
  id: string
  title: string
  content: string | null
  unlock_date: string | null
  locked: boolean
  [key: string]: unknown
}

/**
 * True when a letter's contents may be revealed: either it was explicitly
 * unlocked, or its unlock date has passed.
 */
function isReadable(letter: LetterRow) {
  if (!letter.locked) return true
  if (!letter.unlock_date) return false
  return new Date(letter.unlock_date) <= new Date()
}

export async function createLetter(formData: LetterFormData): Promise<ActionResult<any>> {
  const parsed = letterSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error: authError, caller } = await assertCanEdit()
  if (authError || !caller) return { error: authError }

  const { data, error } = await (caller.supabase.from('letters') as any)
    .insert({
      title: parsed.data.title,
      content: parsed.data.content,
      unlock_date: parsed.data.unlock_date || null,
      locked: parsed.data.locked,
    })
    .select()
    .single()

  if (error) return dbError('createLetter', error)

  revalidatePath('/letters')
  return { data }
}

/**
 * A locked letter's body is withheld here rather than in the client.
 * Previously every letter was returned with `content` populated and the lock
 * was drawn in the UI only, so the text of a sealed "open when" letter was
 * sitting in the page payload for anyone who opened devtools.
 *
 * Editors and admins keep the full text - they author and edit these letters,
 * and the lock exists to stop the *recipient* reading ahead, not them.
 */
export async function getLetters(): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertCanRead()
  if (authError || !caller) return { error: authError }

  const { data, error } = await (caller.supabase.from('letters') as any)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return dbError('getLetters', error)

  const canSeeEverything = caller.role === 'editor' || caller.role === 'admin'

  const letters = ((data ?? []) as LetterRow[]).map((letter) =>
    canSeeEverything || isReadable(letter) ? letter : { ...letter, content: null }
  )

  return { data: letters }
}

export async function unlockLetter(id: string): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertCanEdit()
  if (authError || !caller) return { error: authError }

  const { data, error } = await (caller.supabase.from('letters') as any)
    .update({ locked: false })
    .eq('id', id)
    .select()
    .single()

  if (error) return dbError('unlockLetter', error)

  revalidatePath('/letters')
  return { data }
}

export async function updateLetter(id: string, formData: Partial<LetterFormData>): Promise<ActionResult<any>> {
  const parsed = letterSchema.partial().safeParse(formData)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error: authError, caller } = await assertCanEdit()
  if (authError || !caller) return { error: authError }

  const { data, error } = await (caller.supabase.from('letters') as any)
    .update({
      title: parsed.data.title,
      content: parsed.data.content,
      unlock_date: parsed.data.unlock_date ?? null,
      locked: parsed.data.locked,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return dbError('updateLetter', error)

  revalidatePath('/letters')
  return { data }
}

export async function deleteLetter(id: string): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertCanEdit()
  if (authError || !caller) return { error: authError }

  const { error } = await (caller.supabase.from('letters') as any).delete().eq('id', id)
  if (error) return dbError('deleteLetter', error)

  revalidatePath('/letters')
  return { success: true }
}
