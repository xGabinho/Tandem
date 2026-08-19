'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { triggerCelebrationConfetti } from '@/lib/utils/confetti'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      triggerCelebrationConfetti()
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center py-4 space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-success-soft text-success flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 size={32} />
        </div>

        <h2 className="text-2xl font-bold text-text-primary">
          ¡Contraseña Actualizada! 🎉
        </h2>

        <p className="text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
          Tu nueva contraseña ha sido guardada exitosamente. Ya puedes continuar usando tu espacio en Tándem.
        </p>

        <Link
          href="/dashboard"
          className="inline-block w-full py-3 px-4 rounded-[var(--radius-lg)] font-bold text-white shadow-md transition-all text-sm mt-2"
          style={{ background: 'var(--accent-gradient)' }}
        >
          Ir al Dashboard
        </Link>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-xl font-bold text-text-primary mb-1">
        Nueva Contraseña
      </h2>
      <p className="text-sm text-text-muted mb-6">
        Ingresa tu nueva clave de acceso para tu cuenta
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nueva contraseña"
          type={showPassword ? 'text' : 'password'}
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          hint="Mínimo 8 caracteres"
          icon={<Lock size={16} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-text-muted hover:text-text-primary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <Input
          label="Confirmar nueva contraseña"
          type={showPassword ? 'text' : 'password'}
          placeholder="Repite tu nueva contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          icon={<Lock size={16} />}
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
          Guardar Nueva Contraseña
        </Button>
      </form>
    </>
  )
}
