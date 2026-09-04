import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ContentModerationClient from './ContentModerationClient'

export default async function AdminContentPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if ((roleRow as { role?: string } | null)?.role !== 'admin') {
    redirect('/memories')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 font-serif text-2xl font-semibold text-peony-deep">
        Content visibility
      </h1>
      <p className="mb-6 text-sm text-peony-deep/60">
        Manage what the default (viewer) role can see.
      </p>
      <ContentModerationClient />
    </div>
  )
}
