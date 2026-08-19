'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import {
  calculateGoalProgress,
  calculateInstallment,
  formatCurrency,
} from '@/lib/utils/calculations'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import AddContributionModal from '@/components/contributions/AddContributionModal'
import ConvertGoalDialog from '@/components/goals/ConvertGoalDialog'
import SkeletonLoader from '@/components/ui/SkeletonLoader'

type GoalRow = Database['public']['Tables']['goals']['Row']
type ContributionRow = Database['public']['Tables']['contributions']['Row']

const typeConfig = {
  savings: { label: 'Ahorro', emoji: '💰', variant: 'success' as const },
  quoting: { label: 'Cotización', emoji: '🔍', variant: 'info' as const },
  experience: { label: 'Experiencia', emoji: '⭐', variant: 'accent' as const },
}

const priorityConfig = {
  high: { label: 'Alta', variant: 'danger' as const },
  medium: { label: 'Media', variant: 'warning' as const },
  low: { label: 'Baja', variant: 'success' as const },
}

export default function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [goal, setGoal] = useState<GoalRow | null>(null)
  const [contributions, setContributions] = useState<ContributionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddContribution, setShowAddContribution] = useState(false)
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingStatus, setTogglingStatus] = useState(false)

  const fetchData = async () => {
    setLoading(true)

    const [goalRes, contribRes] = await Promise.all([
      supabase.from('goals').select('*').eq('id', id).single(),
      supabase
        .from('contributions')
        .select('*, users(name)')
        .eq('goal_id', id)
        .order('created_at', { ascending: false }),
    ])

    if (goalRes.data) setGoal(goalRes.data)
    if (contribRes.data) setContributions(contribRes.data as ContributionRow[])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0)

  const progress =
    goal?.type === 'savings' && goal.target_amount
      ? calculateGoalProgress(goal.target_amount, totalContributions)
      : null

  const installment =
    goal?.type === 'savings' && goal.target_amount && goal.target_date
      ? calculateInstallment(
          goal.target_amount,
          totalContributions,
          goal.target_date
        )
      : null

  // RN-014: Solo el usuario que registró el abono puede eliminarlo
  const handleDeleteContribution = async (contribId: string) => {
    setDeletingId(contribId)
    const { error } = await supabase
      .from('contributions')
      .delete()
      .eq('id', contribId)

    if (!error) {
      fetchData()
    }
    setDeletingId(null)
  }

  // RF-009 / RN-009: Cambiar estado (pending / in_progress / completed)
  const handleToggleStatus = async () => {
    if (!goal) return
    setTogglingStatus(true)
    const newStatus = goal.status === 'completed' ? 'in_progress' : 'completed'
    const { error } = await supabase
      .from('goals')
      .update({ status: newStatus })
      .eq('id', goal.id)

    if (!error) {
      fetchData()
    }
    setTogglingStatus(false)
  }

  // Eliminar meta
  const handleDeleteGoal = async () => {
    if (!goal) return
    if (!confirm('¿Estás seguro de eliminar esta meta?')) return
    const { error } = await supabase.from('goals').delete().eq('id', goal.id)
    if (!error) {
      router.push('/goals')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader width="w-48" height="h-8" />
        <SkeletonLoader width="w-full" height="h-60" />
        <SkeletonLoader lines={3} />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-lg font-bold text-text-primary">
          Meta no encontrada
        </p>
        <Button onClick={() => router.push('/goals')} variant="ghost" className="mt-4">
          ← Volver a metas
        </Button>
      </div>
    )
  }

  const type = typeConfig[goal.type]
  const priority = priorityConfig[goal.priority]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => router.push('/goals')}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Volver a metas
      </button>

      {/* Hero Image */}
      {goal.image_url && (
        <div className="w-full h-48 md:h-64 rounded-[var(--radius-xl)] overflow-hidden">
          <img
            src={goal.image_url}
            alt={goal.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Title + badges + actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant={type.variant}>{type.emoji} {type.label}</Badge>
            <Badge variant={priority.variant} dot>{priority.label}</Badge>
            {goal.status === 'completed' && (
              <Badge variant="success">✓ Completada</Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
            {goal.title}
          </h1>
          {goal.target_date && (
            <p className="text-sm text-text-muted mt-1">
              📅 Objetivo: {new Date(goal.target_date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* Goal Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {goal.type === 'quoting' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowConvertDialog(true)}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              }
            >
              Convertir a Ahorro
            </Button>
          )}

          <Button
            size="sm"
            variant={goal.status === 'completed' ? 'secondary' : 'outline'}
            onClick={handleToggleStatus}
            loading={togglingStatus}
          >
            {goal.status === 'completed' ? '✓ Completada' : 'Marcar completada'}
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={handleDeleteGoal}
            title="Eliminar meta"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            }
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* Progress Section (savings only) */}
      {progress && goal.target_amount && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-text-muted">Progreso</p>
              <p className="text-3xl font-bold text-text-primary">
                {Math.round(progress.percentage)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-muted">Ahorrado</p>
              <p className="text-lg font-bold text-accent-primary">
                ${formatCurrency(progress.saved)}
              </p>
              <p className="text-xs text-text-muted">
                de ${formatCurrency(goal.target_amount)}
              </p>
            </div>
          </div>
          <div className="w-full h-3 bg-bg-card-hover rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress.percentage}%`,
                background: 'var(--accent-gradient)',
              }}
            />
          </div>

          {/* Installment projection */}
          {installment && installment.remainingAmount > 0 && (
            <div className="flex gap-4 pt-2 text-sm">
              <div className="flex-1 p-3 rounded-[var(--radius-md)] bg-bg-surface">
                <p className="text-text-muted text-xs">Cuota {installment.frequencyLabel}</p>
                <p className="font-bold text-text-primary">
                  ${formatCurrency(installment.installmentAmount)}
                </p>
              </div>
              <div className="flex-1 p-3 rounded-[var(--radius-md)] bg-bg-surface">
                <p className="text-text-muted text-xs">Períodos restantes</p>
                <p className="font-bold text-text-primary">
                  {installment.periodsRemaining}
                </p>
              </div>
              <div className="flex-1 p-3 rounded-[var(--radius-md)] bg-bg-surface">
                <p className="text-text-muted text-xs">Faltante</p>
                <p className="font-bold text-danger">
                  ${formatCurrency(installment.remainingAmount)}
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={() => setShowAddContribution(true)}
            fullWidth
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            }
          >
            Registrar Abono
          </Button>
        </div>
      )}

      {/* Reference Links (quoting only) */}
      {goal.type === 'quoting' && goal.reference_links && (
        <div className="glass-card p-6">
          <h3 className="font-bold text-text-primary mb-3">
            🔗 Enlaces de referencia
          </h3>
          <div className="space-y-2">
            {(Array.isArray(goal.reference_links)
              ? goal.reference_links
              : []
            ).map((link, i) => (
              <a
                key={i}
                href={String(link)}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-[var(--radius-md)] bg-bg-surface text-sm text-accent-primary hover:bg-bg-card-hover transition-colors truncate"
              >
                {String(link)}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Contributions List */}
      {contributions.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-bold text-text-primary mb-4">
            💳 Historial de Abonos ({contributions.length})
          </h3>
          <div className="space-y-2">
            {contributions.map((c) => {
              const contribUser = (c as Record<string, unknown>).users as
                | { name: string }
                | null
              const canDelete = c.user_id === user?.id

              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-bg-surface group"
                >
                  <div className="w-8 h-8 rounded-full bg-accent-primary-soft flex items-center justify-center text-xs font-bold text-accent-primary shrink-0">
                    {contribUser?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      ${formatCurrency(c.amount)}
                      {c.note && (
                        <span className="text-text-muted font-normal ml-2">
                          — {c.note}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-muted">
                      {contribUser?.name || 'Usuario'} · {new Date(c.created_at || '').toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteContribution(c.id)}
                      disabled={deletingId === c.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-text-muted hover:text-danger hover:bg-danger-soft transition-all"
                      title="Eliminar abono"
                    >
                      {deletingId === c.id ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Contribution Modal */}
      {goal && (
        <AddContributionModal
          isOpen={showAddContribution}
          onClose={() => setShowAddContribution(false)}
          onAdded={fetchData}
          goal={goal}
          currentTotal={totalContributions}
        />
      )}

      {/* Convert Goal Dialog (RF-011) */}
      {goal && goal.type === 'quoting' && (
        <ConvertGoalDialog
          isOpen={showConvertDialog}
          onClose={() => setShowConvertDialog(false)}
          onConverted={fetchData}
          goal={goal}
        />
      )}
    </div>
  )
}
