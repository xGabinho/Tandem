'use client'

import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import {
  validateContributionAmount,
  formatCurrency,
} from '@/lib/utils/calculations'
import { triggerCelebrationConfetti, triggerSubtleConfetti } from '@/lib/utils/confetti'
import { Database } from '@/types/supabase'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

type GoalRow = Database['public']['Tables']['goals']['Row']

interface AddContributionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded: () => void
  goal: GoalRow
  currentTotal: number
}

export default function AddContributionModal({
  isOpen,
  onClose,
  onAdded,
  goal,
  currentTotal,
}: AddContributionModalProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const remaining = (goal.target_amount || 0) - currentTotal

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount)) {
      setError('Ingresa un monto válido.')
      return
    }

    // RN-013: Validar monto
    if (goal.target_amount) {
      const validation = validateContributionAmount(
        numAmount,
        goal.target_amount,
        currentTotal
      )
      if (!validation.valid) {
        setError(validation.message || 'Monto inválido.')
        return
      }
    }

    if (!user) return
    setLoading(true)

    const { error: insertError } = await supabase
      .from('contributions')
      .insert({
        goal_id: goal.id,
        user_id: user.id,
        amount: parseFloat(numAmount.toFixed(2)),
        note: note.trim() || null,
      })

    if (insertError) {
      setError(insertError.message)
    } else {
      setAmount('')
      setNote('')
      const isCompleted = goal.target_amount && (currentTotal + numAmount >= goal.target_amount)
      if (isCompleted) {
        triggerCelebrationConfetti()
      } else {
        triggerSubtleConfetti()
      }
      onAdded()
      onClose()
    }

    setLoading(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Abono"
      subtitle={goal.title}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Balance info */}
        <div className="flex justify-between p-3 rounded-[var(--radius-md)] bg-bg-surface text-sm">
          <span className="text-text-muted">Restante:</span>
          <span className="font-bold text-accent-primary">
            ${formatCurrency(Math.max(remaining, 0))}
          </span>
        </div>

        <Input
          label="Monto del abono"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          step="0.01"
          icon={<span className="text-sm font-bold">$</span>}
          autoFocus
        />

        <Input
          label="Nota (opcional)"
          placeholder="Ej: Pago quincenal, bono, etc."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={255}
        />

        {error && (
          <p className="text-sm text-danger animate-slide-down">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Registrar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
