import { useState, useRef } from 'react'
import { useLetters } from '../hooks/useLetters'
import LetterCreationPanel from './LetterCreationPanel'
import LetterFeed from './LetterFeed'
import DeleteModal from './DeleteModal'

interface AppInterfaceProps {
  onBack: () => void
}

export default function AppInterface({ onBack }: AppInterfaceProps) {
  const { letters, addLetter, deleteLetter } = useLetters()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteLetter(deleteId)
      setDeleteId(null)
    }
  }

  const handleSave = (letter: { recipient: string; content: string; unlockDate: string }) => {
    addLetter(letter)
    setTimeout(() => {
      feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <div className="min-h-screen paper-texture">
      {/* Header */}
      <header className="border-b border-border/50 bg-bg/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-text-secondary/60 hover:text-accent transition-colors text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <span className="font-heading text-lg text-accent">Time-Locked Letters</span>
          <div className="w-14" />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Left: Creation Panel */}
          <div className="md:sticky md:top-24">
            <LetterCreationPanel onSave={handleSave} />
          </div>

          {/* Right: Letter Feed */}
          <div ref={feedRef}>
            <LetterFeed
              letters={letters}
              onDelete={handleDelete}
              onCreateClick={() => {
                window.scrollTo({ behavior: 'smooth', top: 0 })
              }}
            />
          </div>
        </div>
      </main>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
