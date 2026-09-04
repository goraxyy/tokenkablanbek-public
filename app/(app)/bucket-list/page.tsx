import { getBucketList } from '@/actions/bucket'
import BucketListClient from './BucketListClient'

export const dynamic = 'force-dynamic'

export default async function BucketListPage() {
  const { data: items } = await getBucketList()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="section-title">✨ Bucket List</h1>
        <p className="section-subtitle">Adventures we dream of together</p>
      </div>
      <BucketListClient initialItems={items || []} />
    </div>
  )
}
