import { supabase } from '../supabase/client'
import {
  IncomeRow,
  IncomeInsert,
  IncomeUpdate,
  ExpenseRow,
  ExpenseInsert,
  ExpenseUpdate,
} from '@/types/supabase'

/**
 * ============================================================================
 * INGRESOS (INCOMES)
 * ============================================================================
 */

export async function getIncomes() {
  const { data, error } = await supabase
    .from('incomes')
    .select('*, users(name, avatar_url)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as (IncomeRow & { users?: { name: string; avatar_url: string | null } | null })[]
}

export async function createIncome(income: IncomeInsert) {
  const { data, error } = await supabase
    .from('incomes')
    .insert(income)
    .select('*, users(name, avatar_url)')
    .single()

  if (error) throw error
  return data as IncomeRow & { users?: { name: string; avatar_url: string | null } | null }
}

export async function updateIncome(id: string, updates: IncomeUpdate) {
  const { data, error } = await supabase
    .from('incomes')
    .update(updates)
    .eq('id', id)
    .select('*, users(name, avatar_url)')
    .single()

  if (error) throw error
  return data as IncomeRow & { users?: { name: string; avatar_url: string | null } | null }
}

export async function deleteIncome(id: string) {
  const { error } = await supabase
    .from('incomes')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * ============================================================================
 * GASTOS MENSUALES / FIJOS (EXPENSES)
 * ============================================================================
 */

export async function getExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, users(name, avatar_url)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as (ExpenseRow & { users?: { name: string; avatar_url: string | null } | null })[]
}

export async function createExpense(expense: ExpenseInsert) {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select('*, users(name, avatar_url)')
    .single()

  if (error) throw error
  return data as ExpenseRow & { users?: { name: string; avatar_url: string | null } | null }
}

export async function updateExpense(id: string, updates: ExpenseUpdate) {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select('*, users(name, avatar_url)')
    .single()

  if (error) throw error
  return data as ExpenseRow & { users?: { name: string; avatar_url: string | null } | null }
}

export async function deleteExpense(id: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
