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

export const toast = {
  success: (message: string) => dispatch('success', message),
  error: (message: string) => dispatch('error', message),
}

export function useToast() {
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

  return { toast, toasts, dismiss }
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="adm-toast-container">
      {toasts.map((t) => (
        <ToastMessage key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  )
}

function ToastMessage({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const Icon = item.variant === 'success' ? CheckCircle : XCircle

  return (
    <div className={`adm-toast adm-toast--${item.variant}`}>
      <Icon size={16} />
      <span>{item.message}</span>
    </div>
  )
}
