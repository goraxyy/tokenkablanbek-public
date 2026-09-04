import { getInvitations } from '@/actions/invite'
import InviteClient from './InviteClient'

export const dynamic = 'force-dynamic'

export default async function InvitePage() {
  const { data: invitations } = await getInvitations()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="section-title">💌 Date Night</h1>
        <p className="section-subtitle">Plan something magical together</p>
      </div>
      <InviteClient initialInvitations={invitations || []} />
    </div>
  )
}
