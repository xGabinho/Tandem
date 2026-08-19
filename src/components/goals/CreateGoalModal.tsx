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

  // Smart link scraping fields
  const [quickLinkInput, setQuickLinkInput] = useState('')
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false)
  const [fetchSuccessMessage, setFetchSuccessMessage] = useState('')

  const resetForm = () => {
    setStep('type')
    setTitle('')
    setTargetAmount('')
    setTargetDate('')
    setPriority('medium')
    setReferenceLinks('')
    setImageUrl(null)
    setQuickLinkInput('')
    setFetchSuccessMessage('')
    setError('')
  }

  const handleFetchMetadata = async (customUrl?: string) => {
    const urlToFetch = (customUrl || quickLinkInput).trim()
    if (!urlToFetch) return
    setIsFetchingMetadata(true)
    setFetchSuccessMessage('')
    setError('')

    try {
      const res = await fetch('/api/preview-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch }),
      })
      const data = await res.json()

      if (data.success && data.metadata) {
        const meta = data.metadata
        if (meta.title) {
          setTitle(meta.title.slice(0, 150))
        }
        if (meta.image) {
          setImageUrl(meta.image)
        }
        if (meta.price) {
          setTargetAmount(meta.price.toString())
        }

        // Add to referenceLinks
        const newLink = meta.affiliatedUrl || urlToFetch
        setReferenceLinks((prev) => (prev ? `${prev}\n${newLink}` : newLink))
        setQuickLinkInput('')
        setFetchSuccessMessage(
          `¡Enlace de ${meta.platformName || 'tienda'} procesado con éxito! Se autocompletaron los detalles ✨`
        )
        // Pasar directamente al formulario
        setStep('form')
      }
    } catch {
      setError('No se pudieron extraer datos del enlace. Puedes completar los campos manualmente.')
      setStep('form')
    } finally {
      setIsFetchingMetadata(false)
    }
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

    if (targetAmount && parseFloat(targetAmount) > 0) {
      goal.target_amount = parseFloat(parseFloat(targetAmount).toFixed(2))
    }
    if (targetDate) {
      goal.target_date = targetDate
    }

    if (referenceLinks.trim()) {
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
      subtitle={step === 'type' ? '¿Cómo deseas comenzar tu meta?' : 'Completa los detalles'}
      size="lg"
    >
      {/* Step 1: Choose Type or Paste Link */}
      {step === 'type' && (
        <div className="space-y-4">
          {/* Quick Import from Store Link */}
          <div className="p-4 rounded-[var(--radius-lg)] bg-gradient-to-r from-accent-primary-soft/40 to-accent-secondary/10 border border-accent-primary/30 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="text-xs font-bold text-accent-primary flex items-center gap-1.5">
                <Sparkles size={15} />
                <span>¿Tienes el enlace de una tienda? (Importación rápida)</span>
              </label>
              <span className="text-[10px] text-text-muted">Amazon, MercadoLibre, IKEA...</span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Pega el link de la tienda aquí para autocompletar..."
                value={quickLinkInput}
                onChange={(e) => setQuickLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleFetchMetadata()
                  }
                }}
                className="flex-1 bg-bg-surface border border-border rounded-[var(--radius-md)] px-3 py-2.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary"
              />
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => handleFetchMetadata()}
                loading={isFetchingMetadata}
                disabled={!quickLinkInput.trim()}
              >
                Importar →
              </Button>
            </div>
            <p className="text-[11px] text-text-muted">
              Extraeremos automáticamente la foto oficial, el nombre y los datos del producto.
            </p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-3 text-xs text-text-muted font-medium">o elige una categoría</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <div className="space-y-2.5">
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
        </div>
      )}

      {/* Step 2: Form */}
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Smart Link Scraper & Incentive */}
          <div className="p-3.5 rounded-[var(--radius-lg)] bg-accent-primary-soft/30 border border-accent-primary/20 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="text-xs font-bold text-accent-primary flex items-center gap-1.5">
                <Sparkles size={14} />
                <span>¿Tienes el link de la tienda? (Opcional)</span>
              </label>
              <span className="text-[10px] text-text-muted">Amazon, MercadoLibre, Booking...</span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Pega el enlace del producto para autocompletar..."
                value={quickLinkInput}
                onChange={(e) => setQuickLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleFetchMetadata()
                  }
                }}
                className="flex-1 bg-bg-surface border border-border rounded-[var(--radius-md)] px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => handleFetchMetadata()}
                loading={isFetchingMetadata}
                disabled={!quickLinkInput.trim()}
              >
                Autocompletar
              </Button>
            </div>
            {fetchSuccessMessage && (
              <p className="text-xs text-success flex items-center gap-1">
                <span>✓</span> {fetchSuccessMessage}
              </p>
            )}
          </div>

          <Input
            label="Título de la meta"
            placeholder="Ej: Departamento nuevo, Viaje a Japón..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          {selectedType === 'savings' ? (
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

          {/* Enlaces de referencia */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary pl-1">
              Enlaces de referencia / tiendas {selectedType !== 'quoting' && '(opcional)'}
            </label>
            <textarea
              placeholder="Pega un enlace por línea (Amazon, MercadoLibre, etc.)..."
              value={referenceLinks}
              onChange={(e) => setReferenceLinks(e.target.value)}
              rows={2}
              className="w-full bg-bg-input border border-border rounded-[var(--radius-lg)] px-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary focus:shadow-[0_0_0_3px_var(--accent-primary-soft)] transition-all resize-none"
            />
          </div>

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
