import { useEffect, useRef } from 'react'

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteModal({ isOpen, onClose, onConfirm }: DeleteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (isOpen) {
      el.showModal()
    } else {
      el.close()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-black/30 backdrop:backdrop-blur-sm bg-transparent"
    >
      <div className="paper-card-elevated rounded-lg p-6 max-w-sm mx-auto">
        <h3 className="font-heading text-xl text-accent mb-3">Delete this letter forever?</h3>
        <p className="text-text-secondary text-sm mb-6 leading-relaxed">
          This action cannot be undone. The letter and all its contents will be permanently removed.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="px-4 py-2 text-sm bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors font-medium"
          >
            Delete Forever
          </button>
        </div>
      </div>
    </dialog>
  )
}
