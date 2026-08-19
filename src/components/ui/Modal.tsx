'use client'

import { useEffect, useCallback } from 'react'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
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
          shadow-lg p-6 animate-fade-in-scale
        `}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between mb-5">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-bold text-text-primary"
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>
              )}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-bg-card-hover transition-colors"
                aria-label="Cerrar"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        {children}
      </div>
    </div>
  )
}
