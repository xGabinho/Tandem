'use client'

import React, { useMemo } from 'react'
import { ExpenseRow } from '@/types/supabase'
import { formatCurrency, normalizeToMonthly } from '@/lib/utils/calculations'
import { Activity, CheckCircle2, AlertTriangle, Info, Sparkles, TrendingUp } from 'lucide-react'

interface HealthScoreCardProps {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  expenses: ExpenseRow[]
}

const NEEDS_CATEGORIES = new Set(['housing', 'utilities', 'food', 'transport', 'education', 'health', 'debt'])
const WANTS_CATEGORIES = new Set(['subscriptions', 'other'])

export default function HealthScoreCard({
  totalIncome,
  totalExpenses,
  netBalance,
  expenses,
}: HealthScoreCardProps) {
  const analysis = useMemo(() => {
    if (totalIncome <= 0) {
      return null
    }

    let needsTotal = 0
    let wantsTotal = 0

    expenses.forEach((exp) => {
      const monthly = normalizeToMonthly(exp.amount, exp.frequency)
      const cat = exp.category || 'other'
      const isNeed = exp.is_fixed !== null ? exp.is_fixed : NEEDS_CATEGORIES.has(cat)
      if (isNeed) {
        needsTotal += monthly
      } else {
        wantsTotal += monthly
      }
    })

    const savingsTotal = Math.max(netBalance, 0)

    const needsPct = (needsTotal / totalIncome) * 100
    const wantsPct = (wantsTotal / totalIncome) * 100
    const savingsPct = (savingsTotal / totalIncome) * 100

    // Compute Health Score (0 - 100)
    let score = 100
    if (needsPct > 50) score -= Math.min((needsPct - 50) * 1.5, 35)
    if (wantsPct > 30) score -= Math.min((wantsPct - 30) * 1.2, 25)
    if (savingsPct < 20) score -= Math.min((20 - savingsPct) * 2, 40)
    if (netBalance < 0) score = Math.max(10, score - 50)

    score = Math.round(Math.max(10, Math.min(100, score)))

    // Generate smart tips
    const tips: { type: 'success' | 'warning' | 'info'; message: string }[] = []

    if (savingsPct >= 20) {
      tips.push({
        type: 'success',
        message: `¡Excelente hábito! Están ahorrando el ${savingsPct.toFixed(0)}% de sus ingresos (meta recomendada: ≥20%).`,
      })
    } else if (savingsPct > 0) {
      tips.push({
        type: 'warning',
        message: `Su capacidad de ahorro es del ${savingsPct.toFixed(0)}%. Intenten optimizar gastos no esenciales para alcanzar el 20%.`,
      })
    } else {
      tips.push({
        type: 'warning',
        message: 'Sus gastos superan sus ingresos mensuales. Es prioritario reducir gastos fijos para evitar deudas.',
      })
    }

    if (needsPct > 50) {
      tips.push({
        type: 'info',
        message: `Las necesidades básicas representan el ${needsPct.toFixed(0)}% de sus ingresos (ideal: ≤50%).`,
      })
    }

    return {
      needsTotal,
      wantsTotal,
      savingsTotal,
      needsPct,
      wantsPct,
      savingsPct,
      score,
      tips,
    }
  }, [totalIncome, totalExpenses, netBalance, expenses])

  if (!analysis) return null

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Excelente Salud', color: 'text-success', bg: 'bg-success-soft border-success/30' }
    if (score >= 60) return { label: 'Salud Aceptable', color: 'text-warning', bg: 'bg-warning-soft border-warning/30' }
    return { label: 'Atención Requerida', color: 'text-danger', bg: 'bg-danger-soft border-danger/30' }
  }

  const badge = getScoreBadge(analysis.score)

  return (
    <div className="glass-card p-5 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-accent-primary-soft text-accent-primary flex items-center justify-center">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-base md:text-lg">
              Diagnóstico Financiero (Regla 50 / 30 / 20)
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Evaluación del balance presupuestario del hogar
            </p>
          </div>
        </div>

        {/* Score pill */}
        <div className={`self-start sm:self-auto px-3.5 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 ${badge.bg} ${badge.color}`}>
          <span>Puntaje: {analysis.score}/100</span>
          <span>•</span>
          <span>{badge.label}</span>
        </div>
      </div>

      {/* 3 Pillars Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Necesidades (50%) */}
        <div className="p-4 rounded-[var(--radius-lg)] bg-bg-surface border border-border space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-text-primary">🏠 Necesidades Básicas</span>
            <span className="text-text-muted">Meta: ≤50%</span>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {analysis.needsPct.toFixed(1)}%
          </p>
          <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                analysis.needsPct <= 50 ? 'bg-indigo-500' : 'bg-danger'
              }`}
              style={{ width: `${Math.min(analysis.needsPct, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-text-muted">
            ${formatCurrency(analysis.needsTotal)}/mes (Renta, transporte/pasajes, servicios, comida)
          </p>
        </div>

        {/* Deseos (30%) */}
        <div className="p-4 rounded-[var(--radius-lg)] bg-bg-surface border border-border space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-text-primary">✨ Estilo de Vida / Deseos</span>
            <span className="text-text-muted">Meta: ≤30%</span>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {analysis.wantsPct.toFixed(1)}%
          </p>
          <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                analysis.wantsPct <= 30 ? 'bg-pink-500' : 'bg-warning'
              }`}
              style={{ width: `${Math.min(analysis.wantsPct, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-text-muted">
            ${formatCurrency(analysis.wantsTotal)}/mes (Streaming, ocio, otros)
          </p>
        </div>

        {/* Ahorro / Metas (20%) */}
        <div className="p-4 rounded-[var(--radius-lg)] bg-bg-surface border border-border space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-text-primary">🎯 Ahorro & Metas</span>
            <span className="text-text-muted">Meta: ≥20%</span>
          </div>
          <p className="text-xl font-bold text-success">
            {analysis.savingsPct.toFixed(1)}%
          </p>
          <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-success transition-all duration-500"
              style={{ width: `${Math.min(analysis.savingsPct, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-text-muted">
            ${formatCurrency(analysis.savingsTotal)}/mes (Disponible para metas)
          </p>
        </div>
      </div>

      {/* Tips list */}
      <div className="space-y-2 pt-1">
        {analysis.tips.map((tip, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-[var(--radius-md)] border text-xs flex items-start gap-2.5 ${
              tip.type === 'success'
                ? 'bg-success-soft/30 border-success/30 text-text-primary'
                : tip.type === 'warning'
                  ? 'bg-warning-soft/30 border-warning/30 text-text-primary'
                  : 'bg-accent-primary-soft/30 border-accent-primary/20 text-text-primary'
            }`}
          >
            {tip.type === 'success' ? (
              <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
            ) : tip.type === 'warning' ? (
              <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
            ) : (
              <Info size={16} className="text-accent-primary shrink-0 mt-0.5" />
            )}
            <span>{tip.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
