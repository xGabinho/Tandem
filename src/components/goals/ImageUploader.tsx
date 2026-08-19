'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

interface ImageUploaderProps {
  currentImageUrl?: string | null
  onImageUploaded: (url: string) => void
  onImageRemoved?: () => void
}

const MAX_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function ImageUploader({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImageUrl || null
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    // RN-010: Validación de formato
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Formato no válido. Usa JPG, PNG o WebP.')
      return
    }

    // RN-010: Validación de tamaño (< 5MB)
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`La imagen no debe superar los ${MAX_SIZE_MB}MB.`)
      return
    }

    // Vista previa inmediata en base64 / blob
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)

    // Subir a Supabase Storage (Bucket: goal-images)
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `goals/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('goal-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        // Si el bucket aún no existe o hay error de storage, mantenemos el preview local
        console.warn('Storage upload notice:', uploadError.message)
        onImageUploaded(localUrl)
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage.from('goal-images').getPublicUrl(filePath)
        onImageUploaded(publicUrl)
      }
    } catch (err) {
      console.warn('Error subiendo imagen:', err)
      onImageUploaded(localUrl)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    onImageRemoved?.()
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-secondary pl-1">
        Imagen de la meta (opcional)
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative rounded-[var(--radius-lg)] overflow-hidden border border-border h-40 group bg-bg-surface">
          <img
            src={previewUrl}
            alt="Vista previa de la meta"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Cambiar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              Eliminar
            </Button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-bg-primary/70 flex items-center justify-center">
              <span className="text-xs text-text-primary animate-pulse">
                Subiendo imagen...
              </span>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 rounded-[var(--radius-lg)] border-2 border-dashed border-border hover:border-accent-primary bg-bg-input flex flex-col items-center justify-center gap-2 text-text-muted hover:text-accent-primary transition-all cursor-pointer"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          <span className="text-xs font-medium">
            Haz clic para subir (JPG, PNG, WebP · máx 5MB)
          </span>
        </button>
      )}

      {error && (
        <p className="text-xs text-danger pl-1 animate-slide-down">{error}</p>
      )}
    </div>
  )
}
