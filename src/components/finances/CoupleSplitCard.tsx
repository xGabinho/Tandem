'use client'

import React, { useState, useMemo } from 'react'
import { IncomeRow, ExpenseRow, UserRow } from '@/types/supabase'
import { formatCurrency, normalizeToMonthly } from '@/lib/utils/calculations'
import { Users2, Scale, ArrowRightLeft, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react'

interface CoupleSplitCardProps {
  workspaceUsers: UserRow[]
  incomes: (IncomeRow & { users?: { name: string; avatar_url: string | null } | null })[]
  expenses: (ExpenseRow & { users?: { name: string; avatar_url: string | null } | null })[]
  totalExpenses: number
  totalIncome: number
}

type SplitMode = 'proportional' | 'equal'

export default function CoupleSplitCard({
  workspaceUsers,
  incomes,
  expenses,
  totalExpenses,
  totalIncome,
}: CoupleSplitCardProps) {
  const [splitMode, setSplitMode] = useState<SplitMode>('proportional')

  const splitData = useMemo(() => {
    if (workspaceUsers.length === 0 || totalIncome <= 0) return null

    // Calculate income and expenses covered per user
    const usersMap: Record<
      string,
      {
        user: UserRow
        income: number
        coveredExpenses: number
      }
    > = {}

    workspaceUsers.forEach((u) => {
      usersMap[u.id] = {
        user: u,
        income: 0,
        coveredExpenses: 0,
      }
    })

    // Sum monthly incomes
    incomes.forEach((inc) => {
      const uId = inc.user_id
      const monthly = normalizeToMonthly(inc.amount, inc.frequency)
      if (uId && usersMap[uId]) {
        usersMap[uId].income += monthly
      }
    })

    // Sum monthly expenses covered
    expenses.forEach((exp) => {
      const uId = exp.user_id
      const monthly = normalizeToMonthly(exp.amount, exp.frequency)
      if (uId && usersMap[uId]) {
        usersMap[uId].coveredExpenses += monthly
      }
    })

    const members = Object.values(usersMap).map((m) => {
      const incomePercentage = totalIncome > 0 ? (m.income / totalIncome) * 100 : (100 / workspaceUsers.length)
      
      const fairPercentage = splitMode === 'proportional' 
        ? incomePercentage 
        : (100 / workspaceUsers.length)

      const fairShare = (totalExpenses * fairPercentage) / 100
      const balance = m.coveredExpenses - fairShare // > 0 means paid more than share, < 0 means owes share

      return {
        ...m,
        incomePercentage,
        fairPercentage,
        fairShare,
        balance,
      }
    })

    // If exactly 2 people, determine transfer settlement
    let settlementMessage = ''
    if (members.length === 2) {
      const [u1, u2] = members
      const diff = Math.abs(u1.balance)
      if (diff > 0.01) {
        const payer = u1.balance < 0 ? u1 : u2
        const receiver = u1.balance < 0 ? u2 : u1
        settlementMessage = `${payer.user.name} le transfiere $${formatCurrency(diff)} a ${receiver.user.name} para equilibrar los gastos del mes.`
      } else {
        settlementMessage = '¡Los aportes a los gastos están perfectamente equilibrados!'
      }
    }

    return {
      members,
      settlementMessage,
    }
  }, [workspaceUsers, incomes, expenses, totalExpenses, totalIncome, splitMode])

  if (!splitData || workspaceUsers.length < 2) {
    return (
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-text-primary font-bold">
          <Users2 size={18} className="text-accent-primary" />
          <span>División de Gastos en Pareja</span>
        </div>
        <p className="text-sm text-text-muted">
          Invita a tu pareja al espacio y asignen quién aporta cada ingreso y gasto para calcular la división equitativa automática.
        </p>
      </div>
    )
  }

  return (
    <div className="glass-card p-5 md:p-6 space-y-5">
      {/* Header & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-text-primary text-base md:text-lg flex items-center gap-2">
            <Scale size={20} className="text-accent-primary" />
            División Justa de Gastos Compartidos
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {splitMode === 'proportional'
              ? 'Basado en los ingresos relativos de cada uno (Equidad proporcional)'
              : 'División exacta en partes iguales (50 / 50)'}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-bg-surface p-1 rounded-[var(--radius-md)] border border-border shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setSplitMode('proportional')}
            className={`px-3 py-1 text-xs font-semibold rounded-[var(--radius-sm)] transition-all flex items-center gap-1.5 ${
              splitMode === 'proportional'
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Sparkles size={13} /> Proporcional (% Ingresos)
          </button>
          <button
            onClick={() => setSplitMode('equal')}
            className={`px-3 py-1 text-xs font-semibold rounded-[var(--radius-sm)] transition-all ${
              splitMode === 'equal'
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            50 / 50
          </button>
        </div>
      </div>

      {/* Members Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {splitData.members.map((member, index) => {
          const isPrimary = index === 0
          return (
            <div
              key={member.user.id}
              className="p-4 rounded-[var(--radius-lg)] bg-bg-surface border border-border space-y-3.5"
            >
              {/* User title */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-accent-primary-soft text-accent-primary font-bold flex items-center justify-center text-sm border border-accent-primary/20">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary text-sm leading-tight">
                      {member.user.name}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      Ingreso: ${formatCurrency(member.income)} ({member.incomePercentage.toFixed(0)}% del total)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-accent-primary px-2 py-0.5 rounded-full bg-accent-primary-soft border border-accent-primary/20">
                  Cuota: {member.fairPercentage.toFixed(0)}%
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2.5 rounded-[var(--radius-md)] bg-bg-card border border-border">
                  <span className="text-text-muted block text-[11px]">Cuota justa a cubrir</span>
                  <span className="font-bold text-text-primary text-sm">
                    ${formatCurrency(member.fairShare)}
                  </span>
                </div>
                <div className="p-2.5 rounded-[var(--radius-md)] bg-bg-card border border-border">
                  <span className="text-text-muted block text-[11px]">Gasto que ya paga</span>
                  <span className="font-bold text-text-primary text-sm">
                    ${formatCurrency(member.coveredExpenses)}
                  </span>
                </div>
              </div>

              {/* Status indicator */}
              <div className="text-xs pt-1 flex items-center justify-between">
                <span className="text-text-muted">Balance personal de gastos:</span>
                {Math.abs(member.balance) < 0.01 ? (
                  <span className="text-success font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Al día
                  </span>
                ) : member.balance > 0 ? (
                  <span className="text-success font-semibold">
                    A favor +${formatCurrency(member.balance)}
                  </span>
                ) : (
                  <span className="text-danger font-semibold">
                    Aporte pendiente -${formatCurrency(Math.abs(member.balance))}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Settlement Advice Banner */}
      {splitData.settlementMessage && (
        <div className="p-3.5 rounded-[var(--radius-lg)] bg-accent-primary-soft/50 border border-accent-primary/20 flex items-center gap-3 text-xs md:text-sm text-text-primary">
          <ArrowRightLeft size={18} className="text-accent-primary shrink-0" />
          <p className="font-medium">
            <span className="font-bold text-accent-primary">Ajuste recomendado: </span>
            {splitData.settlementMessage}
          </p>
        </div>
      )}
    </div>
  )
}
