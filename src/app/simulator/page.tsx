'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { getIncomes, getExpenses } from '@/lib/api/finances'
import {
  calculateSavingsCapacity,
  calculateInstallment,
  calculateTotalMonthlyIncomes,
  calculateTotalMonthlyExpenses,
  formatCurrency,
} from '@/lib/utils/calculations'
import { Database, IncomeRow, ExpenseRow } from '@/types/supabase'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

type GoalRow = Database['public']['Tables']['goals']['Row']
type ContributionRow = Database['public']['Tables']['contributions']['Row']

export default function SimulatorPage() {
  const { profile } = useAuth()

  // Savings Calculator state (RF-015)
  const [income, setIncome] = useState('')
  const [expenses, setExpenses] = useState('')
  const [savedIncomeTotal, setSavedIncomeTotal] = useState(0)
  const [savedExpenseTotal, setSavedExpenseTotal] = useState(0)
  const [hasLoadedSavedData, setHasLoadedSavedData] = useState(false)

  // Installment Projection state (RF-016)
  const [goals, setGoals] = useState<GoalRow[]>([])
  const [contributions, setContributions] = useState<ContributionRow[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState('')
  const [frequency, setFrequency] = useState<'monthly' | 'biweekly'>('monthly')

  const capacity =
    income && expenses
      ? calculateSavingsCapacity(parseFloat(income) || 0, parseFloat(expenses) || 0)
      : null

  useEffect(() => {
    async function fetchData() {
      const [goalsRes, contribRes, incomesData, expensesData] = await Promise.all([
        supabase
          .from('goals')
          .select('*')
          .eq('type', 'savings')
          .neq('status', 'completed')
          .order('title'),
        supabase.from('contributions').select('*'),
        getIncomes().catch(() => [] as IncomeRow[]),
        getExpenses().catch(() => [] as ExpenseRow[]),
      ])

      if (goalsRes.data) {
        setGoals(goalsRes.data)
        if (goalsRes.data.length > 0) setSelectedGoalId(goalsRes.data[0].id)
      }
      if (contribRes.data) setContributions(contribRes.data)

      const totalMonthlyInc = calculateTotalMonthlyIncomes(incomesData)
      const totalMonthlyExp = calculateTotalMonthlyExpenses(expensesData)

      setSavedIncomeTotal(totalMonthlyInc)
      setSavedExpenseTotal(totalMonthlyExp)

      if (totalMonthlyInc > 0 || totalMonthlyExp > 0) {
        setIncome(totalMonthlyInc > 0 ? totalMonthlyInc.toString() : '')
        setExpenses(totalMonthlyExp > 0 ? totalMonthlyExp.toString() : '')
        setHasLoadedSavedData(true)
      }
    }

    if (profile?.workspace_id) fetchData()
  }, [profile?.workspace_id])

  const selectedGoal = goals.find((g) => g.id === selectedGoalId)
  const goalContribs = contributions
    .filter((c) => c.goal_id === selectedGoalId)
    .reduce((sum, c) => sum + c.amount, 0)

  const projection =
    selectedGoal?.target_amount && selectedGoal?.target_date
      ? calculateInstallment(
          selectedGoal.target_amount,
          goalContribs,
          selectedGoal.target_date,
          frequency
        )
      : null

  const handleResetToSaved = () => {
    setIncome(savedIncomeTotal > 0 ? savedIncomeTotal.toString() : '')
    setExpenses(savedExpenseTotal > 0 ? savedExpenseTotal.toString() : '')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
          Simulador Financiero
        </h2>
        <p className="text-text-muted text-sm mt-1">
          Herramientas para planear mejor tus ahorros y proyectar tus metas
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== SAVINGS CALCULATOR (RF-015) ===== */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-success-soft flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="16" height="12" x="4" y="6" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-text-primary">
                  Capacidad de Ahorro
                </h3>
                <p className="text-xs text-text-muted">
                  Resta automática de tus gastos fijos sobre tus ingresos
                </p>
              </div>
            </div>
            {hasLoadedSavedData && (
              <button
                onClick={handleResetToSaved}
                className="text-[11px] font-semibold text-accent-primary hover:underline"
                title="Restaurar a los montos guardados en Finanzas"
              >
                Cargar guardados
              </button>
            )}
          </div>

          {hasLoadedSavedData && (
            <div className="p-2.5 rounded-[var(--radius-md)] bg-accent-primary-soft border border-accent-primary/20 flex items-center justify-between text-xs">
              <span className="text-accent-primary font-medium flex items-center gap-1.5">
                <span>✨</span> Cargado de tus ingresos y gastos guardados
              </span>
              <Link href="/finances" className="text-accent-primary font-bold hover:underline">
                Gestionar →
              </Link>
            </div>
          )}

          <Input
            label="Ingresos mensuales"
            type="number"
            placeholder="0.00"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            min="0"
            step="0.01"
            icon={<span className="text-sm font-bold">$</span>}
          />

          <Input
            label="Gastos fijos mensuales"
            type="number"
            placeholder="0.00"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
            min="0"
            step="0.01"
            icon={<span className="text-sm font-bold">$</span>}
          />

          {/* Results */}
          {capacity && (
            <div className="space-y-3 pt-2 animate-fade-in">
              <div className="p-4 rounded-[var(--radius-lg)] bg-bg-surface">
                <p className="text-xs text-text-muted mb-1">
                  Capacidad de ahorro mensual (Ingresos − Gastos)
                </p>
                <p className="text-2xl font-bold text-success">
                  ${formatCurrency(capacity.capacity)}
                </p>
              </div>

              {/* Visual bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Gastos ({100 - capacity.savingsRate}%)</span>
                  <span>Ahorro ({capacity.savingsRate}%)</span>
                </div>
                <div className="w-full h-4 bg-bg-card-hover rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-danger/60 transition-all duration-500"
                    style={{
                      width: `${100 - capacity.savingsRate}%`,
                    }}
                  />
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${capacity.savingsRate}%`,
                      background: 'var(--accent-gradient)',
                    }}
                  />
                </div>
                <p className="text-center text-sm text-text-muted">
                  Tasa de ahorro disponible:{' '}
                  <span className="font-bold text-accent-primary">
                    {capacity.savingsRate}%
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ===== INSTALLMENT PROJECTION (RF-016) ===== */}
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-accent-primary-soft flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 13V2l8 4-8 4" />
                <path d="M20.55 10.23A9 9 0 1 1 8 4.94" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-text-primary">
                Proyección de Cuotas
              </h3>
              <p className="text-xs text-text-muted">
                Cuánto abonar por periodo para cumplir tu meta
              </p>
            </div>
          </div>

          {goals.length > 0 ? (
            <>
              {/* Goal selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary pl-1">
                  Meta
                </label>
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="w-full bg-bg-input border border-border rounded-[var(--radius-lg)] px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-primary transition-all appearance-none cursor-pointer"
                >
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} — ${formatCurrency(g.target_amount || 0)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Frequency selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFrequency('monthly')}
                  className={`flex-1 py-2.5 rounded-[var(--radius-md)] text-sm font-medium border transition-all ${
                    frequency === 'monthly'
                      ? 'bg-accent-primary-soft border-accent-primary/30 text-accent-primary'
                      : 'bg-bg-surface border-border text-text-muted'
                  }`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setFrequency('biweekly')}
                  className={`flex-1 py-2.5 rounded-[var(--radius-md)] text-sm font-medium border transition-all ${
                    frequency === 'biweekly'
                      ? 'bg-accent-primary-soft border-accent-primary/30 text-accent-primary'
                      : 'bg-bg-surface border-border text-text-muted'
                  }`}
                >
                  Quincenal
                </button>
              </div>

              {/* Projection results */}
              {projection && (
                <div className="space-y-3 animate-fade-in">
                  <div className="p-4 rounded-[var(--radius-lg)] bg-bg-surface text-center">
                    <p className="text-xs text-text-muted mb-1">
                      Cuota {projection.frequencyLabel} sugerida
                    </p>
                    <p className="text-3xl font-bold text-accent-primary">
                      ${formatCurrency(projection.installmentAmount)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-[var(--radius-md)] bg-bg-surface">
                      <p className="text-xs text-text-muted">Faltante</p>
                      <p className="text-sm font-bold text-text-primary">
                        ${formatCurrency(projection.remainingAmount)}
                      </p>
                    </div>
                    <div className="p-3 rounded-[var(--radius-md)] bg-bg-surface">
                      <p className="text-xs text-text-muted">Períodos</p>
                      <p className="text-sm font-bold text-text-primary">
                        {projection.periodsRemaining} {frequency === 'monthly' ? 'meses' : 'quincenas'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-text-muted text-sm">
                No tienes metas de ahorro activas.
              </p>
              <p className="text-text-muted text-xs mt-1">
                Crea una meta para usar la proyección.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
