'use client'

import { useEffect, useState, useRef } from 'react'

interface ProgressRingProps {
  percentage: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
}

export default function ProgressRing({
  percentage,
  size = 180,
  strokeWidth = 12,
  label,
  sublabel,
}: ProgressRingProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)
  const animationRef = useRef<number | null>(null)

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const dashOffset = circumference - (animatedPercentage / 100) * circumference

  // Animate the percentage on mount / change
  useEffect(() => {
    const startTime = performance.now()
    const duration = 1200 // ms
    const startValue = animatedPercentage

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedPercentage(startValue + (percentage - startValue) * eased)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentage])

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-card-hover)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-none"
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--accent-primary)" />
            <stop offset="100%" stopColor="var(--accent-secondary)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-text-primary">
          {Math.round(animatedPercentage)}%
        </span>
        {label && (
          <span className="text-xs font-medium text-text-muted mt-0.5">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[10px] text-text-muted">{sublabel}</span>
        )}
      </div>
    </div>
  )
}
