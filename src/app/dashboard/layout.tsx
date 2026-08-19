'use client'

import Sidebar from '@/components/navigation/Sidebar'
import BottomNav from '@/components/navigation/BottomNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-bg-primary font-sans text-text-primary">
      {/* Desktop Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        <div className="p-5 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav — hidden on desktop */}
      <BottomNav />
    </div>
  )
}
