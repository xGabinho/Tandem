import { supabase } from '../supabase/client'
import { Database } from '@/types/supabase'

type ContributionRow = Database['public']['Tables']['contributions']['Row']
type ContributionInsert = Database['public']['Tables']['contributions']['Insert']

/**
 * Obtener todos los abonos relacionados a una meta en específico.
 */
export async function getContributionsByGoal(goalId: string) {
  const { data, error } = await supabase
    .from('contributions')
    .select('*, users(name, avatar_url)')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Obtener todos los abonos del workspace (para calcular progreso global).
 * RLS "Ver abonos del espacio" ya filtra automáticamente usando la subconsulta del workspace_id.
 */
export async function getAllWorkspaceContributions() {
  const { data, error } = await supabase
    .from('contributions')
    .select('*')

  if (error) throw error
  return data as ContributionRow[]
}

/**
 * Registrar un nuevo abono
 */
export async function createContribution(contribution: ContributionInsert) {
  const { data, error } = await supabase
    .from('contributions')
    .insert(contribution)
    .select()
    .single()

  if (error) throw error
  return data as ContributionRow
}
