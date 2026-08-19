'use client'

import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showClose?: boolean
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        style={{ animationDuration: '0.2s' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`
          relative w-full ${sizeStyles[size]}
          bg-bg-card border border-border rounded-[var(--radius-xl)]
          shadow-2xl p-5 sm:p-6 animate-fade-in-scale
          max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)]
          flex flex-col my-auto z-10
        `}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between mb-4 shrink-0 pb-1">
            <div className="pr-4">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-bold text-text-primary leading-snug"
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm text-text-muted mt-0.5">{subtitle}</p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-bg-card-hover transition-colors shrink-0 -mr-1 -mt-1"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body (Scrollable if content overflows viewport) */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 -mr-2 pr-2">
          {children}
        </div>
      </div>
    </div>
  )
}
