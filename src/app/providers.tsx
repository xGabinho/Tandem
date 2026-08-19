'use client'

import { useEffect } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { PrivacyProvider } from '@/contexts/PrivacyContext'
import { registerServiceWorker } from '@/lib/utils/notifications'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <AuthProvider>
      <ThemeProvider>
        <PrivacyProvider>{children}</PrivacyProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

