'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { getIncomes, getExpenses } from '@/lib/api/finances'
import { Database, IncomeRow, ExpenseRow } from '@/types/supabase'
import {
  calculateGoalProgress,
  calculateInstallment,
  calculateFinancialSummary,
  formatCurrency,
} from '@/lib/utils/calculations'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import AddContributionModal from '@/components/contributions/AddContributionModal'
import ConvertGoalDialog from '@/components/goals/ConvertGoalDialog'
import EditGoalModal from '@/components/goals/EditGoalModal'
import AffiliateLinksList from '@/components/goals/AffiliateLinksList'
import AffiliatePurchaseCelebration from '@/components/goals/AffiliatePurchaseCelebration'
import { triggerCelebrationConfetti } from '@/lib/utils/confetti'
import { usePrivacy } from '@/contexts/PrivacyContext'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import {
  PiggyBank,
  Search,
  Sparkles,
  Calendar,
  Clock,
  ArrowLeft,
  Trash2,
  Plus,
  Check,
  ExternalLink,
  Zap,
  TrendingUp,
  Pencil,
} from 'lucide-react'

type GoalRow = Database['public']['Tables']['goals']['Row']
type ContributionRow = Database['public']['Tables']['contributions']['Row']

const typeConfig = {
  savings: { label: 'Ahorro', icon: <PiggyBank size={14} className="text-emerald-400" />, variant: 'success' as const },
  quoting: { label: 'Cotización', icon: <Search size={14} className="text-blue-400" />, variant: 'info' as const },
  experience: { label: 'Experiencia', icon: <Sparkles size={14} className="text-amber-400" />, variant: 'accent' as const },
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
  const resolvedParams = use(params)
  const { id } = resolvedParams
  const { user } = useAuth()
  const { maskAmount } = usePrivacy()
  const router = useRouter()
  const [goal, setGoal] = useState<GoalRow | null>(null)
  const [contributions, setContributions] = useState<ContributionRow[]>([])
  const [incomes, setIncomes] = useState<IncomeRow[]>([])
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddContribution, setShowAddContribution] = useState(false)
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingStatus, setTogglingStatus] = useState(false)

  const fetchData = async () => {
    setLoading(true)

    const [goalRes, contribRes, incomesData, expensesData] = await Promise.all([
      supabase.from('goals').select('*').eq('id', id).single(),
      supabase
        .from('contributions')
        .select('*, users(name)')
        .eq('goal_id', id)
        .order('created_at', { ascending: false }),
      getIncomes().catch(() => [] as IncomeRow[]),
      getExpenses().catch(() => [] as ExpenseRow[]),
    ])

    if (goalRes.data) setGoal(goalRes.data)
    if (contribRes.data) setContributions(contribRes.data as ContributionRow[])
    setIncomes(incomesData)
    setExpenses(expensesData)
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

  const finances = calculateFinancialSummary(incomes, expenses)

  // Smart Projections based on Real Cashflow
  const smartProjections = (() => {
    if (!progress || progress.remaining <= 0 || finances.netBalance <= 0) return null

    const remaining = progress.remaining
    const net = finances.netBalance

    const formatProjection = (monthlyAllocation: number) => {
      const months = Math.ceil(remaining / monthlyAllocation)
      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() + months)
      const formattedDate = targetDate.toLocaleDateString('es-ES', {
        month: 'short',
        year: 'numeric',
      })
      return { months, formattedDate, amount: monthlyAllocation }
    }

    return {
      full: formatProjection(net),
      half: formatProjection(net * 0.5),
      quarter: formatProjection(net * 0.25),
    }
  })()

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
      if (newStatus === 'completed') {
        triggerCelebrationConfetti()
      }
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

  // Añadir nuevo enlace de tienda o cotización
  const handleAddReferenceLink = async (newLink: string) => {
    if (!goal) return
    const current = (Array.isArray(goal.reference_links)
      ? goal.reference_links
      : typeof goal.reference_links === 'string'
        ? (goal.reference_links as string).split('\n').filter(Boolean)
        : []) as string[]
    const updated = [...current, newLink]
    const { error } = await supabase
      .from('goals')
      .update({
        reference_links: updated as unknown as Database['public']['Tables']['goals']['Update']['reference_links'],
      })
      .eq('id', goal.id)

    if (!error) {
      fetchData()
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
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Back button */}
      <button
        onClick={() => router.push('/goals')}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={16} />
        Volver a metas
      </button>

      {/* Hero Image */}
      {goal.image_url && (
        <div className="w-full h-48 md:h-64 rounded-[var(--radius-xl)] overflow-hidden border border-border">
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
            <Badge variant={type.variant}>
              <span className="inline-flex items-center gap-1">
                {type.icon}
                {type.label}
              </span>
            </Badge>
            <Badge variant={priority.variant} dot>{priority.label}</Badge>
            {goal.status === 'completed' && (
              <Badge variant="success">
                <Check size={12} className="inline mr-1" /> Completada
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
            {goal.title}
          </h1>
          {goal.target_date && (
            <p className="text-sm text-text-muted mt-1 flex items-center gap-1.5">
              <Calendar size={14} className="text-accent-primary" />
              Objetivo: {new Date(goal.target_date).toLocaleDateString('es-ES', {
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
              icon={<Plus size={14} />}
            >
              Convertir a Ahorro
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowEditModal(true)}
            icon={<Pencil size={14} />}
          >
            Editar
          </Button>

          <Button
            size="sm"
            variant={goal.status === 'completed' ? 'secondary' : 'outline'}
            onClick={handleToggleStatus}
            loading={togglingStatus}
            icon={<Check size={14} />}
          >
            {goal.status === 'completed' ? 'Completada' : 'Marcar completada'}
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={handleDeleteGoal}
            title="Eliminar meta"
            icon={<Trash2 size={14} />}
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* Progress Section (savings only) */}
      {progress && goal.target_amount && (
        <div className="glass-card p-6 space-y-5">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-text-muted">Progreso de Ahorro</p>
              <p className="text-3xl font-bold text-text-primary">
                {Math.round(progress.percentage)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-muted">Ahorrado</p>
              <p className="text-lg font-bold text-accent-primary">
                {maskAmount(progress.saved)}
              </p>
              <p className="text-xs text-text-muted">
                de {maskAmount(goal.target_amount)}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-sm">
              <div className="p-3.5 rounded-[var(--radius-md)] bg-bg-surface border border-border">
                <p className="text-text-muted text-xs">Cuota {installment.frequencyLabel}</p>
                <p className="font-bold text-text-primary text-base">
                  {maskAmount(installment.installmentAmount)}
                </p>
              </div>
              <div className="p-3.5 rounded-[var(--radius-md)] bg-bg-surface border border-border">
                <p className="text-text-muted text-xs">Períodos restantes</p>
                <p className="font-bold text-text-primary text-base">
                  {installment.periodsRemaining}
                </p>
              </div>
              <div className="p-3.5 rounded-[var(--radius-md)] bg-bg-surface border border-border">
                <p className="text-text-muted text-xs">Faltante</p>
                <p className="font-bold text-danger text-base">
                  {maskAmount(installment.remainingAmount)}
                </p>
              </div>
            </div>
          )}

          {/* Smart Cashflow Projections */}
          {smartProjections && (
            <div className="p-4 rounded-[var(--radius-lg)] bg-accent-primary-soft/40 border border-accent-primary/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-accent-primary uppercase tracking-wider">
                <Zap size={15} />
                <span>Proyección Inteligente según su Flujo Real ({maskAmount(finances.netBalance)}/mes disponible)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-[var(--radius-md)] bg-bg-card border border-border">
                  <span className="text-text-muted block">Destinando el 100% ({maskAmount(smartProjections.full.amount)})</span>
                  <span className="font-bold text-success text-sm block mt-0.5">
                    {smartProjections.full.months} {smartProjections.full.months === 1 ? 'mes' : 'meses'} ({smartProjections.full.formattedDate})
                  </span>
                </div>
                <div className="p-2.5 rounded-[var(--radius-md)] bg-bg-card border border-border">
                  <span className="text-text-muted block">Destinando el 50% ({maskAmount(smartProjections.half.amount)})</span>
                  <span className="font-bold text-text-primary text-sm block mt-0.5">
                    {smartProjections.half.months} meses ({smartProjections.half.formattedDate})
                  </span>
                </div>
                <div className="p-2.5 rounded-[var(--radius-md)] bg-bg-card border border-border">
                  <span className="text-text-muted block">Destinando el 25% ({maskAmount(smartProjections.quarter.amount)})</span>
                  <span className="font-bold text-text-primary text-sm block mt-0.5">
                    {smartProjections.quarter.months} meses ({smartProjections.quarter.formattedDate})
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={() => setShowAddContribution(true)}
            fullWidth
            icon={<Plus size={16} />}
          >
            Registrar Abono
          </Button>
        </div>
      )}

      {/* Celebration for Completed Goal */}
      {(goal.status === 'completed' || (progress && progress.percentage >= 100)) && goal.reference_links && (
        <AffiliatePurchaseCelebration
          goalTitle={goal.title}
          referenceLinks={goal.reference_links}
        />
      )}

      {/* Reference & Store Affiliate Links */}
      <AffiliateLinksList
        links={goal.reference_links}
        goalTitle={goal.title}
        isCompleted={goal.status === 'completed' || (progress ? progress.percentage >= 100 : false)}
        onAddLink={handleAddReferenceLink}
      />

      {/* Contributions History (savings only) */}
      {goal.type === 'savings' && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold text-text-primary">
            Historial de Abonos ({contributions.length})
          </h3>

          {contributions.length > 0 ? (
            <div className="divide-y divide-border">
              {contributions.map((c) => {
                const canDelete = c.user_id === user?.id
                return (
                  <div
                    key={c.id}
                    className="py-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-text-primary text-base">
                        {maskAmount(c.amount, '+$')}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {(c as unknown as { users?: { name: string } }).users?.name || 'Usuario'} •{' '}
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : ''}
                      </p>
                      {c.note && (
                        <div className="mt-1.5 p-2 rounded-[var(--radius-md)] bg-bg-surface border border-border/80 text-xs text-text-secondary italic flex items-start gap-1.5 max-w-md">
                          <span className="text-accent-primary shrink-0 not-italic">💬</span>
                          <span>&ldquo;{c.note}&rdquo;</span>
                        </div>
                      )}
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteContribution(c.id)}
                        disabled={deletingId === c.id}
                        className="text-xs text-danger hover:underline p-1 transition-opacity"
                      >
                        {deletingId === c.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-text-muted py-4 text-center">
              Aún no hay abonos registrados en esta meta.
            </p>
          )}
        </div>
      )}

      {/* Modals */}
      <AddContributionModal
        goal={goal}
        currentTotal={totalContributions}
        isOpen={showAddContribution}
        onClose={() => setShowAddContribution(false)}
        onAdded={fetchData}
      />

      <ConvertGoalDialog
        goal={goal}
        isOpen={showConvertDialog}
        onClose={() => setShowConvertDialog(false)}
        onConverted={fetchData}
      />

      <EditGoalModal
        goal={goal}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdated={fetchData}
      />
    </div>
  )
}
