import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface AdminModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'default' | 'lg'
}

export default function AdminModal({ open, onClose, title, children, size = 'default' }: AdminModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const sizeClass = size === 'sm' ? ' adm-modal--sm' : size === 'lg' ? ' adm-modal--lg' : ''

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className={`adm-modal${sizeClass}`} onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h2 className="adm-modal-title">{title}</h2>
          <button type="button" className="adm-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="adm-modal-body">{children}</div>
      </div>
    </div>
  )
}
