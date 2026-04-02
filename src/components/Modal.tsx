import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

export function Modal({ open, onClose, children, wide = false }: ModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-5"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-surface border border-border rounded-2xl p-7 w-full animate-modal-in
        ${wide ? 'max-w-[860px] max-h-[90vh] flex flex-col' : 'max-w-[480px]'}`}>
        {children}
      </div>
    </div>
  )
}
