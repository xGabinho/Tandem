'use client'

import { useState, FormEvent, useEffect } from 'react'
import { updateIncome, deleteIncome } from '@/lib/api/finances'
import { getWorkspaceUsers } from '@/lib/api/workspaces'
import { IncomeRow, UserRow } from '@/types/supabase'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface EditIncomeModalProps {
  income: IncomeRow | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

const categories = [
  { id: 'salary', label: 'Salario / Nómina', emoji: '💼' },
  { id: 'freelance', label: 'Freelance / Honorarios', emoji: '💻' },
  { id: 'investments', label: 'Inversiones / Rendimientos', emoji: '📈' },
  { id: 'business', label: 'Negocio / Emprendimiento', emoji: '🏪' },
  { id: 'other', label: 'Otros Ingresos', emoji: '✨' },
] as const

const frequencies = [
  { id: 'monthly', label: 'Mensual' },
  { id: 'biweekly', label: 'Quincenal' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'yearly', label: 'Anual' },
  { id: 'one_time', label: 'Puntual' },
] as const

export default function EditIncomeModal({
  income,
  isOpen,
  onClose,
  onUpdated,
}: EditIncomeModalProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [workspaceUsers, setWorkspaceUsers] = useState<UserRow[]>([])

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<typeof categories[number]['id']>('salary')
  const [frequency, setFrequency] = useState<typeof frequencies[number]['id']>('monthly')
  const [assignedUserId, setAssignedUserId] = useState<string>('')

  useEffect(() => {
    if (income && isOpen) {
      setTitle(income.title)
      setAmount(income.amount.toString())
      setCategory(income.category)
      setFrequency(income.frequency)
      setAssignedUserId(income.user_id || '')
      setError('')

      if (income.workspace_id) {
        getWorkspaceUsers(income.workspace_id)
          .then((users) => setWorkspaceUsers(users))
          .catch(() => {})
      }
    }
  }, [income, isOpen])

  if (!income) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('El nombre o fuente del ingreso es obligatorio.')
      return
    }

    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      setError('El monto debe ser mayor a 0.')
      return
    }

    setLoading(true)

    try {
      await updateIncome(income.id, {
        title: title.trim(),
        amount: parseFloat(numAmount.toFixed(2)),
        category,
        frequency,
        user_id: assignedUserId || null,
      })
      onUpdated()
      onClose()
    } catch {
      setError('Error al actualizar el ingreso.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este ingreso?')) return

    setDeleting(true)
    try {
      await deleteIncome(income.id)
      onUpdated()
      onClose()
    } catch {
      setError('Error al eliminar el ingreso.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Ingreso"
      subtitle="Modifica o elimina este registro de ingreso"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Concepto / Fuente del ingreso"
          placeholder="Ej: Salario Gabriel, Freelance diseño..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

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
                    ? 'bg-success-soft border-success/40 text-success font-semibold'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 p-2.5 rounded-[var(--radius-md)] text-xs font-medium border transition-all text-left ${
                  category === cat.id
                    ? 'bg-accent-primary-soft border-accent-primary/40 text-accent-primary font-semibold'
                    : 'bg-bg-surface border-border text-text-muted hover:border-border-hover hover:text-text-primary'
                }`}
              >
                <span className="text-base">{cat.emoji}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quién lo aporta */}
        {workspaceUsers.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary pl-1">
              ¿Quién aporta este ingreso?
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
