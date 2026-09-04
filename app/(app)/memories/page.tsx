import { getMemoriesWithPhotos } from '@/actions/memory'
import MemoriesClient from './MemoriesClient'

export const dynamic = 'force-dynamic'

export default async function MemoriesPage() {
  const { data: memories, error } = await getMemoriesWithPhotos()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="section-title">📸 Our Memories</h1>
        <p className="section-subtitle">Every moment captured, every memory treasured</p>
      </div>
      <MemoriesClient initialMemories={memories || []} error={error} />
    </div>
  )
}
