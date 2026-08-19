'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  createWorkspace,
  assignUserToWorkspace,
  joinWorkspace,
} from '@/lib/api/onboarding'
import JoinCodeDisplay from '@/components/workspace/JoinCodeDisplay'
import JoinCodeInput from '@/components/workspace/JoinCodeInput'
import Button from '@/components/ui/Button'
import { Users2, Plus, KeyRound, UserPlus, Sparkles } from 'lucide-react'

type Step = 'choose' | 'create' | 'join'

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>('choose')
  const [loading, setLoading] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')

  // Crear un nuevo workspace
  const handleCreate = async () => {
    if (!user) return
    setLoading(true)
    setError('')

    const { workspace, error: createError } = await createWorkspace()
    if (createError || !workspace) {
      setError(createError || 'Error al crear el espacio.')
      setLoading(false)
      return
    }

    const { error: assignError } = await assignUserToWorkspace(
      user.id,
      workspace.id
    )
    if (assignError) {
      setError(assignError)
      setLoading(false)
      return
    }

    setJoinCode(workspace.join_code || '')
    setStep('create')
    setLoading(false)
  }

  // Unirse a un workspace existente
  const handleJoin = async (code: string) => {
    if (!user) return
    setLoading(true)
    setError('')

    const { error: joinError } = await joinWorkspace(user.id, code)
    if (joinError) {
      setError(joinError)
      setLoading(false)
      return
    }

    await refreshProfile()
    router.push('/dashboard')
  }

  const handleContinueToDashboard = async () => {
    await refreshProfile()
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]"
          style={{ background: 'var(--accent-primary)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
          style={{ background: 'var(--accent-secondary)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Chooser Step */}
        {step === 'choose' && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--radius-xl)] mb-4 text-white shadow-lg"
                style={{ background: 'var(--accent-gradient)' }}
              >
                <Users2 size={32} />
              </div>
              <h1 className="text-2xl font-bold text-text-primary">
                ¡Bienvenido a Tándem!
              </h1>
              <p className="text-text-muted mt-2 text-sm">
                ¿Cómo quieres empezar?
              </p>
            </div>

            {/* Option: Create new workspace */}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full glass-card p-6 text-left group cursor-pointer hover:border-accent-primary/50 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-accent-primary-soft text-accent-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base">
                    Crear un espacio nuevo
                  </h3>
                  <p className="text-sm text-text-muted mt-1">
                    Genera un código de invitación para compartir con tu pareja
                  </p>
                </div>
              </div>
            </button>

            {/* Option: Join existing workspace */}
            <button
              onClick={() => setStep('join')}
              className="w-full glass-card p-6 text-left group cursor-pointer hover:border-accent-secondary/50 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-accent-secondary/20 text-accent-secondary flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                  <KeyRound size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base">
                    Unirme con un código
                  </h3>
                  <p className="text-sm text-text-muted mt-1">
                    Ingresa el código que te compartió tu pareja
                  </p>
                </div>
              </div>
            </button>

            {error && (
              <p className="text-sm text-danger text-center animate-slide-down">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Create Step — Show generated code */}
        {step === 'create' && (
          <div className="glass-card p-6 sm:p-8">
            <JoinCodeDisplay code={joinCode} />
            <div className="mt-6">
              <Button
                fullWidth
                size="lg"
                onClick={handleContinueToDashboard}
              >
                Ir al Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* Join Step — Enter code */}
        {step === 'join' && (
          <div className="glass-card p-8">
            <JoinCodeInput
              onSubmit={handleJoin}
              loading={loading}
              error={error}
            />
            <button
              onClick={() => {
                setStep('choose')
                setError('')
              }}
              className="w-full mt-4 text-sm text-text-muted hover:text-text-primary transition-colors text-center"
            >
              ← Volver
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
