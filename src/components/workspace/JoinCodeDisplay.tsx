'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { CheckCircle2, Copy, Check } from 'lucide-react'

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
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success-soft text-success mb-2 shadow-sm">
        <CheckCircle2 size={32} />
      </div>

      <h3 className="text-lg font-bold text-text-primary">
        ¡Espacio creado!
      </h3>
      <p className="text-sm text-text-muted">
        Comparte este código con tu pareja para que se una:
      </p>

      {/* Code Display */}
      <div className="relative flex justify-center">
        <div
          className="inline-flex items-center justify-center flex-wrap gap-0.5 max-w-full px-4 py-3 sm:px-8 sm:py-4 rounded-[var(--radius-xl)] bg-bg-surface border border-border text-2xl sm:text-3xl font-mono font-bold tracking-[0.18em] sm:tracking-[0.25em] text-accent-primary select-all cursor-pointer shadow-inner"
          onClick={handleCopy}
        >
          {code.split('').map((char, i) => (
            <span
              key={i}
              className={char === '-' ? 'text-text-muted mx-0.5 sm:mx-1' : ''}
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
        icon={copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
      >
        {copied ? '¡Copiado!' : 'Copiar código'}
      </Button>

      <p className="text-xs text-text-muted mt-4">
        💡 El código es de un solo uso
      </p>
    </div>
  )
}
