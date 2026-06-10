import type { Letter } from '../types'
import LetterCard from './LetterCard'
import EmptyState from './EmptyState'

interface LetterFeedProps {
  letters: Letter[]
  onDelete: (id: string) => void
  onCreateClick: () => void
}

export default function LetterFeed({ letters, onDelete, onCreateClick }: LetterFeedProps) {
  if (letters.length === 0) {
    return <EmptyState onCreateClick={onCreateClick} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-heading text-2xl text-accent">Your Letters</h2>
        <span className="text-xs text-text-secondary/50 font-medium">{letters.length} letter{letters.length !== 1 ? 's' : ''}</span>
      </div>
      {letters.map((letter) => (
        <div key={letter.id} className="animate-slide-in">
          <LetterCard letter={letter} onDelete={onDelete} />
        </div>
      ))}
    </div>
  )
}
