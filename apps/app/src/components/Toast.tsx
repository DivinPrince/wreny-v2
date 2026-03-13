import { useCallback, useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

interface ToastItem {
  id: number
  message: string
  variant: 'success' | 'error'
}

let listeners: Array<(t: ToastItem) => void> = []
let nextId = 0

function dispatch(variant: ToastItem['variant'], message: string) {
  const item: ToastItem = { id: nextId++, message, variant }
  listeners.forEach((fn) => fn(item))
}

export const cartToast = {
  success: (message: string) => dispatch('success', message),
  error: (message: string) => dispatch('error', message),
}

function useStorefrontToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handler = (item: ToastItem) => {
      setToasts((prev) => [...prev, item])
    }
    listeners.push(handler)
    return () => {
      listeners = listeners.filter((fn) => fn !== handler)
    }
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, dismiss }
}

export function StorefrontToastContainer() {
  const { toasts, dismiss } = useStorefrontToast()

  return (
    <div className="sf-toast-container">
      {toasts.map((t) => (
        <StorefrontToastMessage key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  )
}

function StorefrontToastMessage({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const Icon = item.variant === 'success' ? CheckCircle : XCircle

  return (
    <div className={`sf-toast sf-toast--${item.variant}`}>
      <Icon size={16} />
      <span>{item.message}</span>
    </div>
  )
}
