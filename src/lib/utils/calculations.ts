/**
 * Utilidades de cálculos financieros para Tándem.
 * Todas las funciones mantienen precisión de 2 decimales (RNF-003).
 */

import { Database } from '@/types/supabase'

type GoalRow = Database['public']['Tables']['goals']['Row']
type ContributionRow = Database['public']['Tables']['contributions']['Row']

/**
 * Redondea un número a 2 decimales de forma segura.
 */
export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100
}

/**
 * Formatea un número como moneda (sin símbolo).
 * Ejemplo: 1234.5 → "1,234.50"
 */
export function formatCurrency(amount: number): string {
  return roundToTwo(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * RF-017 / RN-017: Calcula el progreso global del workspace.
 * % = Σ abonos / Σ montos objetivos × 100
 *
 * Solo considera metas de tipo 'savings' con target_amount > 0.
 */
export function calculateGlobalProgress(
  goals: GoalRow[],
  contributions: ContributionRow[]
): {
  totalSaved: number
  totalTarget: number
  percentage: number
  activeGoals: number
  completedGoals: number
} {
  const savingsGoals = goals.filter(
    (g) => g.type === 'savings' && g.target_amount && g.target_amount > 0
  )

  const totalTarget = savingsGoals.reduce(
    (sum, g) => sum + (g.target_amount || 0),
    0
  )

  const goalIds = new Set(savingsGoals.map((g) => g.id))
  const totalSaved = contributions
    .filter((c) => goalIds.has(c.goal_id))
    .reduce((sum, c) => sum + c.amount, 0)

  const percentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  const completedGoals = savingsGoals.filter(
    (g) => g.status === 'completed'
  ).length

  return {
    totalSaved: roundToTwo(totalSaved),
    totalTarget: roundToTwo(totalTarget),
    percentage: roundToTwo(Math.min(percentage, 100)),
    activeGoals: savingsGoals.length - completedGoals,
    completedGoals,
  }
}

/**
 * RF-015 / RN-015: Calcula la capacidad de ahorro.
 * Capacidad = Ingresos - Gastos
 * Solo sugerencia visual, no se persiste.
 */
export function calculateSavingsCapacity(
  income: number,
  expenses: number
): {
  capacity: number
  savingsRate: number
} {
  const capacity = roundToTwo(Math.max(income - expenses, 0))
  const savingsRate = income > 0 ? roundToTwo((capacity / income) * 100) : 0

  return { capacity, savingsRate }
}

/**
 * RF-016 / RN-016: Calcula la cuota necesaria por periodo.
 * Fórmula: (Monto Objetivo - Abonos) / Periodos Restantes
 * Frecuencia: mensual o quincenal.
 */
export function calculateInstallment(
  targetAmount: number,
  totalContributions: number,
  targetDate: string,
  frequency: 'monthly' | 'biweekly' = 'monthly'
): {
  remainingAmount: number
  periodsRemaining: number
  installmentAmount: number
  frequencyLabel: string
} {
  const remaining = roundToTwo(Math.max(targetAmount - totalContributions, 0))

  const now = new Date()
  const target = new Date(targetDate)
  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0)

  let periodsRemaining: number
  let frequencyLabel: string

  if (frequency === 'biweekly') {
    periodsRemaining = Math.max(Math.ceil(diffDays / 15), 1)
    frequencyLabel = 'Quincenal'
  } else {
    periodsRemaining = Math.max(Math.ceil(diffDays / 30), 1)
    frequencyLabel = 'Mensual'
  }

  const installmentAmount = roundToTwo(remaining / periodsRemaining)

  return {
    remainingAmount: remaining,
    periodsRemaining,
    installmentAmount,
    frequencyLabel,
  }
}

/**
 * Calcula el progreso de una meta individual (tipo savings).
 */
export function calculateGoalProgress(
  targetAmount: number,
  totalContributions: number
): {
  saved: number
  remaining: number
  percentage: number
} {
  const saved = roundToTwo(totalContributions)
  const remaining = roundToTwo(Math.max(targetAmount - totalContributions, 0))
  const percentage = targetAmount > 0
    ? roundToTwo(Math.min((totalContributions / targetAmount) * 100, 100))
    : 0

  return { saved, remaining, percentage }
}

/**
 * Valida que un monto de abono no exceda el restante de la meta (RN-013).
 */
export function validateContributionAmount(
  amount: number,
  targetAmount: number,
  currentTotal: number
): { valid: boolean; message?: string } {
  if (amount <= 0) {
    return { valid: false, message: 'El monto debe ser mayor a 0.' }
  }
  const remaining = targetAmount - currentTotal
  if (amount > remaining) {
    return {
      valid: false,
      message: `El monto no puede exceder el restante ($${formatCurrency(remaining)}).`,
    }
  }
  return { valid: true }
}
