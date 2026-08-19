import { supabase } from '../supabase/client'
import { Database } from '@/types/supabase'

type WorkspaceRow = Database['public']['Tables']['workspaces']['Row']

/**
 * Crea un nuevo workspace. El trigger en PostgreSQL genera el join_code automáticamente.
 */
export async function createWorkspace(name?: string): Promise<{
  workspace: WorkspaceRow | null
  error?: string
}> {
  const { data, error } = await supabase
    .from('workspaces')
    .insert({ name: name || 'Nuestro Espacio' })
    .select()
    .single()

  if (error) return { workspace: null, error: error.message }
  return { workspace: data }
}

/**
 * Asocia al usuario actual a un workspace recién creado.
 */
export async function assignUserToWorkspace(
  userId: string,
  workspaceId: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('users')
    .update({ workspace_id: workspaceId })
    .eq('id', userId)

  if (error) return { error: error.message }
  return {}
}

/**
 * RF-005: Unirse a un workspace existente usando un join_code.
 * Valida que el código existe y que el usuario no esté ya en otro workspace (RN-005).
 */
export async function joinWorkspace(
  userId: string,
  joinCode: string
): Promise<{ workspace: WorkspaceRow | null; error?: string }> {
  // Normalizar código (uppercase, trim)
  const normalizedCode = joinCode.trim().toUpperCase()

  // Buscar el workspace con ese código
  const { data: workspace, error: findError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('join_code', normalizedCode)
    .single()

  if (findError || !workspace) {
    return {
      workspace: null,
      error: 'Código de invitación no válido o expirado.',
    }
  }

  // Verificar que el usuario no esté ya en otro workspace
  const { data: currentUser } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('id', userId)
    .single()

  if (currentUser?.workspace_id && currentUser.workspace_id !== workspace.id) {
    return {
      workspace: null,
      error: 'Ya estás vinculado a otro espacio. Desvincúlate primero.',
    }
  }

  // Asociar al workspace
  const { error: updateError } = await supabase
    .from('users')
    .update({ workspace_id: workspace.id })
    .eq('id', userId)

  if (updateError) {
    return { workspace: null, error: updateError.message }
  }

  return { workspace }
}

/**
 * RF-006 / RN-006: Disolver el vínculo de pareja.
 * Las metas conjuntas pasan a status 'completed' (archivadas).
 */
export async function dissolvePartnership(
  userId: string,
  workspaceId: string
): Promise<{ error?: string }> {
  // Archivar las metas del workspace
  const { error: archiveError } = await supabase
    .from('goals')
    .update({ status: 'completed' })
    .eq('workspace_id', workspaceId)

  if (archiveError) return { error: archiveError.message }

  // Desvincular al usuario del workspace
  const { error: unlinkError } = await supabase
    .from('users')
    .update({ workspace_id: null })
    .eq('id', userId)

  if (unlinkError) return { error: unlinkError.message }

  return {}
}
