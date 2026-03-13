import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'

interface ActionMenuProps {
  children: ReactNode
}

export default function ActionMenu({ children }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const [positioned, setPositioned] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      if (!buttonRef.current) return

      const triggerRect = buttonRef.current.getBoundingClientRect()
      const menuWidth = menuRef.current?.offsetWidth ?? 160
      const menuHeight = menuRef.current?.offsetHeight ?? 0
      const gutter = 8

      let left = triggerRect.right
      left = Math.min(left, window.innerWidth - gutter)
      left = Math.max(left, menuWidth + gutter)

      let top = triggerRect.bottom + gutter
      const wouldOverflowBottom = top + menuHeight > window.innerHeight - gutter
      if (wouldOverflowBottom) {
        top = Math.max(gutter, triggerRect.top - menuHeight - gutter)
      }

      setPosition({ top, left })
      setPositioned(true)
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        ref.current &&
        !ref.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="adm-action-menu" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        className="adm-icon-btn"
        onClick={() => {
          if (!open) {
            setPositioned(false)
          }
          setOpen((v) => !v)
        }}
        aria-label="Actions"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical size={16} />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              className="adm-dropdown"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                visibility: positioned ? 'visible' : 'hidden',
              }}
              onClick={() => setOpen(false)}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
