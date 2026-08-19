'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { requestNotificationPermission, sendMobileNotification } from '@/lib/utils/notifications'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import {
  Bell,
  BellRing,
  Smartphone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  User,
  Palette,
  Users2,
  AlertTriangle,
} from 'lucide-react'

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { theme, setTheme, themes } = useTheme()

  // Profile editing
  const [name, setName] = useState(profile?.name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Notification state
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')
  const [testingNotif, setTestingNotif] = useState(false)
  const [notifSent, setNotifSent] = useState(false)

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

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission)
    }
  }, [])

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

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission()
    setNotifPermission(perm)
    if (perm === 'granted') {
      sendMobileNotification('¡Notificaciones Activadas! 🔔', {
        body: 'Recibirás avisos de abonos de tu pareja y recordatorios de gastos.',
        data: { url: '/settings' },
      })
    }
  }

  const handleTestNotification = async () => {
    setTestingNotif(true)
    const success = await sendMobileNotification('🔔 Notificación de prueba en Tándem', {
      body: '¡Excelente! Las notificaciones al celular están 100% activas y sincronizadas.',
      data: { url: '/dashboard' },
    })
    if (success) {
      setNotifSent(true)
      setTimeout(() => setNotifSent(false), 3000)
    }
    setTestingNotif(false)
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
    <div className="space-y-6 animate-fade-in max-w-2xl pb-10">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
          Ajustes
        </h2>
        <p className="text-text-muted text-sm mt-1">
          Personaliza tu experiencia, notificaciones e identidad de la app
        </p>
      </header>

      {/* ===== Profile Section ===== */}
      <section className="glass-card p-6 space-y-4">
        <h3 className="font-bold text-text-primary flex items-center gap-2">
          <User size={18} className="text-accent-primary" />
          Perfil de Usuario
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

      {/* ===== Mobile & Push Notifications Section ===== */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text-primary flex items-center gap-2">
            <Smartphone size={18} className="text-pink-400" />
            Notificaciones al Celular
          </h3>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
              notifPermission === 'granted'
                ? 'bg-success-soft border-success/30 text-success'
                : notifPermission === 'denied'
                  ? 'bg-danger-soft border-danger/30 text-danger'
                  : 'bg-warning-soft border-warning/30 text-warning'
            }`}
          >
            {notifPermission === 'granted'
              ? '✓ Activadas'
              : notifPermission === 'denied'
                ? 'Bloqueadas'
                : 'Pendiente'}
          </span>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          Recibe notificaciones en tu teléfono cuando tu pareja haga un abono a una meta, cuando se agregue un gasto o cuando un recibo esté próximo a vencer.
        </p>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {notifPermission !== 'granted' ? (
            <Button
              size="sm"
              onClick={handleEnableNotifications}
              icon={<BellRing size={14} />}
            >
              Activar Notificaciones en este Dispositivo
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleTestNotification}
              loading={testingNotif}
              icon={<Bell size={14} />}
            >
              {notifSent ? '✓ Notificación enviada' : 'Enviar notificación de prueba'}
            </Button>
          )}
        </div>
      </section>

      {/* ===== Visual Identity & Logo Section ===== */}
      <section className="glass-card p-6 space-y-4">
        <h3 className="font-bold text-text-primary flex items-center gap-2">
          <ImageIcon size={18} className="text-indigo-400" />
          Logo e Icono de la App (Google Play Store & PWA)
        </h3>

        <div className="flex items-center gap-4 p-4 rounded-[var(--radius-lg)] bg-bg-surface border border-border">
          <div className="w-16 h-16 rounded-[var(--radius-lg)] bg-bg-card border border-border flex items-center justify-center p-2 shrink-0 shadow-md">
            <img
              src="/icons/icon.svg"
              alt="Logo Tándem"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-bold text-text-primary text-sm">
              Logo Oficial de Tándem
            </p>
            <p className="text-text-muted">
              Ubicación de archivo: <code className="text-accent-primary font-mono">public/icons/icon.svg</code>
            </p>
            <p className="text-text-muted">
              Para cambiar el logo con tu diseño propio, solo reemplaza este archivo o coloca tu imagen PNG en <code className="font-mono text-text-primary">public/icons/</code>.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Theme Section (RF-003) ===== */}
      <section className="glass-card p-6 space-y-4">
        <h3 className="font-bold text-text-primary flex items-center gap-2">
          <Palette size={18} className="text-amber-400" />
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
          <Users2 size={18} className="text-emerald-400" />
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
          <AlertTriangle size={18} />
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
