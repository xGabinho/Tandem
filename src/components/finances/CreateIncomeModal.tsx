'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createIncome } from '@/lib/api/finances'
import { getWorkspaceUsers } from '@/lib/api/workspaces'
import { IncomeInsert, UserRow } from '@/types/supabase'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import {
  Briefcase,
  Laptop,
  TrendingUp,
  Store,
  Sparkles,
  Gift,
} from 'lucide-react'

interface CreateIncomeModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

export const incomeCategories = [
  { id: 'salary', label: 'Salario / Nómina', icon: <Briefcase size={16} className="text-emerald-400" /> },
  { id: 'freelance', label: 'Freelance / Honorarios', icon: <Laptop size={16} className="text-blue-400" /> },
  { id: 'investments', label: 'Inversiones / Rendimientos', icon: <TrendingUp size={16} className="text-purple-400" /> },
  { id: 'business', label: 'Negocio / Emprendimiento', icon: <Store size={16} className="text-amber-400" /> },
  { id: 'bonus', label: 'Bonos y Aguinaldos', icon: <Gift size={16} className="text-pink-400" /> },
  { id: 'other', label: 'Otros Ingresos', icon: <Sparkles size={16} className="text-emerald-300" /> },
] as const

const categories = incomeCategories

const frequencies = [
  { id: 'monthly', label: 'Mensual' },
  { id: 'biweekly', label: 'Quincenal' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'yearly', label: 'Anual' },
  { id: 'one_time', label: 'Puntual' },
] as const

export default function CreateIncomeModal({
  isOpen,
  onClose,
  onCreated,
}: CreateIncomeModalProps) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [workspaceUsers, setWorkspaceUsers] = useState<UserRow[]>([])

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<typeof categories[number]['id']>('salary')
  const [frequency, setFrequency] = useState<typeof frequencies[number]['id']>('monthly')
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
    setCategory('salary')
    setFrequency('monthly')
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
      setError('El nombre o fuente del ingreso es obligatorio.')
      return
    }

    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      setError('El monto debe ser mayor a 0.')
      return
    }

    if (!profile?.workspace_id) {
      setError('No estás en un espacio compartido.')
      return
    }

    setLoading(true)

    const newIncome: IncomeInsert = {
      workspace_id: profile.workspace_id,
      user_id: assignedUserId || profile.id,
      title: title.trim(),
      amount: parseFloat(numAmount.toFixed(2)),
      category,
      frequency,
    }

    try {
      await createIncome(newIncome)
      onCreated()
      handleClose()
    } catch {
      setError('Error al registrar el ingreso. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nuevo Ingreso"
      subtitle="Registra un ingreso mensual o recurrente de tu hogar"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Concepto / Fuente del ingreso"
          placeholder="Ej: Salario Gabriel, Freelance diseño..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
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
                className={`flex items-center gap-2.5 p-2.5 rounded-[var(--radius-md)] text-xs font-medium border transition-all text-left ${
                  category === cat.id
                    ? 'bg-accent-primary-soft border-accent-primary/40 text-accent-primary font-semibold'
                    : 'bg-bg-surface border-border text-text-muted hover:border-border-hover hover:text-text-primary'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-bg-card flex items-center justify-center shrink-0">
                  {cat.icon}
                </div>
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
            Guardar Ingreso
          </Button>
        </div>
      </form>
    </Modal>
  )
}
