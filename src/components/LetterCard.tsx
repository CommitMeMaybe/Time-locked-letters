import { format } from 'date-fns'
import type { Letter } from '../types'

function isUnlocked(unlockDate: string): boolean {
  return new Date(unlockDate) <= new Date()
}

function getCountdown(unlockDate: string): string {
  const now = new Date()
  const target = new Date(unlockDate)
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return 'Unlocked'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const mins = Math.floor((diff / (1000 * 60)) % 60)

  if (days > 0) return `${days}d ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

interface LetterCardProps {
  letter: Letter
  onDelete: (id: string) => void
}

export default function LetterCard({ letter, onDelete }: LetterCardProps) {
  const unlocked = isUnlocked(letter.unlockDate)
  const countdown = getCountdown(letter.unlockDate)

  return (
    <div
      className={`paper-card rounded-lg p-6 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-md group ${
        unlocked ? 'animate-fade-in border-success/30' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-lg text-accent truncate">{letter.recipient}</h3>
          <p className="text-xs text-text-secondary/60 mt-0.5">
            {format(new Date(letter.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          {/* Status badge */}
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
              unlocked
                ? 'text-success border-success/30 bg-success/5'
                : 'text-text-secondary border-border bg-bg/50'
            }`}
          >
            {unlocked ? 'Unlocked' : 'Locked'}
          </span>
          {/* Icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={unlocked ? 'text-success' : 'text-text-secondary/40'}
          >
            {unlocked ? (
              <>
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </>
            ) : (
              <>
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <circle cx="12" cy="16" r="1" />
                <line x1="12" y1="10" x2="12" y2="13" />
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Countdown */}
      <div className="text-xs text-text-secondary/70 font-medium mb-3">
        {unlocked ? (
          <span className="text-success">Opened — {format(new Date(letter.unlockDate), 'MMM d, yyyy')}</span>
        ) : (
          <span>{countdown} remaining — unlocks {format(new Date(letter.unlockDate), 'MMM d, yyyy')}</span>
        )}
      </div>

      {/* Content */}
      {unlocked ? (
        <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap animate-fade-in">
          {letter.content}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-text-secondary/30 text-sm italic">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Content locked until unlock date
        </div>
      )}

      {/* Delete */}
      <div className="mt-4 pt-3 border-t border-border/40 flex justify-end">
        <button
          onClick={() => onDelete(letter.id)}
          className="text-text-secondary/30 hover:text-error/70 transition-colors p-1"
          title="Delete letter"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
