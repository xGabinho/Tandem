'use client'

import React, { useState } from 'react'
import {
  processReferenceLinks,
  AFFILIATE_DISCLOSURE,
  AffiliateStoreInfo,
} from '@/lib/utils/affiliate'
import {
  ExternalLink,
  ShoppingBag,
  Package,
  Hotel,
  Home,
  Laptop,
  Check,
  Copy,
  Sparkles,
  HeartHandshake,
  Plus,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface AffiliateLinksListProps {
  links: unknown
  goalTitle?: string
  isCompleted?: boolean
  onAddLink?: (newLink: string) => Promise<void> | void
}

const renderStoreIcon = (iconName: string, size = 18) => {
  switch (iconName) {
    case 'ShoppingBag':
      return <ShoppingBag size={size} />
    case 'Package':
      return <Package size={size} />
    case 'Hotel':
      return <Hotel size={size} />
    case 'Home':
      return <Home size={size} />
    case 'Laptop':
      return <Laptop size={size} />
    default:
      return <ExternalLink size={size} />
  }
}

export default function AffiliateLinksList({
  links,
  goalTitle,
  isCompleted = false,
  onAddLink,
}: AffiliateLinksListProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [newLinkInput, setNewLinkInput] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const storeList: AffiliateStoreInfo[] = processReferenceLinks(links)

  const handleCopy = (url: string, index: number) => {
    navigator.clipboard.writeText(url)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLinkInput.trim() || !onAddLink) return

    setIsAdding(true)
    try {
      await onAddLink(newLinkInput.trim())
      setNewLinkInput('')
      setShowAddForm(false)
    } finally {
      setIsAdding(false)
    }
  }

  if (storeList.length === 0 && !onAddLink) {
    return null
  }

  return (
    <div className="glass-card p-5 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent-primary-soft flex items-center justify-center text-accent-primary">
            <ShoppingBag size={16} />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-base">
              Enlaces y Tiendas Oficiales
            </h3>
            <p className="text-xs text-text-muted">
              {storeList.length === 1
                ? '1 tienda guardada para esta meta'
                : `${storeList.length} tiendas guardadas para comparar`}
            </p>
          </div>
        </div>

        {onAddLink && !showAddForm && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowAddForm(true)}
            icon={<Plus size={14} />}
          >
            Añadir enlace
          </Button>
        )}
      </div>

      {/* Form to add link directly */}
      {showAddForm && onAddLink && (
        <form
          onSubmit={handleAddNew}
          className="p-3.5 rounded-[var(--radius-md)] bg-bg-surface border border-border space-y-2.5 animate-fadeIn"
        >
          <label className="text-xs font-semibold text-text-secondary block">
            Pega el enlace de la tienda (Amazon, MercadoLibre, AliExpress, etc.)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://..."
              value={newLinkInput}
              onChange={(e) => setNewLinkInput(e.target.value)}
              className="flex-1 bg-bg-input border border-border rounded-[var(--radius-md)] px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary"
              autoFocus
              required
            />
            <Button size="sm" type="submit" loading={isAdding}>
              Guardar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setNewLinkInput('')
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {/* Store Cards */}
      {storeList.length > 0 ? (
        <div className="space-y-2.5">
          {storeList.map((store, index) => {
            const isCopied = copiedIndex === index

            return (
              <div
                key={index}
                className="p-3.5 md:p-4 rounded-[var(--radius-lg)] bg-bg-surface border border-border hover:border-border-hover transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: store.bgColor,
                      borderColor: store.borderColor,
                      color: store.textColor,
                    }}
                  >
                    {renderStoreIcon(store.iconName, 20)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-text-primary truncate">
                        {store.name}
                      </span>
                      {store.isAffiliated && (
                        <Badge variant="accent" size="sm">
                          <span className="text-[10px] font-semibold">
                            {AFFILIATE_DISCLOSURE.complianceBadge}
                          </span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate mt-0.5 max-w-xs md:max-w-md">
                      {store.domain}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleCopy(store.affiliatedUrl, index)}
                    title="Copiar enlace"
                    className="p-2 rounded-[var(--radius-md)] bg-bg-card hover:bg-bg-card-hover text-text-muted hover:text-text-primary transition-colors border border-border"
                  >
                    {isCopied ? (
                      <Check size={15} className="text-success" />
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>

                  <a
                    href={store.affiliatedUrl}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-md)] text-xs font-bold transition-all shadow-sm ${
                      isCompleted
                        ? 'bg-success text-white hover:brightness-110'
                        : 'bg-accent-primary text-white hover:bg-accent-primary-hover'
                    }`}
                  >
                    <span>{isCompleted ? '¡Comprar ahora!' : 'Ver en tienda'}</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-text-muted py-2 text-center">
          No hay enlaces guardados aún. Pega el link de la tienda para consultar precios y disponibilidad.
        </p>
      )}

      {/* Affiliate Transparency Disclosure Box (FTC & Amazon Compliance) */}
      <div className="p-3 rounded-[var(--radius-md)] bg-bg-card border border-border/70 flex items-start gap-2.5">
        <HeartHandshake
          size={16}
          className="text-accent-primary shrink-0 mt-0.5"
        />
        <div className="space-y-1">
          <p className="text-[11px] text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">
              Transparencia Tándem:
            </span>{' '}
            {AFFILIATE_DISCLOSURE.full}
          </p>
        </div>
      </div>
    </div>
  )
}
