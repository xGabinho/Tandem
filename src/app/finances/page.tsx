'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getIncomes, getExpenses } from '@/lib/api/finances'
import { getWorkspaceUsers } from '@/lib/api/workspaces'
import { IncomeRow, ExpenseRow, UserRow } from '@/types/supabase'
import {
  calculateFinancialSummary,
  formatCurrency,
  normalizeToMonthly,
} from '@/lib/utils/calculations'
import { exportFinancesToCSV } from '@/lib/utils/exportReport'
import Button from '@/components/ui/Button'
import CreateIncomeModal from '@/components/finances/CreateIncomeModal'
import EditIncomeModal from '@/components/finances/EditIncomeModal'
import CreateExpenseModal from '@/components/finances/CreateExpenseModal'
import EditExpenseModal from '@/components/finances/EditExpenseModal'
import CoupleSplitCard from '@/components/finances/CoupleSplitCard'
import UpcomingBillsCard from '@/components/finances/UpcomingBillsCard'
import HealthScoreCard from '@/components/finances/HealthScoreCard'
import InternalDebtsCard from '@/components/finances/InternalDebtsCard'
import { usePrivacy } from '@/contexts/PrivacyContext'
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Wallet,
  Briefcase,
  Laptop,
  Store,
  Sparkles,
  Home,
  Zap,
  ShoppingCart,
  Car,
  Tv,
  HeartPulse,
  CreditCard,
  GraduationCap,
  Package,
  BarChart3,
  ArrowDownLeft,
  Receipt,
  Tags,
  Scale,
  Activity,
  Download,
  Dog,
  Film,
  ShoppingBag,
  Plane,
  Wrench,
  Gift,
  HeartHandshake,
} from 'lucide-react'

type ActiveTab = 'overview' | 'incomes' | 'expenses' | 'debts' | 'couple_split' | 'health' | 'categories'

export const getIncomeIcon = (category: string, size = 18) => {
  switch (category) {
    case 'salary':
      return <Briefcase size={size} className="text-emerald-400" />
    case 'freelance':
      return <Laptop size={size} className="text-blue-400" />
    case 'investments':
      return <TrendingUp size={size} className="text-purple-400" />
    case 'business':
      return <Store size={size} className="text-amber-400" />
    case 'bonus':
      return <Gift size={size} className="text-pink-400" />
    case 'other':
    default:
      return <Sparkles size={size} className="text-emerald-300" />
  }
}

export const getExpenseIcon = (category: string, size = 18) => {
  switch (category) {
    case 'housing':
      return <Home size={size} className="text-indigo-400" />
    case 'utilities':
      return <Zap size={size} className="text-cyan-400" />
    case 'food':
      return <ShoppingCart size={size} className="text-emerald-400" />
    case 'transport':
      return <Car size={size} className="text-amber-400" />
    case 'pets':
      return <Dog size={size} className="text-orange-400" />
    case 'entertainment':
      return <Film size={size} className="text-purple-400" />
    case 'shopping':
      return <ShoppingBag size={size} className="text-fuchsia-400" />
    case 'travel':
      return <Plane size={size} className="text-sky-400" />
    case 'subscriptions':
      return <Tv size={size} className="text-pink-400" />
    case 'health':
      return <HeartPulse size={size} className="text-rose-400" />
    case 'debt':
      return <CreditCard size={size} className="text-purple-400" />
    case 'education':
      return <GraduationCap size={size} className="text-blue-400" />
    case 'maintenance':
      return <Wrench size={size} className="text-teal-400" />
    case 'other':
    default:
      return <Package size={size} className="text-slate-400" />
  }
}

const incomeCategoryLabels: Record<string, string> = {
  salary: 'Salario / Nómina',
  freelance: 'Freelance / Honorarios',
  investments: 'Inversiones',
  business: 'Negocio',
  bonus: 'Bonos y Aguinaldos',
  other: 'Otros Ingresos',
}

const expenseCategoryLabels: Record<string, { label: string; color: string }> = {
  housing: { label: 'Vivienda / Renta', color: '#6366f1' },
  utilities: { label: 'Servicios', color: '#06b6d4' },
  food: { label: 'Alimentación', color: '#10b981' },
  transport: { label: 'Transporte', color: '#f59e0b' },
  pets: { label: 'Mascotas', color: '#f97316' },
  entertainment: { label: 'Citas y Ocio', color: '#a855f7' },
  shopping: { label: 'Compras y Ropa', color: '#d946ef' },
  travel: { label: 'Viajes', color: '#0ea5e9' },
  subscriptions: { label: 'Suscripciones', color: '#ec4899' },
  health: { label: 'Salud', color: '#ef4444' },
  debt: { label: 'Deudas', color: '#8b5cf6' },
  education: { label: 'Educación', color: '#3b82f6' },
  maintenance: { label: 'Mantenimiento', color: '#14b8a6' },
  other: { label: 'Otros Gastos', color: '#64748b' },
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
  const { maskAmount, isPrivate } = usePrivacy()
  const [incomes, setIncomes] = useState<(IncomeRow & { users?: { name: string; avatar_url: string | null } | null })[]>([])
  const [expenses, setExpenses] = useState<(ExpenseRow & { users?: { name: string; avatar_url: string | null } | null })[]>([])
  const [workspaceUsers, setWorkspaceUsers] = useState<UserRow[]>([])
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
      const [incomesData, expensesData, usersData] = await Promise.all([
        getIncomes(),
        getExpenses(),
        profile?.workspace_id ? getWorkspaceUsers(profile.workspace_id) : Promise.resolve([]),
      ])
      setIncomes(incomesData)
      setExpenses(expensesData)
      setWorkspaceUsers(usersData)
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
        label: expenseCategoryLabels[catKey]?.label || catKey,
        color: expenseCategoryLabels[catKey]?.color || '#64748b',
        total: data.total,
        percentage: summary.totalExpenses > 0 ? (data.total / summary.totalExpenses) * 100 : 0,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total)
  }, [expenses, summary.totalExpenses])

  const handleExport = () => {
    exportFinancesToCSV({
      workspaceName: profile?.workspace_id || 'Tandem Espacio',
      incomes,
      expenses,
      totalIncome: summary.totalIncome,
      totalExpenses: summary.totalExpenses,
      netBalance: summary.netBalance,
      savingsRate: summary.savingsRate,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
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
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            onClick={handleExport}
            variant="secondary"
            className="!border-border hover:!bg-bg-card-hover"
            icon={<Download size={15} />}
            title="Exportar resumen a Excel/CSV"
          >
            Exportar
          </Button>
          <Button
            onClick={() => setShowCreateIncome(true)}
            variant="secondary"
            className="!border-success/30 !text-success hover:!bg-success-soft"
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
        <div className="glass-card p-3.5 sm:p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">
              Ingresos Mensuales
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-success-soft flex items-center justify-center text-success shrink-0">
              <TrendingUp size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-lg md:text-2xl font-bold text-success truncate">
              {maskAmount(summary.totalIncome)}
            </p>
            <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 truncate">
              {incomes.length} fuente{incomes.length !== 1 ? 's' : ''} activa{incomes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Gastos Totales */}
        <div className="glass-card p-3.5 sm:p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">
              Gastos Mensuales
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-danger-soft flex items-center justify-center text-danger shrink-0">
              <TrendingDown size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-lg md:text-2xl font-bold text-danger truncate">
              {maskAmount(summary.totalExpenses)}
            </p>
            <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 truncate">
              {expenses.length} gasto{expenses.length !== 1 ? 's' : ''} fijo{expenses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Balance Neto (Ingresos - Gastos) */}
        <div className="glass-card p-3.5 sm:p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">
              Balance Disponible
            </span>
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 ${
                summary.netBalance >= 0 ? 'bg-accent-primary-soft text-accent-primary' : 'bg-danger-soft text-danger'
              }`}
            >
              <Wallet size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <div className="min-w-0">
            <p
              className={`text-base sm:text-lg md:text-2xl font-bold truncate ${
                summary.netBalance >= 0 ? 'text-accent-primary' : 'text-danger'
              }`}
            >
              {isPrivate
                ? '$ •••••'
                : `${summary.netBalance < 0 ? '-' : ''}$${formatCurrency(Math.abs(summary.netBalance))}`}
            </p>
            <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 truncate">
              Ingresos − Gastos
            </p>
          </div>
        </div>

        {/* Tasa de Ahorro */}
        <div className="glass-card p-3.5 sm:p-4 md:p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
            <span className="text-[11px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider truncate">
              Capacidad de Ahorro
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-warning-soft flex items-center justify-center text-warning shrink-0">
              <PiggyBank size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-lg md:text-2xl font-bold text-warning truncate">
              {summary.savingsRate}%
            </p>
            <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 truncate">
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
              Total base: {maskAmount(summary.totalIncome)}
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
          { id: 'overview', label: 'Resumen', icon: <BarChart3 size={16} /> },
          { id: 'incomes', label: `Ingresos (${incomes.length})`, icon: <ArrowDownLeft size={16} className="text-emerald-400" /> },
          { id: 'expenses', label: `Gastos (${expenses.length})`, icon: <Receipt size={16} className="text-rose-400" /> },
          { id: 'debts', label: 'Deudas en Pareja', icon: <HeartHandshake size={16} className="text-pink-400" /> },
          { id: 'couple_split', label: 'División Pareja', icon: <Scale size={16} className="text-indigo-400" /> },
          { id: 'health', label: 'Salud 50/30/20', icon: <Activity size={16} className="text-cyan-400" /> },
          { id: 'categories', label: 'Categorías', icon: <Tags size={16} /> },
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
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Upcoming Bills Widget */}
          <UpcomingBillsCard
            expenses={expenses}
            onEditExpense={(exp) => setEditingExpense(exp)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incomes Summary List */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <ArrowDownLeft size={18} className="text-emerald-400" />
                  Ingresos ({incomes.length})
                </h3>
                <button
                  onClick={() => setShowCreateIncome(true)}
                  className="text-xs font-semibold text-success hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Agregar
                </button>
              </div>
              {incomes.length > 0 ? (
                <div className="space-y-3">
                  {incomes.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setEditingIncome(item)}
                      className="p-3.5 sm:p-4 rounded-[var(--radius-lg)] bg-bg-surface hover:bg-bg-card-hover border border-border cursor-pointer transition-all space-y-2.5 group"
                    >
                      {/* Fila 1: Icono + Título + Monto */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            {getIncomeIcon(item.category, 20)}
                          </div>
                          <p className="text-sm sm:text-base font-bold text-text-primary truncate group-hover:text-accent-primary transition-colors min-w-0">
                            {item.title}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm sm:text-base font-extrabold text-success tracking-tight bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 inline-block">
                            {maskAmount(item.amount, '+$')}
                          </span>
                        </div>
                      </div>

                      {/* Fila 2: Chips de metadatos independientes */}
                      <div className="flex items-center gap-2 text-[11px] text-text-muted flex-wrap pl-[52px]">
                        <span className="px-2 py-0.5 rounded-full bg-bg-card border border-border font-medium text-text-secondary">
                          {incomeCategoryLabels[item.category] || item.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-bg-card border border-border font-medium text-text-secondary">
                          {frequencyLabels[item.frequency] || item.frequency}
                        </span>
                        {item.users?.name && (
                          <span className="px-2 py-0.5 rounded-full bg-accent-primary-soft text-accent-primary font-semibold border border-accent-primary/20">
                            👤 {item.users.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
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
                  <Receipt size={18} className="text-rose-400" />
                  Gastos Fijos ({expenses.length})
                </h3>
                <button
                  onClick={() => setShowCreateExpense(true)}
                  className="text-xs font-semibold text-danger hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Agregar
                </button>
              </div>
              {expenses.length > 0 ? (
                <div className="space-y-3">
                  {expenses.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setEditingExpense(item)}
                      className="p-3.5 sm:p-4 rounded-[var(--radius-lg)] bg-bg-surface hover:bg-bg-card-hover border border-border cursor-pointer transition-all space-y-2.5 group"
                    >
                      {/* Fila 1: Icono + Título + Monto */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                            {getExpenseIcon(item.category, 20)}
                          </div>
                          <p className="text-sm sm:text-base font-bold text-text-primary truncate group-hover:text-accent-primary transition-colors min-w-0">
                            {item.title}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm sm:text-base font-extrabold text-danger tracking-tight bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 inline-block">
                            {maskAmount(item.amount, '-$')}
                          </span>
                        </div>
                      </div>

                      {/* Fila 2: Chips de metadatos independientes */}
                      <div className="flex items-center gap-2 text-[11px] text-text-muted flex-wrap pl-[52px]">
                        <span className="px-2 py-0.5 rounded-full bg-bg-card border border-border font-medium text-text-secondary">
                          {expenseCategoryLabels[item.category]?.label || item.category}
                        </span>
                        {item.due_day && (
                          <span className="px-2 py-0.5 rounded-full bg-bg-card border border-border font-medium text-text-primary">
                            📅 Vence día {item.due_day}
                          </span>
                        )}
                        {item.users?.name && (
                          <span className="px-2 py-0.5 rounded-full bg-accent-primary-soft text-accent-primary font-semibold border border-accent-primary/20">
                            👤 {item.users.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
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
        </div>
      )}

      {/* TAB 2: INCOMES DETAILED */}
      {activeTab === 'incomes' && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-text-primary text-lg flex items-center gap-2">
              <ArrowDownLeft size={20} className="text-emerald-400" />
              Lista Completa de Ingresos
            </h3>
            <Button size="sm" variant="secondary" onClick={() => setShowCreateIncome(true)} icon={<Plus size={14} />}>
              Nuevo Ingreso
            </Button>
          </div>
          {incomes.length > 0 ? (
            <div className="space-y-3">
              {incomes.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setEditingIncome(item)}
                  className="p-4 rounded-[var(--radius-lg)] hover:bg-bg-card-hover border border-border/60 bg-bg-surface/50 cursor-pointer transition-all space-y-2.5 group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        {getIncomeIcon(item.category, 20)}
                      </div>
                      <p className="font-bold text-text-primary truncate min-w-0 text-sm sm:text-base">
                        {item.title}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base sm:text-lg font-extrabold text-success">
                        {maskAmount(item.amount, '+$')}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {maskAmount(normalizeToMonthly(item.amount, item.frequency))}/mes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-text-muted flex-wrap pl-[52px]">
                    <span className="px-2 py-0.5 rounded-full bg-bg-card border border-border font-medium text-text-secondary">
                      {incomeCategoryLabels[item.category] || item.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-bg-card border border-border font-medium text-text-secondary">
                      {frequencyLabels[item.frequency] || item.frequency}
                    </span>
                    {item.users?.name && (
                      <span className="px-2 py-0.5 rounded-full bg-accent-primary-soft text-accent-primary font-semibold border border-accent-primary/20">
                        👤 Aportado por {item.users.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-text-muted space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
                <Wallet size={24} />
              </div>
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
            <h3 className="font-bold text-text-primary text-lg flex items-center gap-2">
              <Receipt size={20} className="text-rose-400" />
              Lista Completa de Gastos Fijos
            </h3>
            <Button size="sm" onClick={() => setShowCreateExpense(true)} icon={<Plus size={14} />}>
              Nuevo Gasto
            </Button>
          </div>
          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setEditingExpense(item)}
                  className="p-4 rounded-[var(--radius-lg)] hover:bg-bg-card-hover border border-border/60 bg-bg-surface/50 cursor-pointer transition-all space-y-2.5 group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                        {getExpenseIcon(item.category, 20)}
                      </div>
                      <p className="font-bold text-text-primary truncate min-w-0 text-sm sm:text-base">
                        {item.title}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base sm:text-lg font-extrabold text-danger">
                        {maskAmount(item.amount, '-$')}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {maskAmount(normalizeToMonthly(item.amount, item.frequency))}/mes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-text-muted flex-wrap pl-[52px]">
                    <span className="px-2 py-0.5 rounded-full bg-bg-card border border-border font-medium text-text-secondary">
                      {expenseCategoryLabels[item.category]?.label || item.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-bg-card border border-border font-medium text-text-secondary">
                      {frequencyLabels[item.frequency] || item.frequency}
                    </span>
                    {item.due_day && (
                      <span className="px-2 py-0.5 rounded-full bg-bg-card border border-border font-medium text-text-primary">
                        📅 Vence día {item.due_day}
                      </span>
                    )}
                    {item.users?.name && (
                      <span className="px-2 py-0.5 rounded-full bg-accent-primary-soft text-accent-primary font-semibold border border-accent-primary/20">
                        👤 Responsable: {item.users.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-text-muted space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
                <Receipt size={24} />
              </div>
              <p className="font-semibold text-text-primary">Sin gastos registrados</p>
              <p className="text-sm max-w-sm mx-auto">
                Guarda tus gastos mensuales (renta, servicios, despensa) para ver la resta automática de tus ingresos.
              </p>
              <Button onClick={() => setShowCreateExpense(true)}>Registrar Gasto</Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COUPLE SPLIT */}
      {activeTab === 'couple_split' && (
        <CoupleSplitCard
          workspaceUsers={workspaceUsers}
          incomes={incomes}
          expenses={expenses}
          totalExpenses={summary.totalExpenses}
          totalIncome={summary.totalIncome}
        />
      )}

      {/* TAB 5: HEALTH 50/30/20 */}
      {activeTab === 'health' && (
        <HealthScoreCard
          totalIncome={summary.totalIncome}
          totalExpenses={summary.totalExpenses}
          netBalance={summary.netBalance}
          expenses={expenses}
        />
      )}

      {/* TAB 6: CATEGORIES BREAKDOWN */}
      {activeTab === 'categories' && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <h3 className="font-bold text-text-primary text-lg flex items-center gap-2">
              <Tags size={20} className="text-accent-primary" />
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
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-bg-surface border border-border flex items-center justify-center shrink-0">
                        {getExpenseIcon(item.category, 15)}
                      </div>
                      <span className="font-semibold text-text-primary">
                        {item.label}
                      </span>
                      <span className="text-xs text-text-muted">
                        ({item.count} {item.count === 1 ? 'gasto' : 'gastos'})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-text-primary">
                        {maskAmount(item.total)}
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
                        backgroundColor: item.color || 'var(--accent-primary)',
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

      {/* TAB: DEUDAS EN PAREJA */}
      {activeTab === 'debts' && <InternalDebtsCard />}

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
