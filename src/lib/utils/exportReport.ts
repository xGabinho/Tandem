import { IncomeRow, ExpenseRow } from '@/types/supabase'
import { formatCurrency, normalizeToMonthly } from './calculations'

interface ExportDataParams {
  workspaceName?: string
  incomes: (IncomeRow & { users?: { name: string; avatar_url: string | null } | null })[]
  expenses: (ExpenseRow & { users?: { name: string; avatar_url: string | null } | null })[]
  totalIncome: number
  totalExpenses: number
  netBalance: number
  savingsRate: number
}

export function exportFinancesToCSV({
  workspaceName = 'Espacio Compartido',
  incomes,
  expenses,
  totalIncome,
  totalExpenses,
  netBalance,
  savingsRate,
}: ExportDataParams) {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const rows: string[][] = [
    ['TANDEM - REPORTE FINANCIERO MENSUAL'],
    ['Espacio', workspaceName],
    ['Fecha de Generación', currentDate],
    [],
    ['RESUMEN GENERAL MENSUAL'],
    ['Ingresos Totales Mensuales', `$${formatCurrency(totalIncome)}`],
    ['Gastos Fijos Totales Mensuales', `$${formatCurrency(totalExpenses)}`],
    ['Balance Disponible para Ahorro/Metas', `$${formatCurrency(netBalance)}`],
    ['Tasa de Capacidad de Ahorro', `${savingsRate}%`],
    [],
    ['DETALLE DE INGRESOS'],
    ['Concepto', 'Categoría', 'Frecuencia', 'Monto Original', 'Equivalente Mensual', 'Aportante'],
  ]

  // Incomes rows
  incomes.forEach((inc) => {
    const monthlyAmount = normalizeToMonthly(inc.amount, inc.frequency)
    rows.push([
      `"${inc.title.replace(/"/g, '""')}"`,
      inc.category,
      inc.frequency,
      `$${formatCurrency(inc.amount)}`,
      `$${formatCurrency(monthlyAmount)}`,
      inc.users?.name || 'No asignado',
    ])
  })

  rows.push([])
  rows.push(['DETALLE DE GASTOS FIJOS'])
  rows.push(['Concepto', 'Categoría', 'Frecuencia', 'Día de Vencimiento', 'Monto Original', 'Equivalente Mensual', 'Responsable'])

  // Expenses rows
  expenses.forEach((exp) => {
    const monthlyAmount = normalizeToMonthly(exp.amount, exp.frequency)
    rows.push([
      `"${exp.title.replace(/"/g, '""')}"`,
      exp.category,
      exp.frequency,
      exp.due_day ? `Día ${exp.due_day}` : 'Sin fecha',
      `$${formatCurrency(exp.amount)}`,
      `$${formatCurrency(monthlyAmount)}`,
      exp.users?.name || 'No asignado',
    ])
  })

  const csvContent = '\uFEFF' + rows.map((e) => e.join(';')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `Tandem_Reporte_Financiero_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
