'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor ingresa un correo electrónico válido.')
      return
    }

    setLoading(true)

    // Redirige al usuario a /auth/reset-password
    const redirectUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/reset-password`
        : undefined

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: redirectUrl,
      }
    )

    if (resetError) {
      setError(resetError.message)
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center py-4 space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-success-soft text-success flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 size={32} />
        </div>

        <h2 className="text-2xl font-bold text-text-primary">
          ¡Correo Enviado! ✉️
        </h2>

        <p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
          Hemos enviado las instrucciones para restablecer tu contraseña a <strong className="text-accent-primary font-semibold">{email}</strong>.
        </p>

        <div className="p-4 rounded-[var(--radius-lg)] bg-bg-surface border border-border text-xs text-text-muted text-left space-y-2">
          <p className="font-semibold text-text-primary">Pasos a seguir:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Abre el correo que acabas de recibir de Tándem.</li>
            <li>Haz clic en el enlace para crear tu nueva contraseña.</li>
            <li>Si no lo ves en tu bandeja, revisa tu carpeta de <strong>Spam</strong>.</li>
          </ol>
        </div>

        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-[var(--radius-lg)] font-bold text-white shadow-md transition-all text-sm mt-2"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <ArrowLeft size={16} /> Volver al Inicio de Sesión
        </Link>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-xl font-bold text-text-primary mb-1">
        Recuperar Contraseña
      </h2>
      <p className="text-sm text-text-muted mb-6">
        Ingresa tu correo y te enviaremos un enlace para restablecer tu acceso
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          icon={<Mail size={16} />}
        />

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] bg-danger-soft text-danger text-sm animate-slide-down">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
        >
          Enviar Enlace de Recuperación
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted mt-6">
        ¿Recordaste tu contraseña?{' '}
        <Link
          href="/auth/login"
          className="text-accent-primary hover:text-accent-primary-hover font-semibold transition-colors"
        >
          Inicia Sesión
        </Link>
      </p>
    </>
  )
}
