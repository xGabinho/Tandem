'use client'

import React from 'react'
import { processReferenceLinks } from '@/lib/utils/affiliate'
import { Sparkles, ShoppingBag, ExternalLink, PartyPopper } from 'lucide-react'

interface AffiliatePurchaseCelebrationProps {
  goalTitle: string
  referenceLinks: unknown
}

export default function AffiliatePurchaseCelebration({
  goalTitle,
  referenceLinks,
}: AffiliatePurchaseCelebrationProps) {
  const stores = processReferenceLinks(referenceLinks)

  if (stores.length === 0) return null

  const primaryStore = stores[0]

  return (
    <div className="p-5 md:p-6 rounded-[var(--radius-xl)] bg-gradient-to-r from-emerald-950/40 via-indigo-950/40 to-purple-950/40 border-2 border-emerald-500/30 shadow-[0_0_25px_rgba(52,211,153,0.15)] space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40 animate-bounce">
            <PartyPopper size={24} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Sparkles size={14} />
              <span>¡Objetivo Completado!</span>
            </div>
            <h4 className="text-lg font-bold text-text-primary mt-0.5">
              ¡Momento de hacer realidad "{goalTitle}"!
            </h4>
            <p className="text-xs text-text-muted mt-1 max-w-md">
              Han alcanzado su meta. Ya pueden realizar su compra con el enlace que guardaron.
            </p>
          </div>
        </div>

        {/* Primary CTA */}
        <a
          href={primaryStore.affiliatedUrl}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-[var(--radius-lg)] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/25 shrink-0 self-start sm:self-center"
        >
          <ShoppingBag size={18} />
          <span>Comprar en {primaryStore.name}</span>
          <ExternalLink size={15} />
        </a>
      </div>
    </div>
  )
}
