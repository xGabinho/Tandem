'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Target,
  Wallet,
  Calculator,
  Settings,
} from 'lucide-react'

const navItems = [
  {
    href: '/dashboard',
    label: 'Inicio',
    icon: <LayoutDashboard size={20} />,
  },
  {
    href: '/goals',
    label: 'Metas',
    icon: <Target size={20} />,
  },
  {
    href: '/finances',
    label: 'Finanzas',
    icon: <Wallet size={20} />,
  },
  {
    href: '/simulator',
    label: 'Simular',
    icon: <Calculator size={20} />,
  },
  {
    href: '/settings',
    label: 'Ajustes',
    icon: <Settings size={20} />,
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-bg-card/90 backdrop-blur-xl border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-0.5 px-3 py-2 rounded-[var(--radius-lg)] min-w-[56px]
                transition-all duration-200
                ${
                  isActive
                    ? 'text-accent-primary'
                    : 'text-text-muted'
                }
              `}
            >
              <span
                className={`
                  p-1.5 rounded-[var(--radius-md)] transition-all duration-200
                  ${isActive ? 'bg-accent-primary-soft' : ''}
                `}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-semibold leading-tight">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
