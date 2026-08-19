'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    href: '/dashboard',
    label: 'Inicio',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: '/goals',
    label: 'Metas',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 13V2l8 4-8 4" />
        <path d="M20.55 10.23A9 9 0 1 1 8 4.94" />
        <path d="M8 10a5 5 0 1 0 8.9 2.02" />
      </svg>
    ),
  },
  {
    href: '/finances',
    label: 'Finanzas',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: '/simulator',
    label: 'Simular',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="16" height="12" x="4" y="6" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 14h.01" />
        <path d="M10 14h.01" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Ajustes',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
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
