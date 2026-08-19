'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils/calculations'
import { usePrivacy } from '@/contexts/PrivacyContext'

interface StatItem {
  label: string
  value: number
  prefix?: string
  suffix?: string
  icon: React.ReactNode
  color: string
}

interface QuickStatsProps {
  stats: StatItem[]
}

function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
}: {
  value: number
  prefix?: string
  suffix?: string
}) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const duration = 1000
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(value * eased)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  return (
    <span>
      {prefix}
      {formatCurrency(displayed)}
      {suffix}
    </span>
  )
}

export default function QuickStats({ stats }: QuickStatsProps) {
  const { isPrivate } = usePrivacy()

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="glass-card p-4 md:p-5 animate-fade-in"
          style={{ animationDelay: `${index * 0.08}s` }}
        >
          <div
            className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center mb-3"
            style={{ background: `${stat.color}20`, color: stat.color }}
          >
            {stat.icon}
          </div>
          <p className="text-xs text-text-muted font-medium mb-1">
            {stat.label}
          </p>
          <p className="text-xl md:text-2xl font-bold text-text-primary">
            {isPrivate && stat.prefix === '$' ? (
              <span>$ •••••</span>
            ) : (
              <AnimatedNumber
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
              />
            )}
          </p>
        </div>
      ))}
    </div>
  )
}
