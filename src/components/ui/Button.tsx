'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-primary text-text-inverse hover:bg-accent-primary-hover shadow-sm hover:shadow-md',
  secondary:
    'bg-accent-primary-soft text-accent-primary hover:bg-accent-primary/20',
  ghost:
    'bg-transparent text-text-secondary hover:bg-bg-card-hover hover:text-text-primary',
  danger:
    'bg-danger-soft text-danger hover:bg-danger/20',
  outline:
    'bg-transparent border border-border text-text-secondary hover:border-border-hover hover:text-text-primary hover:bg-bg-card-hover',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3.5 text-base gap-2.5',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-semibold
          rounded-full transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:ring-offset-2 focus:ring-offset-bg-primary
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          active:scale-[0.97]
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
