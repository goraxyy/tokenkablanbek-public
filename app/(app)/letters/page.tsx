import { getLetters } from '@/actions/letters'
import LettersClient from './LettersClient'

export const dynamic = 'force-dynamic'

export default async function LettersPage() {
  const { data: letters } = await getLetters()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="section-title">📝 Open When Letters</h1>
        <p className="section-subtitle">Words that wait for the perfect moment</p>
      </div>
      <LettersClient initialLetters={letters || []} />
    </div>
  )
}
