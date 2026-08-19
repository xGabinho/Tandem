'use client'

import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

type GoalRow = Database['public']['Tables']['goals']['Row']

interface ConvertGoalDialogProps {
  isOpen: boolean
  onClose: () => void
  onConverted: () => void
  goal: GoalRow
}

export default function ConvertGoalDialog({
  isOpen,
  onClose,
  onConverted,
  goal,
}: ConvertGoalDialogProps) {
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const amount = parseFloat(targetAmount)
    // RN-011: Monto objetivo obligatorio > 0
    if (!amount || amount <= 0) {
      setError('El monto objetivo debe ser mayor a 0.')
      return
    }

    // RN-011: Nueva fecha límite
    if (!targetDate) {
      setError('Debes especificar la fecha límite de ahorro.')
      return
    }

    const date = new Date(targetDate)
    if (date <= new Date()) {
      setError('La fecha objetivo debe ser posterior a la fecha actual.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase
      .from('goals')
      .update({
        type: 'savings',
        target_amount: parseFloat(amount.toFixed(2)),
        target_date: targetDate,
        status: 'in_progress',
      })
      .eq('id', goal.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      onConverted()
      onClose()
    }

    setLoading(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convertir a Meta de Ahorro"
      subtitle={`Pasa "${goal.title}" de cotización a meta financiera activa`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 rounded-[var(--radius-md)] bg-accent-primary-soft text-accent-primary text-xs leading-relaxed">
          💡 Al convertir esta meta, se habilitará el registro de abonos y el
          cálculo de cuotas quincenales/mensuales.
        </div>

        <Input
          label="Monto objetivo acordado"
          type="number"
          placeholder="0.00"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          min="0.01"
          step="0.01"
          icon={<span className="text-sm font-bold">$</span>}
          autoFocus
        />

        <Input
          label="Fecha límite para completarla"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />

        {error && (
          <p className="text-sm text-danger animate-slide-down">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Convertir a Ahorro
          </Button>
        </div>
      </form>
    </Modal>
  )
}
