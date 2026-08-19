'use client'

import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react'
import Button from '@/components/ui/Button'

interface JoinCodeInputProps {
  onSubmit: (code: string) => Promise<void>
  loading?: boolean
  error?: string
}

const CODE_LENGTH = 4 // 4 chars per segment

export default function JoinCodeInput({
  onSubmit,
  loading = false,
  error,
}: JoinCodeInputProps) {
  const [segment1, setSegment1] = useState('')
  const [segment2, setSegment2] = useState('')
  const input1Ref = useRef<HTMLInputElement>(null)
  const input2Ref = useRef<HTMLInputElement>(null)

  // Filtrar caracteres ambiguos (RN-004: excluir O, 0, I, 1)
  const filterChars = (value: string): string => {
    return value
      .toUpperCase()
      .replace(/[^A-HJ-NP-Z2-9]/g, '') // Solo caracteres válidos del join_code
      .slice(0, CODE_LENGTH)
  }

  const handleSegment1Change = (value: string) => {
    const filtered = filterChars(value)
    setSegment1(filtered)
    if (filtered.length === CODE_LENGTH) {
      input2Ref.current?.focus()
    }
  }

  const handleSegment2Change = (value: string) => {
    const filtered = filterChars(value)
    setSegment2(filtered)
  }

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    segment: 'first' | 'second'
  ) => {
    if (e.key === 'Backspace' && segment === 'second' && segment2 === '') {
      input1Ref.current?.focus()
    }
  }

  // Manejar pegado de código completo (ej. "ABCD-EFGH")
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').trim()
    const parts = pasted.split('-')

    if (parts.length === 2) {
      e.preventDefault()
      const s1 = filterChars(parts[0])
      const s2 = filterChars(parts[1])
      setSegment1(s1)
      setSegment2(s2)
      if (s2.length > 0) {
        input2Ref.current?.focus()
      }
    }
  }

  const handleSubmit = async () => {
    const code = `${segment1}-${segment2}`
    if (segment1.length === CODE_LENGTH && segment2.length === CODE_LENGTH) {
      await onSubmit(code)
    }
  }

  const isComplete =
    segment1.length === CODE_LENGTH && segment2.length === CODE_LENGTH

  return (
    <div className="text-center space-y-5 animate-fade-in">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-primary-soft mb-2">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      </div>

      <h3 className="text-lg font-bold text-text-primary">
        Unirte a un espacio
      </h3>
      <p className="text-sm text-text-muted">
        Ingresa el código que te compartió tu pareja
      </p>

      {/* Code Input */}
      <div className="flex items-center justify-center gap-3">
        <input
          ref={input1Ref}
          type="text"
          value={segment1}
          onChange={(e) => handleSegment1Change(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'first')}
          onPaste={handlePaste}
          maxLength={CODE_LENGTH}
          placeholder="XXXX"
          className="w-28 text-center text-2xl font-mono font-bold tracking-[0.2em] bg-bg-input border border-border rounded-[var(--radius-lg)] py-3 text-text-primary placeholder:text-text-muted/30 outline-none focus:border-accent-primary focus:shadow-[0_0_0_3px_var(--accent-primary-soft)] transition-all"
          autoFocus
        />
        <span className="text-2xl font-bold text-text-muted">—</span>
        <input
          ref={input2Ref}
          type="text"
          value={segment2}
          onChange={(e) => handleSegment2Change(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'second')}
          maxLength={CODE_LENGTH}
          placeholder="XXXX"
          className="w-28 text-center text-2xl font-mono font-bold tracking-[0.2em] bg-bg-input border border-border rounded-[var(--radius-lg)] py-3 text-text-primary placeholder:text-text-muted/30 outline-none focus:border-accent-primary focus:shadow-[0_0_0_3px_var(--accent-primary-soft)] transition-all"
        />
      </div>

      {error && (
        <p className="text-sm text-danger animate-slide-down">{error}</p>
      )}

      <Button
        fullWidth
        size="lg"
        onClick={handleSubmit}
        loading={loading}
        disabled={!isComplete}
      >
        Unirme al espacio
      </Button>
    </div>
  )
}
