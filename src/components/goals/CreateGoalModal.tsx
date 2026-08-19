'use client'

import { useState, FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createGoal } from '@/lib/api/goals'
import { Database } from '@/types/supabase'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ImageUploader from '@/components/goals/ImageUploader'
import { PiggyBank, Search, Sparkles, ArrowLeft } from 'lucide-react'

type GoalInsert = Database['public']['Tables']['goals']['Insert']
type GoalType = 'savings' | 'quoting' | 'experience'

interface CreateGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

const types = [
  { id: 'savings' as const, label: 'Ahorro', icon: <PiggyBank size={24} className="text-emerald-400" />, desc: 'Meta financiera con monto y fecha objetivo' },
  { id: 'quoting' as const, label: 'Cotización', icon: <Search size={24} className="text-blue-400" />, desc: 'Investigación de precios con enlaces de referencia' },
  { id: 'experience' as const, label: 'Experiencia', icon: <Sparkles size={24} className="text-amber-400" />, desc: 'Hitos o actividades sin costo fijo' },
]

export default function CreateGoalModal({
  isOpen,
  onClose,
  onCreated,
}: CreateGoalModalProps) {
  const { profile } = useAuth()
  const [step, setStep] = useState<'type' | 'form'>('type')
  const [selectedType, setSelectedType] = useState<GoalType>('savings')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [referenceLinks, setReferenceLinks] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const resetForm = () => {
    setStep('type')
    setTitle('')
    setTargetAmount('')
    setTargetDate('')
    setPriority('medium')
    setReferenceLinks('')
    setImageUrl(null)
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validate = (): string | null => {
    if (!title.trim()) return 'El título es obligatorio.'

    if (selectedType === 'savings') {
      const amount = parseFloat(targetAmount)
      if (!amount || amount <= 0) return 'El monto objetivo debe ser mayor a 0.' // RN-007
      if (!targetDate) return 'La fecha objetivo es obligatoria.'

      const date = new Date(targetDate)
      if (date <= new Date()) return 'La fecha objetivo debe ser futura.' // RN-007
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

    if (!profile?.workspace_id) {
      setError('No estás en un espacio compartido.')
      return
    }

    setLoading(true)

    // Build the goal object
    const goal: GoalInsert = {
      workspace_id: profile.workspace_id,
      title: title.trim(),
      type: selectedType,
      priority,
      status: 'pending',
      image_url: imageUrl,
    }

    if (selectedType === 'savings') {
      goal.target_amount = parseFloat(parseFloat(targetAmount).toFixed(2))
      goal.target_date = targetDate
    }

    if (selectedType === 'quoting' && referenceLinks.trim()) {
      const links = referenceLinks
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
      goal.reference_links = links as unknown as Database['public']['Tables']['goals']['Insert']['reference_links']
    }

    try {
      await createGoal(goal)
      onCreated()
      handleClose()
    } catch (err) {
      setError('Error al crear la meta. Intenta de nuevo.')
    }

    setLoading(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'type' ? 'Nueva Meta' : `Nueva Meta — ${types.find((t) => t.id === selectedType)?.label}`}
      subtitle={step === 'type' ? '¿Qué tipo de meta quieres crear?' : 'Completa los detalles'}
      size="lg"
    >
      {/* Step 1: Choose Type */}
      {step === 'type' && (
        <div className="space-y-3">
          {types.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedType(type.id)
                setStep('form')
              }}
              className="w-full p-4 rounded-[var(--radius-lg)] bg-bg-surface border border-border hover:border-border-hover hover:bg-bg-card-hover transition-all text-left group"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-bg-card flex items-center justify-center shrink-0 border border-border">
                  {type.icon}
                </div>
                <div>
                  <p className="font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
                    {type.label}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{type.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Form */}
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título de la meta"
            placeholder="Ej: Departamento nuevo, Viaje a Japón..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          {selectedType === 'savings' && (
            <>
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
                min={new Date().toISOString().split('T')[0]}
              />
            </>
          )}

          {selectedType === 'quoting' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary pl-1">
                Enlaces de referencia
              </label>
              <textarea
                placeholder="Pega un enlace por línea..."
                value={referenceLinks}
                onChange={(e) => setReferenceLinks(e.target.value)}
                rows={3}
                className="w-full bg-bg-input border border-border rounded-[var(--radius-lg)] px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary focus:shadow-[0_0_0_3px_var(--accent-primary-soft)] transition-all resize-none"
              />
            </div>
          )}

          <ImageUploader
            currentImageUrl={imageUrl}
            onImageUploaded={(url) => setImageUrl(url)}
            onImageRemoved={() => setImageUrl(null)}
          />

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
                    flex-1 py-2.5 rounded-[var(--radius-md)] text-sm font-medium border transition-all
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

          {error && (
            <p className="text-sm text-danger animate-slide-down">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep('type')}
              className="flex-1"
              icon={<ArrowLeft size={16} />}
            >
              Atrás
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Crear Meta
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
