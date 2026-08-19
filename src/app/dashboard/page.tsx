'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { getIncomes, getExpenses } from '@/lib/api/finances'
import { Database, IncomeRow, ExpenseRow } from '@/types/supabase'
import {
  calculateGlobalProgress,
  calculateFinancialSummary,
  formatCurrency,
} from '@/lib/utils/calculations'
import ProgressRing from '@/components/dashboard/ProgressRing'
import QuickStats from '@/components/dashboard/QuickStats'
import ActivityFeed, { ActivityItem } from '@/components/dashboard/ActivityFeed'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { DashboardStatSkeleton } from '@/components/ui/SkeletonLoader'
import {
  PiggyBank,
  Target,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

type GoalRow = Database['public']['Tables']['goals']['Row']
type ContributionRow = Database['public']['Tables']['contributions']['Row']

export default function DashboardPage() {
  const { profile } = useAuth()
  const { maskAmount, isPrivate } = usePrivacy()
  const [goals, setGoals] = useState<GoalRow[]>([])
  const [contributions, setContributions] = useState<ContributionRow[]>([])
  const [incomes, setIncomes] = useState<IncomeRow[]>([])
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [goalsRes, contribRes, incomesData, expensesData] = await Promise.all([
        supabase.from('goals').select('*').order('created_at', { ascending: false }),
        supabase
          .from('contributions')
          .select('*, users(name)')
          .order('created_at', { ascending: false }),
        getIncomes().catch(() => [] as IncomeRow[]),
        getExpenses().catch(() => [] as ExpenseRow[]),
      ])

      if (goalsRes.data) setGoals(goalsRes.data)
      if (contribRes.data) setContributions(contribRes.data as ContributionRow[])
      setIncomes(incomesData)
      setExpenses(expensesData)

      // Build activity items list
      const items: ActivityItem[] = []

      if (contribRes.data) {
        const goalsMap = new Map(goalsRes.data?.map((g) => [g.id, g.title]) || [])
        for (const c of contribRes.data) {
          items.push({
            id: `c-${c.id}`,
            type: 'contribution',
            userName: (c as unknown as { users?: { name: string } })?.users?.name || 'Tu pareja',
            title: `Abono`,
            amount: c.amount,
            goalId: c.goal_id,
            goalTitle: goalsMap.get(c.goal_id) || 'Meta compartida',
            createdAt: c.created_at || new Date().toISOString(),
          })
        }
      }

      if (goalsRes.data) {
        for (const g of goalsRes.data) {
          if (g.status === 'completed') {
            items.push({
              id: `g-comp-${g.id}`,
              type: 'goal_completed',
              userName: 'Ambos',
              title: `Meta completada`,
              goalId: g.id,
              goalTitle: g.title,
              createdAt: g.created_at || new Date().toISOString(),
            })
          } else {
            items.push({
              id: `g-creat-${g.id}`,
              type: 'goal_created',
              userName: 'Espacio Compartido',
              title: `Nueva meta`,
              goalId: g.id,
              goalTitle: g.title,
              createdAt: g.created_at || new Date().toISOString(),
            })
          }
        }
      }

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setActivities(items.slice(0, 6))

      setLoading(false)
    }

    if (profile?.workspace_id) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [profile?.workspace_id])

  const progress = calculateGlobalProgress(goals, contributions)
  const finances = calculateFinancialSummary(incomes, expenses)

  const stats = [
    {
      label: 'Total Ahorrado',
      value: progress.totalSaved,
      prefix: '$',
      icon: <PiggyBank size={20} />,
      color: 'var(--success)',
    },
    {
      label: 'Objetivo Total',
      value: progress.totalTarget,
      prefix: '$',
      icon: <Target size={20} />,
      color: 'var(--accent-primary)',
    },
    {
      label: 'Metas Activas',
      value: progress.activeGoals,
      icon: <Clock size={20} />,
      color: 'var(--warning)',
    },
    {
      label: 'Completadas',
      value: progress.completedGoals,
      icon: <CheckCircle2 size={20} />,
      color: 'var(--info)',
    },
  ]

  // Metas recientes (top 5)
  const recentGoals = goals
    .filter((g) => g.type === 'savings')
    .slice(0, 5)

  return (
    <>
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
            {profile?.name ? `Hola, ${profile.name}` : 'Tu Progreso'}
          </h2>
          <p className="text-text-muted text-sm mt-1">
            Sigue construyendo su futuro juntos ✨
          </p>
        </div>
      </header>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[...Array(4)].map((_, i) => (
              <DashboardStatSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8 stagger-children">
          {/* Progress Ring + Stats */}
          <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
            <ProgressRing
              percentage={progress.percentage}
              label="Progreso Global"
              sublabel={`${maskAmount(progress.totalSaved)} de ${maskAmount(progress.totalTarget)}`}
            />
            <div className="flex-1 w-full space-y-4">
              <div>
                <h3 className="text-lg font-bold text-text-primary mb-1">
                  Progreso Global
                </h3>
                <p className="text-sm text-text-muted">
                  {progress.percentage >= 100
                    ? '¡Felicidades! Han alcanzado todas sus metas 🎉'
                    : progress.percentage >= 50
                      ? '¡Van por buen camino! Más de la mitad completada 💪'
                      : 'Cada aporte cuenta. ¡Sigan adelante! 🚀'}
                </p>
              </div>
              {/* Mini progress bar */}
              <div className="w-full h-3 bg-bg-card-hover rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min(progress.percentage, 100)}%`,
                    background: 'var(--accent-gradient)',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-muted">
                <span>
                  {maskAmount(progress.totalSaved)} ahorrado
                </span>
                <span>
                  {maskAmount(progress.totalTarget - progress.totalSaved)} restante
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Cash Flow / Finances Card */}
          {(incomes.length > 0 || expenses.length > 0) && (
            <div className="glass-card p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <span>💵</span> Flujo Financiero Mensual
                  </h3>
                  <p className="text-xs text-text-muted">
                    Ingresos guardados menos gastos fijos del hogar
                  </p>
                </div>
                <Link
                  href="/finances"
                  className="text-xs font-semibold text-accent-primary hover:underline flex items-center gap-1"
                >
                  Ver detalle →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:gap-3 pt-1">
                <div className="p-3 rounded-[var(--radius-md)] bg-bg-surface border border-border flex flex-col justify-between overflow-hidden min-w-0">
                  <p className="text-[11px] text-text-muted uppercase font-semibold">Ingresos</p>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-success mt-0.5 truncate">
                    {maskAmount(finances.totalIncome, '+$')}
                  </p>
                </div>
                <div className="p-3 rounded-[var(--radius-md)] bg-bg-surface border border-border flex flex-col justify-between overflow-hidden min-w-0">
                  <p className="text-[11px] text-text-muted uppercase font-semibold">Gastos</p>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-danger mt-0.5 truncate">
                    {maskAmount(finances.totalExpenses, '-$')}
                  </p>
                </div>
                <div className="p-3 rounded-[var(--radius-md)] bg-bg-surface border border-border flex flex-col justify-between overflow-hidden min-w-0">
                  <p className="text-[11px] text-text-muted uppercase font-semibold">Disponible</p>
                  <p
                    className={`text-sm sm:text-base md:text-lg font-bold mt-0.5 truncate ${
                      finances.netBalance >= 0 ? 'text-accent-primary' : 'text-danger'
                    }`}
                  >
                    {isPrivate
                      ? '$ •••••'
                      : `${finances.netBalance < 0 ? '-' : ''}$${formatCurrency(Math.abs(finances.netBalance))}`}
                  </p>
                </div>
              </div>

              {finances.totalIncome > 0 && (
                <div className="w-full h-2.5 bg-bg-surface rounded-full overflow-hidden flex border border-border">
                  <div
                    className="h-full bg-danger/80"
                    style={{ width: `${Math.min(finances.expenseRate, 100)}%` }}
                    title={`Gastos: ${finances.expenseRate}%`}
                  />
                  <div
                    className="h-full bg-success/80"
                    style={{ width: `${Math.min(finances.savingsRate, 100)}%` }}
                    title={`Disponible para ahorro: ${finances.savingsRate}%`}
                  />
                </div>
              )}
            </div>
          )}

          {/* Quick Stats Grid */}
          <QuickStats stats={stats} />

          {/* Grid: Recent Goals + Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Recent Goals */}
            {recentGoals.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <span>🎯</span> Metas Recientes
                  </h3>
                  <Link
                    href="/goals"
                    className="text-xs font-semibold text-accent-primary hover:underline"
                  >
                    Ver todas →
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentGoals.map((goal) => {
                    const goalContribs = contributions.filter(
                      (c) => c.goal_id === goal.id
                    )
                    const saved = goalContribs.reduce(
                      (sum, c) => sum + c.amount,
                      0
                    )
                    const pct =
                      goal.target_amount && goal.target_amount > 0
                        ? Math.min((saved / goal.target_amount) * 100, 100)
                        : 0

                    return (
                      <Link key={goal.id} href={`/goals/${goal.id}`} className="block">
                        <div className="glass-card p-3.5 md:p-4 flex items-center gap-3.5 cursor-pointer hover:border-border-hover transition-all">
                          {/* Image or placeholder */}
                          <div className="w-12 h-12 rounded-[var(--radius-md)] bg-accent-primary-soft flex items-center justify-center shrink-0 overflow-hidden">
                            {goal.image_url ? (
                              <img
                                src={goal.image_url}
                                alt={goal.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 13V2l8 4-8 4" />
                                <path d="M20.55 10.23A9 9 0 1 1 8 4.94" />
                              </svg>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">
                              {goal.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 h-1.5 bg-bg-card-hover rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${pct}%`,
                                    background: 'var(--accent-gradient)',
                                  }}
                                />
                              </div>
                              <span className="text-xs text-text-muted font-medium shrink-0">
                                {Math.round(pct)}%
                              </span>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-text-primary">
                              {maskAmount(saved)}
                            </p>
                            <p className="text-xs text-text-muted">
                              de {maskAmount(goal.target_amount || 0)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="glass-card p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-primary-soft mb-3">
                  <Target size={22} className="text-accent-primary" />
                </div>
                <h4 className="text-sm font-bold text-text-primary mb-1">
                  ¡Empiecen su primera meta!
                </h4>
                <p className="text-xs text-text-muted max-w-xs mx-auto mb-3">
                  Crea una meta de ahorro o cotización para planear juntos.
                </p>
                <Link
                  href="/goals"
                  className="inline-flex text-xs font-bold text-accent-primary hover:underline"
                >
                  + Crear meta ahora
                </Link>
              </div>
            )}

            {/* Couple Activity Feed */}
            <ActivityFeed activities={activities} loading={loading} />
          </div>
        </div>
      )}
    </>
  )
}
