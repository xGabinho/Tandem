'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface JoinCodeDisplayProps {
  code: string
}

export default function JoinCodeDisplay({ code }: JoinCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = code
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="text-center space-y-4 animate-fade-in">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success-soft mb-2">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h3 className="text-lg font-bold text-text-primary">
        ¡Espacio creado!
      </h3>
      <p className="text-sm text-text-muted">
        Comparte este código con tu pareja para que se una:
      </p>

      {/* Code Display */}
      <div className="relative">
        <div
          className="inline-flex items-center gap-0.5 px-8 py-4 rounded-[var(--radius-xl)] bg-bg-surface border border-border text-3xl font-mono font-bold tracking-[0.3em] text-accent-primary select-all cursor-pointer"
          onClick={handleCopy}
        >
          {code.split('').map((char, i) => (
            <span
              key={i}
              className={char === '-' ? 'text-text-muted mx-1' : ''}
              style={{
                animationDelay: `${i * 0.05}s`,
              }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>

      <Button
        variant={copied ? 'secondary' : 'outline'}
        size="sm"
        onClick={handleCopy}
        icon={
          copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          )
        }
      >
        {copied ? '¡Copiado!' : 'Copiar código'}
      </Button>

      <p className="text-xs text-text-muted mt-4">
        💡 El código es de un solo uso
      </p>
    </div>
  )
}
