'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import type { User, Session } from '@supabase/supabase-js'

type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error?: string }>
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Guarda los tokens de sesión en cookies para que el proxy.ts pueda leerlos.
 */
function setSessionCookies(session: Session | null) {
  if (session) {
    document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
  } else {
    document.cookie = 'sb-access-token=; path=/; max-age=0'
    document.cookie = 'sb-refresh-token=; path=/; max-age=0'
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile(data)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  // Inicializar sesión y escuchar cambios
  useEffect(() => {
    const initSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setSessionCookies(currentSession)

      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id)
      }

      setLoading(false)
    }

    initSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setSessionCookies(newSession)

      if (newSession?.user) {
        await fetchProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // RF-001: Registro
  const signUp = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ error?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    // Si tenemos sesión activa (email confirmation desactivado o auto-confirm),
    // nos aseguramos de que el perfil exista en la tabla users
    if (data.user && data.session) {
      try {
        await supabase.from('users').upsert({
          id: data.user.id,
          name,
          theme_preference: 'minimal_dark',
        })
      } catch (profileErr) {
        console.warn('Profile creation fallback notice:', profileErr)
      }
    }

    return {}
  }

  // RF-002: Autenticación
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Supabase devuelve "Invalid login credentials" para credenciales inválidas
      return { error: error.message }
    }

    return {}
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
    setSessionCookies(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
