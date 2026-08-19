import { supabase } from '../supabase/client'
import { Database, InternalDebtRow, InternalDebtInsert, InternalDebtUpdate } from '@/types/supabase'

export interface PopulatedInternalDebt extends InternalDebtRow {
  debtor?: { id: string; name: string } | null
  creditor?: { id: string; name: string } | null
}

/**
 * Obtener todas las deudas internas del workspace
 */
export async function getInternalDebts(): Promise<PopulatedInternalDebt[]> {
  try {
    const { data, error } = await supabase
      .from('internal_debts')
      .select(`
        *,
        debtor:debtor_id (id, name),
        creditor:creditor_id (id, name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Notice loading internal_debts (table may need schema run):', error.message)
      return []
    }
    return (data as unknown as PopulatedInternalDebt[]) || []
  } catch {
    return []
  }
}

/**
 * Registrar una nueva deuda interna
 */
export async function createInternalDebt(debt: InternalDebtInsert): Promise<InternalDebtRow> {
  const { data, error } = await supabase
    .from('internal_debts')
    .insert(debt)
    .select()
    .single()

  if (error) throw error
  return data as InternalDebtRow
}

/**
 * Marcar una deuda como saldada / pagada
 */
export async function settleInternalDebt(id: string): Promise<InternalDebtRow> {
  const { data, error } = await supabase
    .from('internal_debts')
    .update({
      status: 'settled',
      settled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as InternalDebtRow
}

/**
 * Reabrir una deuda saldada
 */
export async function reopenInternalDebt(id: string): Promise<InternalDebtRow> {
  const { data, error } = await supabase
    .from('internal_debts')
    .update({
      status: 'pending',
      settled_at: null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as InternalDebtRow
}

/**
 * Eliminar registro de deuda
 */
export async function deleteInternalDebt(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('internal_debts')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
