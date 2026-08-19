'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { theme, setTheme, themes } = useTheme()

  // Profile editing
  const [name, setName] = useState(profile?.name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Dissolution
  const [showDissolve, setShowDissolve] = useState(false)
  const [dissolveConfirm, setDissolveConfirm] = useState('')
  const [dissolving, setDissolving] = useState(false)

  // Workspace info
  const [workspaceUsers, setWorkspaceUsers] = useState<
    { id: string; name: string }[]
  >([])
  const [joinCode, setJoinCode] = useState<string | null>(null)
  const [loadingWorkspace, setLoadingWorkspace] = useState(false)

  // Load workspace info
  useEffect(() => {
    async function loadWorkspaceInfo() {
      if (!profile?.workspace_id) return
      setLoadingWorkspace(true)

      const [usersRes, wsRes] = await Promise.all([
        supabase
          .from('users')
          .select('id, name')
          .eq('workspace_id', profile.workspace_id),
        supabase
          .from('workspaces')
          .select('join_code')
          .eq('id', profile.workspace_id)
          .single(),
      ])

      if (usersRes.data) setWorkspaceUsers(usersRes.data)
      if (wsRes.data) setJoinCode(wsRes.data.join_code)
      setLoadingWorkspace(false)
    }

    loadWorkspaceInfo()
  }, [profile?.workspace_id])

  const handleSaveProfile = async () => {
    if (!user || !name.trim()) return
    setSavingProfile(true)

    await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', user.id)

    await refreshProfile()
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
    setSavingProfile(false)
  }

  // RF-006 / RN-006: Disolver vínculo
  const handleDissolve = async () => {
    if (!user || !profile?.workspace_id) return
    if (dissolveConfirm !== 'CONFIRMAR') return

    setDissolving(true)

    // Archivar metas
    await supabase
      .from('goals')
      .update({ status: 'completed' })
      .eq('workspace_id', profile.workspace_id)

    // Desvincular
    await supabase
      .from('users')
      .update({ workspace_id: null })
      .eq('id', user.id)

    await refreshProfile()
    setShowDissolve(false)
    setDissolving(false)
  }

  const partner = workspaceUsers.find((u) => u.id !== user?.id)

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
          Ajustes
        </h2>
        <p className="text-text-muted text-sm mt-1">
          Personaliza tu experiencia
        </p>
      </header>

      {/* ===== Profile Section ===== */}
      <section className="glass-card p-6 space-y-4">
        <h3 className="font-bold text-text-primary flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Perfil
        </h3>

        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
        />

        <Button
          onClick={handleSaveProfile}
          loading={savingProfile}
          size="sm"
          variant={profileSaved ? 'secondary' : 'primary'}
        >
          {profileSaved ? '✓ Guardado' : 'Guardar cambios'}
        </Button>
      </section>

      {/* ===== Theme Section (RF-003) ===== */}
      <section className="glass-card p-6 space-y-4">
        <h3 className="font-bold text-text-primary flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
            <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
            <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
            <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          </svg>
          Tema Visual
        </h3>
        <p className="text-xs text-text-muted">
          Tu preferencia se aplica solo a tu vista (RN-003)
        </p>

        <div className="grid grid-cols-2 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`
                p-4 rounded-[var(--radius-lg)] border transition-all text-left
                ${
                  theme === t.id
                    ? 'border-accent-primary shadow-[0_0_0_2px_var(--accent-primary-soft)]'
                    : 'border-border hover:border-border-hover'
                }
              `}
            >
              <div className="flex gap-1.5 mb-2">
                {t.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border border-white/10"
                    style={{ background: color }}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {t.label}
              </p>
              {theme === t.id && (
                <p className="text-[10px] text-accent-primary mt-0.5">
                  ✓ Activo
                </p>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ===== Workspace Section ===== */}
      <section className="glass-card p-6 space-y-4">
        <h3 className="font-bold text-text-primary flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Espacio Compartido
        </h3>

        {profile?.workspace_id ? (
          <div className="space-y-3">
            {joinCode && (
              <div className="p-3 rounded-[var(--radius-md)] bg-bg-surface">
                <p className="text-xs text-text-muted">Código del espacio</p>
                <p className="text-lg font-mono font-bold text-accent-primary tracking-wider">
                  {joinCode}
                </p>
              </div>
            )}

            {partner && (
              <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-bg-surface">
                <div className="w-10 h-10 rounded-full bg-accent-secondary/20 flex items-center justify-center text-sm font-bold text-accent-secondary">
                  {partner.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {partner.name}
                  </p>
                  <p className="text-xs text-text-muted">Tu pareja</p>
                </div>
              </div>
            )}

            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDissolve(true)}
            >
              Disolver vínculo de pareja
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-text-muted">
              No estás vinculado a ningún espacio.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => (window.location.href = '/onboarding')}
            >
              Ir al Onboarding
            </Button>
          </div>
        )}
      </section>

      {/* ===== Danger Zone ===== */}
      <section className="glass-card p-6 border-danger/20">
        <h3 className="font-bold text-danger flex items-center gap-2 mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Zona de Peligro
        </h3>
        <Button variant="danger" size="sm" onClick={signOut}>
          Cerrar sesión
        </Button>
      </section>

      {/* Dissolve Modal (RN-006: double confirmation) */}
      <Modal
        isOpen={showDissolve}
        onClose={() => {
          setShowDissolve(false)
          setDissolveConfirm('')
        }}
        title="⚠️ Disolver Vínculo"
        subtitle="Esta acción archivará todas las metas conjuntas"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-[var(--radius-md)] bg-danger-soft text-danger text-sm">
            <p className="font-semibold mb-1">Advertencia:</p>
            <ul className="list-disc list-inside text-xs space-y-1">
              <li>Todas las metas pasarán a estado &quot;Archivado&quot;</li>
              <li>Los abonos registrados se conservarán</li>
              <li>Ambos usuarios serán desvinculados del espacio</li>
            </ul>
          </div>

          <Input
            label='Escribe "CONFIRMAR" para continuar'
            value={dissolveConfirm}
            onChange={(e) => setDissolveConfirm(e.target.value)}
            placeholder="CONFIRMAR"
          />

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDissolve(false)
                setDissolveConfirm('')
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDissolve}
              loading={dissolving}
              disabled={dissolveConfirm !== 'CONFIRMAR'}
              className="flex-1"
            >
              Disolver
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
