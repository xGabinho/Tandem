import { supabase } from '../supabase/client'
import { Database } from '@/types/supabase'

type GoalRow = Database['public']['Tables']['goals']['Row']
type GoalInsert = Database['public']['Tables']['goals']['Insert']
type GoalUpdate = Database['public']['Tables']['goals']['Update']

/**
 * Obtener todas las metas del workspace actual.
 * (La política RLS "Ver metas del espacio" asegura que solo lleguen las correspondientes).
 */
export async function getGoals() {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as GoalRow[]
}

/**
 * Obtener una meta específica por ID
 */
export async function getGoalById(id: string) {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as GoalRow
}

/**
 * Crear una nueva meta
 */
export async function createGoal(goal: GoalInsert) {
  const { data, error } = await supabase
    .from('goals')
    .insert(goal)
    .select()
    .single()

  if (error) throw error
  return data as GoalRow
}

/**
 * Actualizar una meta existente
 */
export async function updateGoal(id: string, updates: GoalUpdate) {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as GoalRow
}

/**
 * Eliminar una meta
 */
export async function deleteGoal(id: string) {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
