'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const MAX_ATTEMPTS = 3
const LOCKOUT_DURATION = 5 * 60 * 1000 // 5 minutos en ms (RN-002)

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Rate limiting local (RN-002)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)

  const isLocked = lockedUntil && Date.now() < lockedUntil

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Verificar bloqueo
    if (isLocked) {
      const remaining = Math.ceil(
        ((lockedUntil as number) - Date.now()) / 60000
      )
      setError(
        `Demasiados intentos. Intenta de nuevo en ${remaining} minuto(s).`
      )
      return
    }

    if (!email || !password) {
      setError('Por favor completa todos los campos.')
      return
    }

    setLoading(true)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      if (newAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_DURATION)
        setError(
          'Has superado el límite de intentos. Espera 5 minutos para volver a intentarlo.'
        )
        // Resetear después del periodo de bloqueo
        setTimeout(() => {
          setAttempts(0)
          setLockedUntil(null)
        }, LOCKOUT_DURATION)
      } else {
        setError(
          `Credenciales inválidas. ${MAX_ATTEMPTS - newAttempts} intento(s) restante(s).`
        )
      }
    } else {
      router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <>
      <h2 className="text-xl font-bold text-text-primary mb-1">
        Iniciar Sesión
      </h2>
      <p className="text-sm text-text-muted mb-6">
        Ingresa a tu espacio compartido
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          }
        />

        <Input
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-text-muted hover:text-text-primary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          }
        />

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] bg-danger-soft text-danger text-sm animate-slide-down">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          disabled={!!isLocked}
        >
          Entrar
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted mt-6">
        ¿No tienes cuenta?{' '}
        <Link
          href="/auth/register"
          className="text-accent-primary hover:text-accent-primary-hover font-semibold transition-colors"
        >
          Regístrate
        </Link>
      </p>
    </>
  )
}
