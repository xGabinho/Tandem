'use client'

import React from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/calculations'
import { usePrivacy } from '@/contexts/PrivacyContext'
import {
  PiggyBank,
  Target,
  CheckCircle2,
  Receipt,
  Sparkles,
  ArrowRight,
  Clock,
  Heart,
} from 'lucide-react'

export interface ActivityItem {
  id: string
  type: 'contribution' | 'goal_created' | 'goal_completed' | 'expense_added'
  userName: string
  userInitial?: string
  title: string
  amount?: number
  goalId?: string
  goalTitle?: string
  createdAt: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  loading?: boolean
}

function getRelativeTime(dateString: string): string {
  try {
    const now = new Date()
    const past = new Date(dateString)
    const diffMs = now.getTime() - past.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return 'Hace un momento'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours} h`
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} días`

    return past.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return 'Reciente'
  }
}

export default function ActivityFeed({ activities, loading = false }: ActivityFeedProps) {
  const { maskAmount } = usePrivacy()
  if (loading) {
    return (
      <div className="glass-card p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 bg-bg-surface animate-pulse rounded-[var(--radius-sm)]" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-bg-surface/50 rounded-[var(--radius-md)] animate-pulse">
              <div className="w-9 h-9 rounded-full bg-bg-card shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-3/4 bg-bg-card rounded" />
                <div className="h-2.5 w-1/3 bg-bg-card rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-5 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent-primary-soft flex items-center justify-center text-accent-primary">
            <Heart size={16} />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-base">
              Actividad en Pareja
            </h3>
            <p className="text-xs text-text-muted">
              Últimas acciones y movimientos juntos
            </p>
          </div>
        </div>

        <Link
          href="/goals"
          className="text-xs font-semibold text-accent-primary hover:underline flex items-center gap-1"
        >
          Ver metas →
        </Link>
      </div>

      {/* Feed list */}
      {activities.length > 0 ? (
        <div className="space-y-2.5">
          {activities.map((item) => {
            const initial = item.userInitial || (item.userName ? item.userName.charAt(0).toUpperCase() : 'U')
            const timeAgo = getRelativeTime(item.createdAt)

            let icon = <PiggyBank size={16} className="text-emerald-400" />
            let bgStyle = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'

            if (item.type === 'goal_created') {
              icon = <Target size={16} className="text-accent-primary" />
              bgStyle = 'bg-accent-primary-soft border-accent-primary/20 text-accent-primary'
            } else if (item.type === 'goal_completed') {
              icon = <CheckCircle2 size={16} className="text-amber-400" />
              bgStyle = 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            } else if (item.type === 'expense_added') {
              icon = <Receipt size={16} className="text-rose-400" />
              bgStyle = 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }

            const contentNode = (
              <div className="p-3 md:p-3.5 rounded-[var(--radius-md)] bg-bg-surface border border-border hover:border-border-hover transition-all flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar / Initial + Action icon badge */}
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-bg-card border border-border flex items-center justify-center font-bold text-xs text-text-primary">
                      {initial}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border ${bgStyle}`}
                    >
                      {item.type === 'contribution' && <PiggyBank size={10} />}
                      {item.type === 'goal_created' && <Target size={10} />}
                      {item.type === 'goal_completed' && <Sparkles size={10} />}
                      {item.type === 'expense_added' && <Receipt size={10} />}
                    </div>
                  </div>

                  {/* Text details */}
                  <div className="min-w-0">
                    <p className="text-xs text-text-primary leading-snug truncate">
                      <span className="font-bold">{item.userName}</span>{' '}
                      {item.type === 'contribution' && (
                        <span>
                          abonó a <span className="font-semibold text-accent-primary">{item.goalTitle || 'una meta'}</span>
                        </span>
                      )}
                      {item.type === 'goal_created' && (
                        <span>
                          creó la meta <span className="font-semibold">{item.goalTitle}</span>
                        </span>
                      )}
                      {item.type === 'goal_completed' && (
                        <span>
                          ¡Completó la meta <span className="font-semibold text-success">{item.goalTitle}</span>! 🎉
                        </span>
                      )}
                      {item.type === 'expense_added' && (
                        <span>
                          registró el gasto <span className="font-semibold">{item.title}</span>
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                      <Clock size={10} />
                      <span>{timeAgo}</span>
                    </p>
                  </div>
                </div>

                {/* Right Amount / Badge */}
                {item.amount && item.amount > 0 && (
                  <div className="shrink-0 text-right">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-[var(--radius-sm)] ${
                        item.type === 'expense_added'
                          ? 'bg-danger-soft text-danger'
                          : 'bg-success-soft text-success'
                      }`}
                    >
                      {maskAmount(item.amount, item.type === 'expense_added' ? '-$' : '+$')}
                    </span>
                  </div>
                )}
              </div>
            )

            if (item.goalId) {
              return (
                <Link key={item.id} href={`/goals/${item.goalId}`} className="block">
                  {contentNode}
                </Link>
              )
            }

            return <div key={item.id}>{contentNode}</div>
          })}
        </div>
      ) : (
        <div className="text-center py-6 px-4 bg-bg-surface/40 rounded-[var(--radius-lg)] border border-border/50">
          <div className="w-10 h-10 rounded-full bg-accent-primary-soft text-accent-primary flex items-center justify-center mx-auto mb-2">
            <Sparkles size={18} />
          </div>
          <p className="text-xs font-semibold text-text-primary">
            ¡Aún no hay actividad registrada!
          </p>
          <p className="text-[11px] text-text-muted mt-0.5 max-w-xs mx-auto">
            Hagan su primer abono o creen una meta para ver el registro en vivo aquí.
          </p>
        </div>
      )}
    </div>
  )
}
