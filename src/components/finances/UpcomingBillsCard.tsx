'use client'

import React, { useMemo } from 'react'
import { ExpenseRow } from '@/types/supabase'
import { formatCurrency } from '@/lib/utils/calculations'
import { getExpenseIcon } from '@/app/finances/page'
import { Calendar, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'

interface UpcomingBillsCardProps {
  expenses: (ExpenseRow & { users?: { name: string; avatar_url: string | null } | null })[]
  onEditExpense?: (expense: ExpenseRow) => void
}

export default function UpcomingBillsCard({
  expenses,
  onEditExpense,
}: UpcomingBillsCardProps) {
  const currentDay = new Date().getDate()
  const currentMonthName = new Date().toLocaleDateString('es-ES', { month: 'long' })

  const { sortedBills, totalNext7Days } = useMemo(() => {
    const billsWithDue = expenses.filter((e) => e.due_day && e.due_day >= 1 && e.due_day <= 31)

    const processed = billsWithDue.map((b) => {
      const due = b.due_day as number
      let daysUntil = due - currentDay
      let status: 'today' | 'upcoming' | 'passed' = 'upcoming'

      if (daysUntil === 0) {
        status = 'today'
      } else if (daysUntil < 0) {
        status = 'passed'
        // Next month occurrence
        daysUntil = 30 + daysUntil // approximate for display order
      } else if (daysUntil <= 7) {
        status = 'upcoming'
      }

      return {
        ...b,
        rawDaysUntil: due - currentDay,
        daysUntil,
        status,
      }
    })

    // Sort: today first, then upcoming (1..31), then passed (already due this month)
    processed.sort((a, b) => {
      // Prioritize positive rawDaysUntil >= 0
      const aScore = a.rawDaysUntil >= 0 ? a.rawDaysUntil : a.rawDaysUntil + 100
      const bScore = b.rawDaysUntil >= 0 ? b.rawDaysUntil : b.rawDaysUntil + 100
      return aScore - bScore
    })

    const next7Total = processed
      .filter((b) => b.rawDaysUntil >= 0 && b.rawDaysUntil <= 7)
      .reduce((sum, b) => sum + b.amount, 0)

    return {
      sortedBills: processed,
      totalNext7Days: next7Total,
    }
  }, [expenses, currentDay])

  if (sortedBills.length === 0) {
    return null
  }

  return (
    <div className="glass-card p-5 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-warning-soft text-warning flex items-center justify-center">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-base">
              Calendario de Vencimientos ({currentMonthName})
            </h3>
            <p className="text-xs text-text-muted">
              Hoy es día <span className="font-bold text-text-primary">{currentDay}</span>
            </p>
          </div>
        </div>

        {totalNext7Days > 0 && (
          <div className="self-start sm:self-auto px-3 py-1.5 rounded-[var(--radius-md)] bg-warning-soft border border-warning/30 text-xs text-warning font-semibold flex items-center gap-1.5">
            <Clock size={14} />
            <span>Próximos 7 días: ${formatCurrency(totalNext7Days)}</span>
          </div>
        )}
      </div>

      {/* Timeline List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedBills.map((bill) => {
          const isToday = bill.rawDaysUntil === 0
          const isDueSoon = bill.rawDaysUntil > 0 && bill.rawDaysUntil <= 3
          const isPassed = bill.rawDaysUntil < 0

          return (
            <div
              key={bill.id}
              onClick={() => onEditExpense && onEditExpense(bill)}
              className={`
                p-3.5 rounded-[var(--radius-lg)] border transition-all cursor-pointer flex items-center justify-between
                ${
                  isToday
                    ? 'bg-danger-soft/40 border-danger/40 shadow-sm'
                    : isDueSoon
                      ? 'bg-warning-soft/30 border-warning/40'
                      : isPassed
                        ? 'bg-bg-surface/50 border-border opacity-75'
                        : 'bg-bg-surface border-border hover:border-border-hover'
                }
              `}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-bg-card border border-border flex items-center justify-center shrink-0">
                  {getExpenseIcon(bill.category, 18)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {bill.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
                    <span className="font-bold text-text-primary">Día {bill.due_day}</span>
                    <span>•</span>
                    {isToday ? (
                      <span className="text-danger font-bold flex items-center gap-0.5">
                        <AlertCircle size={11} /> Vence Hoy
                      </span>
                    ) : isDueSoon ? (
                      <span className="text-warning font-semibold">
                        En {bill.rawDaysUntil} día{bill.rawDaysUntil !== 1 ? 's' : ''}
                      </span>
                    ) : isPassed ? (
                      <span className="text-text-muted">Ciclo siguiente</span>
                    ) : (
                      <span>En {bill.rawDaysUntil} días</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <p className="text-sm font-bold text-danger">
                  ${formatCurrency(bill.amount)}
                </p>
                {bill.users?.name && (
                  <p className="text-[10px] text-text-muted truncate max-w-[80px]">
                    {bill.users.name}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
