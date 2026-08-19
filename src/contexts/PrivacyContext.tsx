'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils/calculations'

interface PrivacyContextType {
  isPrivate: boolean
  togglePrivacy: () => void
  setPrivacy: (value: boolean) => void
  maskAmount: (value: number | string | null | undefined, prefix?: string) => string
}

const PrivacyContext = createContext<PrivacyContextType>({
  isPrivate: false,
  togglePrivacy: () => {},
  setPrivacy: () => {},
  maskAmount: () => '',
})

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isPrivate, setIsPrivate] = useState<boolean>(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tandem_privacy_mode')
      if (stored === 'true') {
        setIsPrivate(true)
      }
    } catch {
      // ignore
    }
    setMounted(true)
  }, [])

  const togglePrivacy = () => {
    setIsPrivate((prev) => {
      const next = !prev
      try {
        localStorage.setItem('tandem_privacy_mode', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const setPrivacy = (val: boolean) => {
    setIsPrivate(val)
    try {
      localStorage.setItem('tandem_privacy_mode', String(val))
    } catch {
      // ignore
    }
  }

  const maskAmount = (
    value: number | string | null | undefined,
    prefix: string = '$'
  ): string => {
    const num = typeof value === 'string' ? parseFloat(value) || 0 : (value || 0)
    if (!mounted) return `${prefix}${formatCurrency(num)}`
    if (isPrivate) {
      return `${prefix} •••••`
    }
    return `${prefix}${formatCurrency(num)}`
  }

  return (
    <PrivacyContext.Provider
      value={{
        isPrivate,
        togglePrivacy,
        setPrivacy,
        maskAmount,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  const context = useContext(PrivacyContext)
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider')
  }
  return context
}
