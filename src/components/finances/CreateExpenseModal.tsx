'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createExpense } from '@/lib/api/finances'
import { getWorkspaceUsers } from '@/lib/api/workspaces'
import { ExpenseInsert, UserRow } from '@/types/supabase'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface CreateExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

export const expenseCategories = [
  { id: 'housing', label: 'Vivienda / Renta / Hipoteca', emoji: '🏠' },
  { id: 'utilities', label: 'Servicios (Luz, Agua, Internet)', emoji: '⚡' },
  { id: 'food', label: 'Alimentación / Supermercado', emoji: '🛒' },
  { id: 'transport', label: 'Transporte / Gasolina', emoji: '🚗' },
  { id: 'subscriptions', label: 'Suscripciones / Streaming', emoji: '📺' },
  { id: 'health', label: 'Salud y Seguros', emoji: '🩺' },
  { id: 'debt', label: 'Deudas y Tarjetas', emoji: '💳' },
  { id: 'education', label: 'Educación', emoji: '📚' },
  { id: 'other', label: 'Otros Gastos', emoji: '📦' },
] as const

const frequencies = [
  { id: 'monthly', label: 'Mensual' },
  { id: 'biweekly', label: 'Quincenal' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'yearly', label: 'Anual' },
  { id: 'one_time', label: 'Puntual' },
] as const

export default function CreateExpenseModal({
  isOpen,
  onClose,
  onCreated,
}: CreateExpenseModalProps) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [workspaceUsers, setWorkspaceUsers] = useState<UserRow[]>([])

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<typeof expenseCategories[number]['id']>('housing')
  const [frequency, setFrequency] = useState<typeof frequencies[number]['id']>('monthly')
  const [dueDay, setDueDay] = useState('')
  const [assignedUserId, setAssignedUserId] = useState<string>('')

  useEffect(() => {
    if (isOpen && profile?.workspace_id) {
      getWorkspaceUsers(profile.workspace_id)
        .then((users) => {
          setWorkspaceUsers(users)
          if (!assignedUserId && profile?.id) {
            setAssignedUserId(profile.id)
          }
        })
        .catch(() => {})
    }
  }, [isOpen, profile?.workspace_id, profile?.id])

  const resetForm = () => {
    setTitle('')
    setAmount('')
    setCategory('housing')
    setFrequency('monthly')
    setDueDay('')
    setAssignedUserId(profile?.id || '')
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
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

    if (!profile?.workspace_id) {
      setError('No estás en un espacio compartido.')
      return
    }

    setLoading(true)

    const newExpense: ExpenseInsert = {
      workspace_id: profile.workspace_id,
      user_id: assignedUserId || profile.id,
      title: title.trim(),
      amount: parseFloat(numAmount.toFixed(2)),
      category,
      frequency,
      due_day: parsedDueDay,
      is_fixed: true,
    }

    try {
      await createExpense(newExpense)
      onCreated()
      handleClose()
    } catch {
      setError('Error al registrar el gasto. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nuevo Gasto Mensual"
      subtitle="Registra un gasto fijo o recurrente para restarlo de los ingresos"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Concepto del gasto"
          placeholder="Ej: Renta departamento, Despensa mensual, WiFi..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
            {expenseCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 p-2 rounded-[var(--radius-md)] text-xs font-medium border transition-all text-left ${
                  category === cat.id
                    ? 'bg-danger-soft border-danger/40 text-danger font-semibold'
                    : 'bg-bg-surface border-border text-text-muted hover:border-border-hover hover:text-text-primary'
                }`}
              >
                <span className="text-base">{cat.emoji}</span>
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
                  {u.name} {u.id === profile?.id ? '(Tú)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="text-sm text-danger animate-slide-down">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Guardar Gasto
          </Button>
        </div>
      </form>
    </Modal>
  )
}
