'use client'

import React, { useState, FormEvent, useEffect } from 'react'
import { updateExpense, deleteExpense } from '@/lib/api/finances'
import { getWorkspaceUsers } from '@/lib/api/workspaces'
import { ExpenseRow, UserRow } from '@/types/supabase'
import { expenseCategories } from './CreateExpenseModal'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Home, Sparkles } from 'lucide-react'

interface EditExpenseModalProps {
  expense: ExpenseRow | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

const frequencies = [
  { id: 'monthly', label: 'Mensual' },
  { id: 'biweekly', label: 'Quincenal' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'yearly', label: 'Anual' },
  { id: 'one_time', label: 'Puntual' },
] as const

export default function EditExpenseModal({
  expense,
  isOpen,
  onClose,
  onUpdated,
}: EditExpenseModalProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [workspaceUsers, setWorkspaceUsers] = useState<UserRow[]>([])

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<typeof expenseCategories[number]['id']>('housing')
  const [isNeed, setIsNeed] = useState<boolean>(true)
  const [frequency, setFrequency] = useState<typeof frequencies[number]['id']>('monthly')
  const [dueDay, setDueDay] = useState('')
  const [assignedUserId, setAssignedUserId] = useState<string>('')

  useEffect(() => {
    if (expense && isOpen) {
      setTitle(expense.title)
      setAmount(expense.amount.toString())
      setCategory((expense.category as typeof expenseCategories[number]['id']) || 'housing')
      setIsNeed(expense.is_fixed !== false) // default true unless explicitly false
      setFrequency(expense.frequency)
      setDueDay(expense.due_day ? expense.due_day.toString() : '')
      setAssignedUserId(expense.user_id || '')
      setError('')

      if (expense.workspace_id) {
        getWorkspaceUsers(expense.workspace_id)
          .then((users) => setWorkspaceUsers(users))
          .catch(() => {})
      }
    }
  }, [expense, isOpen])

  if (!expense) return null

  const handleCategorySelect = (catId: typeof expenseCategories[number]['id']) => {
    setCategory(catId)
    if (catId === 'subscriptions' || catId === 'other') {
      setIsNeed(false)
    } else {
      setIsNeed(true)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('El nombre o concepto del gasto es obligatorio.')
      return
    }

    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      setError('El monto debe ser mayor a 0.')
      return
    }

    let parsedDueDay: number | null = null
    if (dueDay) {
      const day = parseInt(dueDay, 10)
      if (day < 1 || day > 31) {
        setError('El día de pago debe ser entre 1 y 31.')
        return
      }
      parsedDueDay = day
    }

    setLoading(true)

    try {
      await updateExpense(expense.id, {
        title: title.trim(),
        amount: parseFloat(numAmount.toFixed(2)),
        category,
        frequency,
        due_day: parsedDueDay,
        is_fixed: isNeed,
        user_id: assignedUserId || null,
      })
      onUpdated()
      onClose()
    } catch {
      setError('Error al actualizar el gasto.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return

    setDeleting(true)
    try {
      await deleteExpense(expense.id)
      onUpdated()
      onClose()
    } catch {
      setError('Error al eliminar el gasto.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Gasto"
      subtitle="Modifica los detalles y la clasificación del gasto"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Concepto del gasto"
          placeholder="Ej: Renta, Pasajes estudio, Supermercado, Netflix..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Monto"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            icon={<span className="text-sm font-bold">$</span>}
          />

          <Input
            label="Día de pago (1-31)"
            type="number"
            placeholder="Ej: 5 (Opcional)"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            min="1"
            max="31"
          />
        </div>

        {/* Tipo de Presupuesto (Regla 50/30/20) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary pl-1">
            Tipo de Gasto (Regla 50 / 30 / 20)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsNeed(true)}
              className={`p-3 rounded-[var(--radius-md)] text-xs font-medium border transition-all text-left flex items-center gap-2.5 ${
                isNeed
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-text-primary font-semibold shadow-sm'
                  : 'bg-bg-surface border-border text-text-muted hover:border-border-hover hover:text-text-primary'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Home size={14} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-text-primary">Necesidad Básica</p>
                <p className="text-[11px] text-text-muted">Esencial (Renta, transporte, despensa)</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsNeed(false)}
              className={`p-3 rounded-[var(--radius-md)] text-xs font-medium border transition-all text-left flex items-center gap-2.5 ${
                !isNeed
                  ? 'bg-pink-500/20 border-pink-500/50 text-text-primary font-semibold shadow-sm'
                  : 'bg-bg-surface border-border text-text-muted hover:border-border-hover hover:text-text-primary'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                <Sparkles size={14} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-text-primary">Estilo de Vida / Deseo</p>
                <p className="text-[11px] text-text-muted">Opcional (Streaming, salidas, ocio)</p>
              </div>
            </button>
          </div>
        </div>

        {/* Frecuencia */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary pl-1">
            Frecuencia
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {frequencies.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFrequency(f.id)}
                className={`py-2 px-2 rounded-[var(--radius-md)] text-xs font-medium border transition-all text-center ${
                  frequency === f.id
                    ? 'bg-danger-soft border-danger/40 text-danger font-semibold'
                    : 'bg-bg-surface border-border text-text-muted hover:border-border-hover'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categoría */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary pl-1">
            Categoría
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
            {expenseCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`flex items-center gap-2 p-2 rounded-[var(--radius-md)] text-xs font-medium border transition-all text-left ${
                  category === cat.id
                    ? 'bg-danger-soft border-danger/40 text-danger font-semibold'
                    : 'bg-bg-surface border-border text-text-muted hover:border-border-hover hover:text-text-primary'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-bg-card flex items-center justify-center shrink-0">
                  {cat.icon}
                </div>
                <span className="truncate">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quién es responsable */}
        {workspaceUsers.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary pl-1">
              ¿Quién cubre o administra este gasto?
            </label>
            <select
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              className="w-full bg-bg-input border border-border rounded-[var(--radius-lg)] px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent-primary transition-all cursor-pointer"
            >
              {workspaceUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="text-sm text-danger animate-slide-down">{error}</p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-2 text-sm text-danger hover:bg-danger-soft rounded-[var(--radius-md)] transition-colors"
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
