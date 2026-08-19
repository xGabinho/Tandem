import { supabase } from '../supabase/client'
import { Database } from '@/types/supabase'

type WorkspaceRow = Database['public']['Tables']['workspaces']['Row']
type UserRow = Database['public']['Tables']['users']['Row']
type UserUpdate = Database['public']['Tables']['users']['Update']

/**
 * Obtener la información del workspace actual usando el código de invitación o el ID
 */
export async function getWorkspaceByJoinCode(joinCode: string) {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('join_code', joinCode)
    .single()

  if (error) throw error
  return data as WorkspaceRow
}

/**
 * Obtener los usuarios que pertenecen a un workspace (la pareja/grupo)
 */
export async function getWorkspaceUsers(workspaceId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('workspace_id', workspaceId)

  if (error) throw error
  return data as UserRow[]
}

/**
 * Actualizar las preferencias del usuario (ej. theme_preference)
 */
export async function updateUserPreferences(userId: string, updates: UserUpdate) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data as UserRow
}
