'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose: () => void
}

const icons = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
}

const typeStyles = {
  success: 'bg-success-soft text-success border-success/20',
  error: 'bg-danger-soft text-danger border-danger/20',
  info: 'bg-info-soft text-info border-info/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
}

export default function Toast({
  message,
  type = 'info',
  duration = 4000,
  onClose,
}: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-[100] flex items-center gap-3
        px-5 py-3.5 rounded-[var(--radius-lg)] border
        shadow-lg backdrop-blur-md
        ${typeStyles[type]}
        ${visible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}
        transition-all duration-300
      `}
      role="alert"
    >
      <span className="shrink-0">{icons[type]}</span>
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(onClose, 300)
        }}
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Cerrar notificación"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

/**
 * Container for managing multiple toasts via state.
 * Usage:
 *   const [toasts, setToasts] = useState<ToastData[]>([])
 *   addToast({ message: 'Saved!', type: 'success' })
 */
export interface ToastData {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastData[]
  onRemove: (id: string) => void
}) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      {toasts.map((t, i) => (
        <div
          key={t.id}
          style={{ transform: `translateY(-${i * 4}px)` }}
        >
          <Toast
            message={t.message}
            type={t.type}
            onClose={() => onRemove(t.id)}
          />
        </div>
      ))}
    </div>
  )
}
