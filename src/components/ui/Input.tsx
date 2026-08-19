'use client'

import { InputHTMLAttributes, forwardRef, useState } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, rightIcon, className = '', id, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary pl-1"
          >
            {label}
          </label>
        )}
        <div
          className={`
            relative flex items-center rounded-[var(--radius-lg)] overflow-hidden
            bg-bg-input border transition-all duration-200
            ${
              error
                ? 'border-danger'
                : focused
                  ? 'border-accent-primary shadow-[0_0_0_3px_var(--accent-primary-soft)]'
                  : 'border-border hover:border-border-hover'
            }
          `}
        >
          {icon && (
            <span className="pl-4 text-text-muted shrink-0">{icon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            onFocus={(e) => {
              setFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              props.onBlur?.(e)
            }}
            className={`
              w-full bg-transparent px-4 py-3 text-sm text-text-primary
              placeholder:text-text-muted outline-none
              ${icon ? 'pl-2' : ''}
              ${rightIcon ? 'pr-2' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <span className="pr-4 text-text-muted shrink-0">{rightIcon}</span>
          )}
        </div>
        {error && (
          <p className="text-xs text-danger pl-1 animate-slide-down">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-text-muted pl-1">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
