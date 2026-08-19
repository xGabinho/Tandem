'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getIncomes, getExpenses } from '@/lib/api/finances'
import { IncomeRow, ExpenseRow } from '@/types/supabase'
import {
  calculateFinancialSummary,
  formatCurrency,
  normalizeToMonthly,
} from '@/lib/utils/calculations'
import Button from '@/components/ui/Button'
import CreateIncomeModal from '@/components/finances/CreateIncomeModal'
import EditIncomeModal from '@/components/finances/EditIncomeModal'
import CreateExpenseModal from '@/components/finances/CreateExpenseModal'
import EditExpenseModal from '@/components/finances/EditExpenseModal'
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Wallet,
} from 'lucide-react'

type ActiveTab = 'overview' | 'incomes' | 'expenses' | 'categories'

const incomeCategoryMeta: Record<string, { label: string; emoji: string }> = {
  salary: { label: 'Salario', emoji: '💼' },
  freelance: { label: 'Freelance', emoji: '💻' },
  investments: { label: 'Inversiones', emoji: '📈' },
  business: { label: 'Negocio', emoji: '🏪' },
  other: { label: 'Otros', emoji: '✨' },
}

const expenseCategoryMeta: Record<string, { label: string; emoji: string; color: string }> = {
  housing: { label: 'Vivienda / Renta', emoji: '🏠', color: '#6366f1' },
  utilities: { label: 'Servicios', emoji: '⚡', color: '#06b6d4' },
  food: { label: 'Alimentación', emoji: '🛒', color: '#10b981' },
  transport: { label: 'Transporte', emoji: '🚗', color: '#f59e0b' },
  subscriptions: { label: 'Suscripciones', emoji: '📺', color: '#ec4899' },
  health: { label: 'Salud', emoji: '🩺', color: '#ef4444' },
  debt: { label: 'Deudas', emoji: '💳', color: '#8b5cf6' },
  education: { label: 'Educación', emoji: '📚', color: '#3b82f6' },
  other: { label: 'Otros', emoji: '📦', color: '#64748b' },
}

const frequencyLabels: Record<string, string> = {
  monthly: 'Mensual',
  biweekly: 'Quincenal',
  weekly: 'Semanal',
  yearly: 'Anual',
  one_time: 'Puntual',
}

export default function FinancesPage() {
  const { profile } = useAuth()
  const [incomes, setIncomes] = useState<(IncomeRow & { users?: { name: string; avatar_url: string | null } | null })[]>([])
  const [expenses, setExpenses] = useState<(ExpenseRow & { users?: { name: string; avatar_url: string | null } | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')

  // Modals state
  const [showCreateIncome, setShowCreateIncome] = useState(false)
  const [showCreateExpense, setShowCreateExpense] = useState(false)
  const [editingIncome, setEditingIncome] = useState<IncomeRow | null>(null)
  const [editingExpense, setEditingExpense] = useState<ExpenseRow | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [incomesData, expensesData] = await Promise.all([
        getIncomes(),
        getExpenses(),
      ])
      setIncomes(incomesData)
      setExpenses(expensesData)
    } catch (err) {
      console.error('Error al cargar finanzas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile?.workspace_id) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [profile?.workspace_id])

  const summary = useMemo(() => {
    return calculateFinancialSummary(incomes, expenses)
  }, [incomes, expenses])

  // Expense breakdown by category
  const expenseCategoryBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {}
    for (const exp of expenses) {
      const cat = exp.category || 'other'
      const monthlyVal = normalizeToMonthly(exp.amount, exp.frequency)
      if (!map[cat]) {
        map[cat] = { total: 0, count: 0 }
      }
      map[cat].total += monthlyVal
      map[cat].count += 1
    }

    return Object.entries(map)
      .map(([catKey, data]) => ({
        category: catKey,
        meta: expenseCategoryMeta[catKey] || { label: catKey, emoji: '📦', color: '#64748b' },
        total: data.total,
        percentage: summary.totalExpenses > 0 ? (data.total / summary.totalExpenses) * 100 : 0,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total)
  }, [expenses, summary.totalExpenses])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
            Ingresos y Gastos
          </h2>
          <p className="text-text-muted text-sm mt-1">
            Control de flujo mensual y capacidad real de ahorro para sus metas
          </p>
        </div>
        <div className="flex gap-2.5 w-full sm:w-auto">
          <Button
            onClick={() => setShowCreateIncome(true)}
            variant="secondary"
            className="flex-1 sm:flex-initial !border-success/30 !text-success hover:!bg-success-soft"
            icon={<Plus size={16} />}
          >
            Ingreso
          </Button>
          <Button
            onClick={() => setShowCreateExpense(true)}
            className="flex-1 sm:flex-initial"
            icon={<Plus size={16} />}
          >
            Gasto
          </Button>
        </div>
      </header>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Ingresos Totales */}
        <div className="glass-card p-4 md:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Ingresos Mensuales
            </span>
            <div className="w-8 h-8 rounded-full bg-success-soft flex items-center justify-center text-success">
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-success">
              ${formatCurrency(summary.totalIncome)}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {incomes.length} fuente{incomes.length !== 1 ? 's' : ''} activa{incomes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Gastos Totales */}
        <div className="glass-card p-4 md:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Gastos Mensuales
            </span>
            <div className="w-8 h-8 rounded-full bg-danger-soft flex items-center justify-center text-danger">
              <TrendingDown size={18} />
            </div>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-danger">
              ${formatCurrency(summary.totalExpenses)}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {expenses.length} gasto{expenses.length !== 1 ? 's' : ''} fijo{expenses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Balance Neto (Ingresos - Gastos) */}
        <div className="glass-card p-4 md:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Balance Disponible
            </span>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                summary.netBalance >= 0 ? 'bg-accent-primary-soft text-accent-primary' : 'bg-danger-soft text-danger'
              }`}
            >
              <Wallet size={18} />
            </div>
          </div>
          <div>
            <p
              className={`text-xl md:text-2xl font-bold ${
                summary.netBalance >= 0 ? 'text-accent-primary' : 'text-danger'
              }`}
            >
              {summary.netBalance < 0 ? '-' : ''}${formatCurrency(Math.abs(summary.netBalance))}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Ingresos − Gastos
            </p>
          </div>
        </div>

        {/* Tasa de Ahorro */}
        <div className="glass-card p-4 md:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Capacidad de Ahorro
            </span>
            <div className="w-8 h-8 rounded-full bg-warning-soft flex items-center justify-center text-warning">
              <PiggyBank size={18} />
            </div>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-warning">
              {summary.savingsRate}%
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Disponible para metas
            </p>
          </div>
        </div>
      </div>

      {/* Visual Cashflow Progress Bar */}
      {summary.totalIncome > 0 && (
        <div className="glass-card p-5 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-text-primary">Distribución del Flujo Mensual</span>
            <span className="text-xs text-text-muted">
              Total base: ${formatCurrency(summary.totalIncome)}
            </span>
          </div>
          <div className="w-full h-4 bg-bg-surface rounded-full overflow-hidden flex p-0.5 border border-border">
            <div
              className="h-full rounded-l-full bg-danger/80 transition-all duration-700"
              style={{ width: `${Math.min(summary.expenseRate, 100)}%` }}
              title={`Gastos: $${formatCurrency(summary.totalExpenses)} (${summary.expenseRate}%)`}
            />
            <div
              className="h-full rounded-r-full bg-success/80 transition-all duration-700"
              style={{ width: `${Math.min(summary.savingsRate, 100)}%` }}
              title={`Disponible para Ahorro: $${formatCurrency(Math.max(summary.netBalance, 0))} (${summary.savingsRate}%)`}
            />
          </div>
          <div className="flex justify-between text-xs font-medium text-text-muted">
            <span className="flex items-center gap-1.5 text-danger">
              <span className="w-2.5 h-2.5 rounded-full bg-danger inline-block" />
              Gastos Fijos ({summary.expenseRate}%)
            </span>
            <span className="flex items-center gap-1.5 text-success">
              <span className="w-2.5 h-2.5 rounded-full bg-success inline-block" />
              Margen Disponible ({summary.savingsRate}%)
            </span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border pb-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Resumen Global', emoji: '📊' },
          { id: 'incomes', label: `Ingresos (${incomes.length})`, emoji: '💰' },
          { id: 'expenses', label: `Gastos Fijos (${expenses.length})`, emoji: '🧾' },
          { id: 'categories', label: 'Desglose por Categoría', emoji: '🏷️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ActiveTab)}
            className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-accent-primary-soft text-accent-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-card-hover'
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW / BOTH LISTS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incomes Summary List */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <span>💰</span> Ingresos ({incomes.length})
              </h3>
              <button
                onClick={() => setShowCreateIncome(true)}
                className="text-xs font-semibold text-success hover:underline"
              >
                + Agregar
              </button>
            </div>
            {incomes.length > 0 ? (
              <div className="space-y-2.5">
                {incomes.map((item) => {
                  const meta = incomeCategoryMeta[item.category] || { label: item.category, emoji: '💵' }
                  return (
                    <div
                      key={item.id}
                      onClick={() => setEditingIncome(item)}
                      className="p-3 rounded-[var(--radius-lg)] bg-bg-surface hover:bg-bg-card-hover border border-border cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{meta.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <span>{frequencyLabels[item.frequency] || item.frequency}</span>
                            {item.users?.name && (
                              <>
                                <span>•</span>
                                <span>{item.users.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-success">
                          +${formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-text-muted text-sm space-y-2">
                <p>No has registrado ingresos aún.</p>
                <Button size="sm" variant="secondary" onClick={() => setShowCreateIncome(true)}>
                  Registrar primer ingreso
                </Button>
              </div>
            )}
          </div>

          {/* Expenses Summary List */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <span>🧾</span> Gastos Fijos ({expenses.length})
              </h3>
              <button
                onClick={() => setShowCreateExpense(true)}
                className="text-xs font-semibold text-danger hover:underline"
              >
                + Agregar
              </button>
            </div>
            {expenses.length > 0 ? (
              <div className="space-y-2.5">
                {expenses.map((item) => {
                  const meta = expenseCategoryMeta[item.category] || { label: item.category, emoji: '📦', color: '#64748b' }
                  return (
                    <div
                      key={item.id}
                      onClick={() => setEditingExpense(item)}
                      className="p-3 rounded-[var(--radius-lg)] bg-bg-surface hover:bg-bg-card-hover border border-border cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{meta.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <span>{meta.label}</span>
                            {item.due_day && (
                              <>
                                <span>•</span>
                                <span>Día {item.due_day}</span>
                              </>
                            )}
                            {item.users?.name && (
                              <>
                                <span>•</span>
                                <span>{item.users.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-danger">
                          -${formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-text-muted text-sm space-y-2">
                <p>No has registrado gastos mensuales aún.</p>
                <Button size="sm" onClick={() => setShowCreateExpense(true)}>
                  Registrar primer gasto
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INCOMES DETAILED */}
      {activeTab === 'incomes' && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-text-primary text-lg">
              Lista Completa de Ingresos
            </h3>
            <Button size="sm" variant="secondary" onClick={() => setShowCreateIncome(true)}>
              + Nuevo Ingreso
            </Button>
          </div>
          {incomes.length > 0 ? (
            <div className="divide-y divide-border">
              {incomes.map((item) => {
                const meta = incomeCategoryMeta[item.category] || { label: item.category, emoji: '💵' }
                return (
                  <div
                    key={item.id}
                    onClick={() => setEditingIncome(item)}
                    className="py-3.5 flex items-center justify-between hover:bg-bg-card-hover px-3 rounded-[var(--radius-md)] cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{meta.emoji}</span>
                      <div>
                        <p className="font-semibold text-text-primary">{item.title}</p>
                        <p className="text-xs text-text-muted">
                          {meta.label} • {frequencyLabels[item.frequency] || item.frequency}
                          {item.users?.name ? ` • Aportado por ${item.users.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-success">
                        +${formatCurrency(item.amount)}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        ${formatCurrency(normalizeToMonthly(item.amount, item.frequency))}/mes
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-text-muted space-y-3">
              <span className="text-4xl">💰</span>
              <p className="font-semibold text-text-primary">Sin ingresos registrados</p>
              <p className="text-sm max-w-sm mx-auto">
                Registra los sueldos o ingresos del hogar para calcular automáticamente el balance disponible.
              </p>
              <Button onClick={() => setShowCreateIncome(true)}>Registrar Ingreso</Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXPENSES DETAILED */}
      {activeTab === 'expenses' && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-text-primary text-lg">
              Lista Completa de Gastos Fijos
            </h3>
            <Button size="sm" onClick={() => setShowCreateExpense(true)}>
              + Nuevo Gasto
            </Button>
          </div>
          {expenses.length > 0 ? (
            <div className="divide-y divide-border">
              {expenses.map((item) => {
                const meta = expenseCategoryMeta[item.category] || { label: item.category, emoji: '📦', color: '#64748b' }
                return (
                  <div
                    key={item.id}
                    onClick={() => setEditingExpense(item)}
                    className="py-3.5 flex items-center justify-between hover:bg-bg-card-hover px-3 rounded-[var(--radius-md)] cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{meta.emoji}</span>
                      <div>
                        <p className="font-semibold text-text-primary">{item.title}</p>
                        <p className="text-xs text-text-muted">
                          {meta.label} • {frequencyLabels[item.frequency] || item.frequency}
                          {item.due_day ? ` • Vence el día ${item.due_day}` : ''}
                          {item.users?.name ? ` • Responsable: ${item.users.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-danger">
                        -${formatCurrency(item.amount)}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        ${formatCurrency(normalizeToMonthly(item.amount, item.frequency))}/mes
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-text-muted space-y-3">
              <span className="text-4xl">🧾</span>
              <p className="font-semibold text-text-primary">Sin gastos registrados</p>
              <p className="text-sm max-w-sm mx-auto">
                Guarda tus gastos mensuales (renta, servicios, despensa) para ver la resta automática de tus ingresos.
              </p>
              <Button onClick={() => setShowCreateExpense(true)}>Registrar Gasto</Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CATEGORIES BREAKDOWN */}
      {activeTab === 'categories' && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <h3 className="font-bold text-text-primary text-lg">
              Distribución de Gastos por Categoría
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Visualiza en qué áreas se distribuye el presupuesto mensual de su espacio
            </p>
          </div>

          {expenseCategoryBreakdown.length > 0 ? (
            <div className="space-y-4">
              {expenseCategoryBreakdown.map((item) => (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span>{item.meta.emoji}</span>
                      <span className="font-semibold text-text-primary">
                        {item.meta.label}
                      </span>
                      <span className="text-xs text-text-muted">
                        ({item.count} {item.count === 1 ? 'gasto' : 'gastos'})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-text-primary">
                        ${formatCurrency(item.total)}
                      </span>
                      <span className="text-xs text-text-muted ml-2">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-bg-surface rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.meta.color || 'var(--accent-primary)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-text-muted text-sm">
              No hay gastos registrados para generar el desglose por categorías.
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateIncomeModal
        isOpen={showCreateIncome}
        onClose={() => setShowCreateIncome(false)}
        onCreated={fetchData}
      />

      <CreateExpenseModal
        isOpen={showCreateExpense}
        onClose={() => setShowCreateExpense(false)}
        onCreated={fetchData}
      />

      <EditIncomeModal
        income={editingIncome}
        isOpen={!!editingIncome}
        onClose={() => setEditingIncome(null)}
        onUpdated={fetchData}
      />

      <EditExpenseModal
        expense={editingExpense}
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        onUpdated={fetchData}
      />
    </div>
  )
}
