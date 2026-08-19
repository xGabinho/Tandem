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
import { DashboardStatSkeleton } from '@/components/ui/SkeletonLoader'

type GoalRow = Database['public']['Tables']['goals']['Row']
type ContributionRow = Database['public']['Tables']['contributions']['Row']

export default function DashboardPage() {
  const { profile } = useAuth()
  const [goals, setGoals] = useState<GoalRow[]>([])
  const [contributions, setContributions] = useState<ContributionRow[]>([])
  const [incomes, setIncomes] = useState<IncomeRow[]>([])
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [goalsRes, contribRes, incomesData, expensesData] = await Promise.all([
        supabase.from('goals').select('*').order('created_at', { ascending: false }),
        supabase.from('contributions').select('*'),
        getIncomes().catch(() => [] as IncomeRow[]),
        getExpenses().catch(() => [] as ExpenseRow[]),
      ])

      if (goalsRes.data) setGoals(goalsRes.data)
      if (contribRes.data) setContributions(contribRes.data)
      setIncomes(incomesData)
      setExpenses(expensesData)
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
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-0.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2" />
          <path d="M2 9v1c0 1.1.9 2 2 2h1" />
          <path d="M16 11h0.01" />
        </svg>
      ),
      color: 'var(--success)',
    },
    {
      label: 'Objetivo Total',
      value: progress.totalTarget,
      prefix: '$',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 13V2l8 4-8 4" />
          <path d="M20.55 10.23A9 9 0 1 1 8 4.94" />
          <path d="M8 10a5 5 0 1 0 8.9 2.02" />
        </svg>
      ),
      color: 'var(--accent-primary)',
    },
    {
      label: 'Metas Activas',
      value: progress.activeGoals,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      color: 'var(--warning)',
    },
    {
      label: 'Completadas',
      value: progress.completedGoals,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      ),
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
              sublabel={`$${formatCurrency(progress.totalSaved)} de $${formatCurrency(progress.totalTarget)}`}
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
                  ${formatCurrency(progress.totalSaved)} ahorrado
                </span>
                <span>
                  ${formatCurrency(progress.totalTarget - progress.totalSaved)} restante
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

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-[var(--radius-md)] bg-bg-surface border border-border">
                  <p className="text-[11px] text-text-muted uppercase font-semibold">Ingresos</p>
                  <p className="text-base md:text-lg font-bold text-success mt-0.5">
                    +${formatCurrency(finances.totalIncome)}
                  </p>
                </div>
                <div className="p-3 rounded-[var(--radius-md)] bg-bg-surface border border-border">
                  <p className="text-[11px] text-text-muted uppercase font-semibold">Gastos</p>
                  <p className="text-base md:text-lg font-bold text-danger mt-0.5">
                    -${formatCurrency(finances.totalExpenses)}
                  </p>
                </div>
                <div className="p-3 rounded-[var(--radius-md)] bg-bg-surface border border-border">
                  <p className="text-[11px] text-text-muted uppercase font-semibold">Disponible</p>
                  <p
                    className={`text-base md:text-lg font-bold mt-0.5 ${
                      finances.netBalance >= 0 ? 'text-accent-primary' : 'text-danger'
                    }`}
                  >
                    {finances.netBalance < 0 ? '-' : ''}${formatCurrency(Math.abs(finances.netBalance))}
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

          {/* Recent Goals */}
          {recentGoals.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-4">
                Metas Recientes
              </h3>
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
                    <div
                      key={goal.id}
                      className="glass-card p-4 flex items-center gap-4 cursor-pointer"
                    >
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
                          ${formatCurrency(saved)}
                        </p>
                        <p className="text-xs text-text-muted">
                          de ${formatCurrency(goal.target_amount || 0)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {goals.length === 0 && !loading && (
            <div className="glass-card p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-primary-soft mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 13V2l8 4-8 4" />
                  <path d="M20.55 10.23A9 9 0 1 1 8 4.94" />
                  <path d="M8 10a5 5 0 1 0 8.9 2.02" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">
                ¡Empieza tu primera meta!
              </h3>
              <p className="text-sm text-text-muted max-w-sm mx-auto">
                Crea una meta de ahorro, cotización o experiencia para comenzar a planear juntos.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
