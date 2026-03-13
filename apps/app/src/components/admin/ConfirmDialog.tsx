import { AlertTriangle } from 'lucide-react'
import AdminModal from './AdminModal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  loading?: boolean
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }: ConfirmDialogProps) {
  return (
    <AdminModal open={open} onClose={onClose} title={title} size="sm">
      <div className="adm-confirm-body">
        <AlertTriangle size={36} className="adm-confirm-icon" />
        <p className="adm-confirm-message">{message}</p>
      </div>
      <div className="adm-confirm-actions">
        <button type="button" className="adm-btn adm-btn--outline" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button type="button" className="adm-btn adm-btn--danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting...' : 'Confirm'}
        </button>
      </div>
    </AdminModal>
  )
}
