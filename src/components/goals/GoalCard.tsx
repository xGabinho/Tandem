'use client'

import Badge from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils/calculations'
import { Database } from '@/types/supabase'
import Link from 'next/link'

type GoalRow = Database['public']['Tables']['goals']['Row']

interface GoalCardProps {
  goal: GoalRow
  totalContributions?: number
}

const typeConfig = {
  savings: { label: 'Ahorro', emoji: '💰', variant: 'success' as const },
  quoting: { label: 'Cotización', emoji: '🔍', variant: 'info' as const },
  experience: { label: 'Experiencia', emoji: '⭐', variant: 'accent' as const },
}

const priorityConfig = {
  high: { label: 'Alta', variant: 'danger' as const },
  medium: { label: 'Media', variant: 'warning' as const },
  low: { label: 'Baja', variant: 'success' as const },
}

export default function GoalCard({ goal, totalContributions = 0 }: GoalCardProps) {
  const type = typeConfig[goal.type]
  const priority = priorityConfig[goal.priority]

  const percentage =
    goal.type === 'savings' && goal.target_amount && goal.target_amount > 0
      ? Math.min((totalContributions / goal.target_amount) * 100, 100)
      : 0

  return (
    <Link href={`/goals/${goal.id}`}>
      <div className="glass-card p-0 overflow-hidden cursor-pointer group">
        {/* Image or colored header */}
        <div className="relative h-36 md:h-40 bg-bg-surface overflow-hidden">
          {goal.image_url ? (
            <img
              src={goal.image_url}
              alt={goal.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-5xl opacity-30"
              style={{ background: 'var(--accent-primary-soft)' }}
            >
              {type.emoji}
            </div>
          )}

          {/* Status overlay */}
          {goal.status === 'completed' && (
            <div className="absolute inset-0 bg-bg-primary/60 flex items-center justify-center">
              <Badge variant="success" size="md">
                ✓ Completada
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 md:p-5 space-y-3">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={type.variant} size="sm">
              {type.emoji} {type.label}
            </Badge>
            <Badge variant={priority.variant} size="sm" dot>
              {priority.label}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-text-primary leading-tight line-clamp-2">
            {goal.title}
          </h3>

          {/* Progress bar (savings only) */}
          {goal.type === 'savings' && goal.target_amount && (
            <>
              <div className="w-full h-2 bg-bg-card-hover rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${percentage}%`,
                    background: 'var(--accent-gradient)',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-muted">
                <span>${formatCurrency(totalContributions)}</span>
                <span>${formatCurrency(goal.target_amount)}</span>
              </div>
            </>
          )}

          {/* Quoting label */}
          {goal.type === 'quoting' && (
            <p className="text-xs text-text-muted italic">En investigación</p>
          )}

          {/* Target date */}
          {goal.target_date && (
            <p className="text-xs text-text-muted">
              📅 {new Date(goal.target_date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
