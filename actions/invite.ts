'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertCanEdit, assertCanRead, dbError, type ActionResult } from '@/lib/authz'
import { escapeHtml } from '@/lib/html'
import { getSiteUrl } from '@/lib/site-url'

const inviteSchema = z.object({
  date: z.string().min(1, 'Date is required').max(40),
  time: z.string().min(1, 'Time is required').max(40),
  location: z.string().min(1, 'Location is required').max(300),
  note: z.string().max(2000).optional(),
  recipient_email: z.string().email().optional().or(z.literal('')),
})

export type InviteFormData = z.infer<typeof inviteSchema>

const STATUSES = ['pending', 'accepted', 'declined', 'went'] as const

/**
 * Invitation email goes out through Resend from our verified domain to any
 * address the caller supplies. Unbounded, that is a spam cannon pointed at
 * our own sending reputation, so each account gets a daily ceiling.
 */
const MAX_EMAILS_PER_DAY = 20

async function emailQuotaExceeded(caller: { supabase: any; userId: string }) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count, error } = await (caller.supabase as any)
    .from('invite_email_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', caller.userId)
    .gte('sent_at', since)

  // Fail closed: if the ceiling cannot be checked, do not send.
  if (error) {
    console.error('[db:emailQuota]', error.message)
    return true
  }

  return (count ?? 0) >= MAX_EMAILS_PER_DAY
}

function buildInviteEmail(invite: {
  date: string
  time: string
  location: string
  note?: string
}) {
  const siteUrl = getSiteUrl()

  // Every interpolated value is user input and this body is assembled by
  // string concatenation, so it gets no automatic escaping the way JSX would.
  // Without escaping, a sender could inject arbitrary markup - including
  // links - into a message delivered from our own verified domain.
  const date = escapeHtml(invite.date)
  const time = escapeHtml(invite.time)
  const location = escapeHtml(invite.location)
  const note = invite.note ? escapeHtml(invite.note) : null
  const safeSiteUrl = escapeHtml(siteUrl)
  const siteLabel = escapeHtml(siteUrl.replace('https://', ''))

  return `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:Georgia,serif;background:#FFF0F5;margin:0;padding:0}
      .container{max-width:520px;margin:40px auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(255,133,161,0.2)}
      .header{background:linear-gradient(135deg,#FFD6E7 0%,#FFAECB 100%);padding:48px 40px 32px;text-align:center}
      .body{padding:40px}
      .detail{background:#FFF0F5;border-radius:12px;padding:16px 20px;margin:8px 0}
      .footer{text-align:center;padding:24px;color:#FFB3C6;font-size:12px}
    </style></head>
    <body><div class="container">
      <div class="header">
        <div style="font-size:48px;margin-bottom:12px">🌸</div>
        <h1 style="color:#E75480;margin:0;font-size:28px">You've Been Invited!</h1>
        <p style="color:#FF85A1;margin-top:8px;font-style:italic">A special date awaits you</p>
      </div>
      <div class="body">
        <div class="detail"><strong style="color:#E75480">📅 Date</strong><p style="margin:4px 0 0;color:#444">${date}</p></div>
        <div class="detail"><strong style="color:#E75480">⏰ Time</strong><p style="margin:4px 0 0;color:#444">${time}</p></div>
        <div class="detail"><strong style="color:#E75480">📍 Location</strong><p style="margin:4px 0 0;color:#444">${location}</p></div>
        ${note ? `<div class="detail"><strong style="color:#E75480">💕 A message for you</strong><p style="margin:4px 0 0;color:#444;font-style:italic">${note}</p></div>` : ''}
        <p style="text-align:center;margin-top:28px;color:#888;font-size:14px">Made with love 💗</p>
      </div>
      <div class="footer">Our Story ✨ <a href="${safeSiteUrl}" style="color:#FFB3C6">${siteLabel}</a></div>
    </div></body></html>
  `
}

export async function createInvitation(formData: InviteFormData): Promise<ActionResult<any>> {
  const parsed = inviteSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error: authError, caller } = await assertCanEdit()
  if (authError || !caller) return { error: authError }

  const { data, error } = await (caller.supabase.from('date_invitations') as any)
    .insert({
      date: parsed.data.date,
      time: parsed.data.time,
      location: parsed.data.location,
      note: parsed.data.note || null,
      recipient_email: parsed.data.recipient_email || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return dbError('createInvitation', error)

  if (parsed.data.recipient_email) {
    if (await emailQuotaExceeded(caller)) {
      revalidatePath('/invite')
      return {
        data,
        warning: `The invitation was saved, but the daily limit of ${MAX_EMAILS_PER_DAY} emails has been reached. It was not sent.`,
      }
    }

    try {
      const { resend, FROM_EMAIL } = await import('@/lib/resend')

      if (resend) {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: parsed.data.recipient_email,
          subject: '🌸 You have a date invitation!',
          html: buildInviteEmail(parsed.data),
        })

        const { error: logError } = await (caller.supabase as any)
          .from('invite_email_log')
          .insert({ user_id: caller.userId })
        if (logError) console.error('[db:inviteEmailLog]', logError.message)
      }
    } catch (emailError) {
      console.error('Email send failed:', emailError)
    }
  }

  revalidatePath('/invite')
  return { data }
}

export async function updateInvitation(id: string, formData: Partial<InviteFormData>): Promise<ActionResult<any>> {
  const parsed = inviteSchema.partial().safeParse(formData)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error: authError, caller } = await assertCanEdit()
  if (authError || !caller) return { error: authError }

  const { data, error } = await (caller.supabase.from('date_invitations') as any)
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return dbError('updateInvitation', error)

  revalidatePath('/invite')
  return { data }
}

export async function deleteInvitation(id: string): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertCanEdit()
  if (authError || !caller) return { error: authError }

  // `date_invitations` has no `user_id` column - invitations are shared, not
  // per-user - so the previous `.eq('user_id', user.id)` filter made every
  // delete fail with "column does not exist". Authorization is the caller's
  // editor role, enforced above and again by the table's RLS policy.
  const { error } = await (caller.supabase.from('date_invitations') as any).delete().eq('id', id)

  if (error) return dbError('deleteInvitation', error)

  revalidatePath('/invite')
  return { success: true }
}

export async function updateInvitationStatus(id: string, status: (typeof STATUSES)[number]): Promise<ActionResult<any>> {
  if (!STATUSES.includes(status)) return { error: 'Invalid status' }

  const { error: authError, caller } = await assertCanEdit()
  if (authError || !caller) return { error: authError }

  const { data, error } = await (caller.supabase.from('date_invitations') as any)
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return dbError('updateInvitationStatus', error)

  revalidatePath('/invite')
  return { data }
}

export async function getInvitations(): Promise<ActionResult<any>> {
  const { error: authError, caller } = await assertCanRead()
  if (authError || !caller) return { data: [] }

  const { data, error } = await (caller.supabase.from('date_invitations') as any)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[db:getInvitations]', error.message)
    return { data: [] }
  }

  return { data: data ?? [] }
}
