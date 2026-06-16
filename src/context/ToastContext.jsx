import { useState, useCallback } from 'react'
import { CheckCircle, XCircle, Info } from 'lucide-react'
import { ToastContext } from './useToast'

let _nextId = 1
const EXIT_MS = 200

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), EXIT_MS)
  }, [])

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = _nextId++
    setToasts(prev => [...prev, { id, message, type, exiting: false }])
    setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0 z-[9999] flex flex-col gap-2 items-center sm:items-end pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

const STYLES = {
  success: 'border-green/40  bg-green/8  text-green',
  error:   'border-danger/40 bg-danger/8 text-danger',
  info:    'border-brand/40  bg-brand/8  text-brand',
}

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
}

function ToastItem({ toast, onDismiss }) {
  const Icon = ICONS[toast.type] ?? Info
  const style = STYLES[toast.type] ?? STYLES.info

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-lg border backdrop-blur-sm font-sans text-sm shadow-xl cursor-pointer ${style}`}
      style={{
        animation: `${toast.exiting ? 'fadeOutDown' : 'fadeInUp'} ${EXIT_MS}ms ease forwards`,
        minWidth: 200,
        maxWidth: 340,
      }}
      onClick={() => onDismiss(toast.id)}
    >
      <Icon size={15} className="shrink-0" />
      <span>{toast.message}</span>
    </div>
  )
}
