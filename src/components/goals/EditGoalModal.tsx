'use client'

import { useState, useEffect, FormEvent } from 'react'
import { updateGoal } from '@/lib/api/goals'
import { Database, GoalRow } from '@/types/supabase'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ImageUploader from '@/components/goals/ImageUploader'
import { Sparkles, Save, Trash2 } from 'lucide-react'

type GoalUpdate = Database['public']['Tables']['goals']['Update']

interface EditGoalModalProps {
  goal: GoalRow
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

export default function EditGoalModal({
  goal,
  isOpen,
  onClose,
  onUpdated,
}: EditGoalModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState(goal.title)
  const [targetAmount, setTargetAmount] = useState(
    goal.target_amount ? goal.target_amount.toString() : ''
  )
  const [targetDate, setTargetDate] = useState(goal.target_date || '')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(goal.priority)
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>(
    goal.status || 'pending'
  )
  const [imageUrl, setImageUrl] = useState<string | null>(goal.image_url)
  const [referenceLinks, setReferenceLinks] = useState('')

  // Sync state when modal opens or goal changes
  useEffect(() => {
    if (isOpen) {
      setTitle(goal.title)
      setTargetAmount(goal.target_amount ? goal.target_amount.toString() : '')
      setTargetDate(goal.target_date || '')
      setPriority(goal.priority)
      setStatus(goal.status || 'pending')
      setImageUrl(goal.image_url)

      if (goal.reference_links) {
        if (Array.isArray(goal.reference_links)) {
          setReferenceLinks((goal.reference_links as string[]).join('\n'))
        } else if (typeof goal.reference_links === 'string') {
          setReferenceLinks(goal.reference_links)
        }
      } else {
        setReferenceLinks('')
      }
      setError('')
    }
  }, [isOpen, goal])

  const validate = (): string | null => {
    if (!title.trim()) return 'El título es obligatorio.'

    if (goal.type === 'savings') {
      const amount = parseFloat(targetAmount)
      if (!amount || amount <= 0) return 'El monto objetivo debe ser mayor a 0.'
    }

    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    const updates: GoalUpdate = {
      title: title.trim(),
      priority,
      status,
      image_url: imageUrl,
    }

    if (targetAmount && parseFloat(targetAmount) > 0) {
      updates.target_amount = parseFloat(parseFloat(targetAmount).toFixed(2))
    } else {
      updates.target_amount = null
    }

    if (targetDate) {
      updates.target_date = targetDate
    } else {
      updates.target_date = null
    }

    if (referenceLinks.trim()) {
      const links = referenceLinks
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
      updates.reference_links = links as unknown as Database['public']['Tables']['goals']['Update']['reference_links']
    } else {
      updates.reference_links = null
    }

    try {
      await updateGoal(goal.id, updates)
      onUpdated()
      onClose()
    } catch {
      setError('Error al actualizar la meta. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Meta"
      subtitle={`Modifica los detalles de "${goal.title}"`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título de la meta"
          placeholder="Ej: Departamento nuevo, Viaje a Japón..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        {goal.type === 'savings' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Monto objetivo"
              type="number"
              placeholder="0.00"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              min="0.01"
              step="0.01"
              icon={<span className="text-sm font-bold">$</span>}
            />
            <Input
              label="Fecha objetivo"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
        ) : (
          <Input
            label="Monto o precio estimado (opcional)"
            type="number"
            placeholder="0.00"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            min="0.01"
            step="0.01"
            icon={<span className="text-sm font-bold">$</span>}
          />
        )}

        {/* Priority selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary pl-1">
            Prioridad
          </label>
          <div className="flex gap-2">
            {(['high', 'medium', 'low'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`
                  flex-1 py-2.5 rounded-[var(--radius-md)] text-xs font-semibold border transition-all
                  ${
                    priority === p
                      ? p === 'high'
                        ? 'bg-danger-soft border-danger/30 text-danger'
                        : p === 'medium'
                          ? 'bg-warning-soft border-warning/30 text-warning'
                          : 'bg-success-soft border-success/30 text-success'
                      : 'bg-bg-surface border-border text-text-muted hover:border-border-hover'
                  }
                `}
              >
                {p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}
              </button>
            ))}
          </div>
        </div>

        {/* Status selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary pl-1">
            Estado
          </label>
          <div className="flex gap-2">
            {[
              { id: 'pending' as const, label: 'Pendiente' },
              { id: 'in_progress' as const, label: 'En Progreso' },
              { id: 'completed' as const, label: 'Completada' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatus(s.id)}
                className={`
                  flex-1 py-2 rounded-[var(--radius-md)] text-xs font-semibold border transition-all
                  ${
                    status === s.id
                      ? 'bg-accent-primary-soft border-accent-primary/40 text-accent-primary'
                      : 'bg-bg-surface border-border text-text-muted hover:border-border-hover'
                  }
                `}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Enlaces de referencia */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary pl-1">
            Enlaces de referencia / tiendas (uno por línea)
          </label>
          <textarea
            placeholder="https://amazon.com/...&#10;https://mercadolibre.com/..."
            value={referenceLinks}
            onChange={(e) => setReferenceLinks(e.target.value)}
            rows={2}
            className="w-full bg-bg-input border border-border rounded-[var(--radius-lg)] px-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary focus:shadow-[0_0_0_3px_var(--accent-primary-soft)] transition-all resize-none"
          />
        </div>

        {/* Imagen */}
        <ImageUploader
          currentImageUrl={imageUrl}
          onImageUploaded={(url) => setImageUrl(url)}
          onImageRemoved={() => setImageUrl(null)}
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
          <Button
            type="submit"
            loading={loading}
            className="flex-1"
            icon={<Save size={16} />}
          >
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  )
}
