'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase/client'

type ThemeName = 'minimal_dark' | 'neon' | 'floral' | 'mint'

interface ThemeContextType {
  theme: ThemeName
  setTheme: (theme: ThemeName) => Promise<void>
  themes: { id: ThemeName; label: string; colors: string[] }[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Catálogo de temas disponibles con preview de colores.
 */
const THEMES: ThemeContextType['themes'] = [
  {
    id: 'minimal_dark',
    label: 'Minimal Dark',
    colors: ['#0f0f14', '#818cf8', '#a78bfa', '#f0f0f5'],
  },
  {
    id: 'neon',
    label: 'Neón',
    colors: ['#0a0a12', '#00f0ff', '#ff006e', '#7b2ffc'],
  },
  {
    id: 'floral',
    label: 'Floral',
    colors: ['#fef7f5', '#e8788a', '#c9a0dc', '#8ec5c0'],
  },
  {
    id: 'mint',
    label: 'Menta',
    colors: ['#f2faf7', '#3ecfa5', '#7ac0e0', '#1a3a30'],
  },
]

/**
 * Aplica el atributo data-theme al <html> para cambiar las variables CSS
 * en tiempo real sin recarga (RNF-006).
 */
function applyThemeToDOM(theme: ThemeName) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile, user } = useAuth()
  const [theme, setThemeState] = useState<ThemeName>('minimal_dark')

  // Cargar tema del perfil del usuario al montar
  useEffect(() => {
    if (profile?.theme_preference) {
      const validTheme = THEMES.find(
        (t) => t.id === profile.theme_preference
      )
      if (validTheme) {
        setThemeState(validTheme.id)
        applyThemeToDOM(validTheme.id)
      }
    }
  }, [profile?.theme_preference])

  // RF-003 / RN-003: Cambiar tema (por usuario, no por pareja)
  const setTheme = useCallback(
    async (newTheme: ThemeName) => {
      // Aplicar inmediatamente en el DOM (RNF-006: sin recarga)
      setThemeState(newTheme)
      applyThemeToDOM(newTheme)

      // Persistir en la base de datos
      if (user) {
        await supabase
          .from('users')
          .update({ theme_preference: newTheme })
          .eq('id', user.id)
      }
    },
    [user]
  )

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
