interface EmptyStateProps {
  onCreateClick: () => void
}

export default function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Empty mailbox illustration */}
      <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 mb-6 opacity-40">
        <rect x="10" y="25" width="100" height="60" rx="4" stroke="#533B3A" strokeWidth="1.5" fill="none" />
        <path d="M10 25 L60 55 L110 25" stroke="#533B3A" strokeWidth="1.5" fill="none" />
        <rect x="50" y="50" width="20" height="18" rx="2" stroke="#533B3A" strokeWidth="1" fill="none" />
        <line x1="55" y1="40" x2="65" y2="40" stroke="#533B3A" strokeWidth="1" strokeLinecap="round" />
        <line x1="60" y1="40" x2="60" y2="50" stroke="#533B3A" strokeWidth="1" strokeLinecap="round" />
      </svg>
      <h3 className="font-heading text-2xl text-accent mb-2">No letters waiting.</h3>
      <p className="text-text-secondary text-sm max-w-xs mb-6">
        Write your first message to the future.
      </p>
      <button
        onClick={onCreateClick}
        className="px-6 py-2.5 bg-accent text-[#F7F4EF] rounded-lg text-sm font-medium hover:bg-accent-hover transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
      >
        Create Letter
      </button>
    </div>
  )
}
