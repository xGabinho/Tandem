import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

/**
 * Crea un cliente de Supabase para uso en Server Components.
 * Lee el token de sesión desde las cookies del request.
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'placeholder-anon-key'

  // Leer los tokens de sesión de Supabase desde las cookies
  const accessToken = cookieStore.get('sb-access-token')?.value
  const refreshToken = cookieStore.get('sb-refresh-token')?.value

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    },
  })

  // Si tenemos ambos tokens, restaurar la sesión
  if (accessToken && refreshToken) {
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }

  return client
}
