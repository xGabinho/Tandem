import { IncomeRow, ExpenseRow, UserRow } from '@/types/supabase'
import { formatCurrency, normalizeToMonthly } from '@/lib/utils/calculations'

interface FinancesExportData {
  workspaceName?: string
  incomes: (IncomeRow & { users?: { name: string } | null })[]
  expenses: (ExpenseRow & { users?: { name: string } | null })[]
  totalIncome: number
  totalExpenses: number
  netBalance: number
  savingsRate: number
}

/**
 * Exporta el balance financiero en formato CSV compatible con Microsoft Excel y Google Sheets.
 */
export function exportFinancesToCSV(data: FinancesExportData) {
  const { incomes, expenses, totalIncome, totalExpenses, netBalance, savingsRate } = data
  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  let csvContent = '\uFEFF' // BOM para que Excel reconozca tildes y caracteres especiales UTF-8

  // Encabezado
  csvContent += `TÁNDEM — REPORTE FINANCIERO MENSUAL\n`
  csvContent += `Fecha de generación: ${dateStr}\n\n`

  // 1. Resumen General
  csvContent += `RESUMEN GENERAL\n`
  csvContent += `Métrica,Monto\n`
  csvContent += `Ingresos Totales Mensuales,${totalIncome}\n`
  csvContent += `Gastos Fijos Mensuales,${totalExpenses}\n`
  csvContent += `Balance Disponible Neto,${netBalance}\n`
  csvContent += `Capacidad de Ahorro,${savingsRate}%\n\n`

  // 2. Detalle de Ingresos
  csvContent += `DETALLE DE INGRESOS\n`
  csvContent += `Concepto,Categoría,Frecuencia,Monto Registrado,Monto Normalizado Mensual,Aportante\n`
  incomes.forEach((inc) => {
    const monthlyAmount = normalizeToMonthly(inc.amount, inc.frequency)
    const user = inc.users?.name || 'Común'
    csvContent += `"${inc.title}","${inc.category}","${inc.frequency}",${inc.amount},${monthlyAmount},"${user}"\n`
  })
  csvContent += `\n`

  // 3. Detalle de Gastos
  csvContent += `DETALLE DE GASTOS FIJOS\n`
  csvContent += `Concepto,Categoría,Frecuencia,Día de Vencimiento,Monto Registrado,Monto Normalizado Mensual,Responsable\n`
  expenses.forEach((exp) => {
    const monthlyAmount = normalizeToMonthly(exp.amount, exp.frequency)
    const due = exp.due_day ? `Día ${exp.due_day}` : 'Sin día fijo'
    const user = exp.users?.name || 'Común'
    csvContent += `"${exp.title}","${exp.category}","${exp.frequency}","${due}",${exp.amount},${monthlyAmount},"${user}"\n`
  })

  // Descarga del archivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `Tandem_Reporte_Financiero_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Dispara el cuadro de diálogo de impresión nativo optimizado para PDF.
 */
export function printFinancesReport() {
  if (typeof window !== 'undefined') {
    window.print()
  }
}
