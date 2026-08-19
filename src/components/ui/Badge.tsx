interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent'
  size?: 'sm' | 'md'
  dot?: boolean
}

const variantStyles = {
  default: 'bg-bg-card-hover text-text-secondary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  accent: 'bg-accent-primary-soft text-accent-primary',
}

const sizeStyles = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-semibold rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full bg-current`}
        />
      )}
      {children}
    </span>
  )
}
