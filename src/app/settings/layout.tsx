'use client'

import Sidebar from '@/components/navigation/Sidebar'
import BottomNav from '@/components/navigation/BottomNav'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-bg-primary font-sans text-text-primary">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        <div className="p-5 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
