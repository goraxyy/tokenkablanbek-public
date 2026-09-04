import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listUserRoles } from '@/actions/admin'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
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

  const { users, error } = await listUserRoles()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="font-serif text-3xl font-semibold text-peony-deep">🛡️ User Management</h1>
        <p className="text-sm text-peony-deep/60 mt-2">
          Review new sign-ups and control who can see and edit content.
        </p>
        <a
          href="/admin/content"
          className="inline-block mt-4 text-xs font-medium text-peony-deep underline hover:no-underline"
        >
          Manage content visibility →
        </a>
      </div>
      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <AdminClient roles={users} />
    </div>
  )
}
