import type { ReactNode } from 'react'

interface ActionMenuItemProps {
  onClick: () => void
  children: ReactNode
  variant?: 'default' | 'danger'
}

export default function ActionMenuItem({ onClick, children, variant = 'default' }: ActionMenuItemProps) {
  return (
    <button
      type="button"
      className={`adm-dropdown-item${variant === 'danger' ? ' adm-dropdown-item--danger' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
