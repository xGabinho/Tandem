'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePrivacy } from '@/contexts/PrivacyContext'
import {
  LayoutDashboard,
  Target,
  Wallet,
  Calculator,
  Settings,
  LogOut,
  Users2,
  Eye,
  EyeOff,
} from 'lucide-react'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
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
    label: 'Simulador',
    icon: <Calculator size={20} />,
  },
  {
    href: '/settings',
    label: 'Ajustes',
    icon: <Settings size={20} />,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const { isPrivate, togglePrivacy } = usePrivacy()

  return (
    <aside className="w-72 bg-bg-card m-4 rounded-[var(--radius-xl)] shadow-sm flex flex-col p-6 border border-border">
      {/* Logo & Privacy Mode */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <img
            src="/icons/icon.svg"
            alt="Tándem"
            className="w-10 h-10 rounded-[var(--radius-md)] object-contain shadow-md"
          />
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            Tándem
          </h1>
        </div>

        <button
          onClick={togglePrivacy}
          className={`p-2 rounded-[var(--radius-md)] border transition-all ${
            isPrivate
              ? 'bg-warning-soft text-warning border-warning/30'
              : 'text-text-muted hover:text-text-primary border-border hover:bg-bg-surface'
          }`}
          title={isPrivate ? 'Mostrar cifras' : 'Ocultar cifras (Modo Privacidad)'}
        >
          {isPrivate ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
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
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  )
}
