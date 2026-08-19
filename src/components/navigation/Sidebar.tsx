'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: '/simulator',
    label: 'Simulador',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  return (
    <aside className="w-72 bg-bg-card m-4 rounded-[var(--radius-xl)] shadow-sm flex flex-col p-6 border border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div
          className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight">
          Tándem
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1.5 flex-grow">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] font-medium text-sm
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-accent-primary-soft text-accent-primary font-semibold'
                    : 'text-text-muted hover:bg-bg-card-hover hover:text-text-primary'
                }
              `}
            >
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="mt-auto pt-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-accent-primary-soft flex items-center justify-center text-sm font-bold text-accent-primary shrink-0">
            {profile?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary truncate">
              {profile?.name || 'Usuario'}
            </p>
            <p className="text-xs text-text-muted truncate">Mi cuenta</p>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-full text-text-muted hover:text-danger hover:bg-danger-soft transition-colors"
            title="Cerrar sesión"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
