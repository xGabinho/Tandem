'use client'

import React, { useState, useEffect } from 'react'
import { triggerCelebrationConfetti } from '@/lib/utils/confetti'
import Button from '@/components/ui/Button'
import {
  Sparkles,
  Target,
  Wallet,
  Scale,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Heart,
  ShoppingBag,
  Eye,
} from 'lucide-react'

interface WelcomeTourModalProps {
  forceOpen?: boolean
  onCloseTour?: () => void
}

interface TourStep {
  badge: string
  title: string
  subtitle: string
  description: string
  exampleBox: {
    title: string
    content: string
    tag: string
  }
  icon: React.ReactNode
  gradient: string
}

const TOUR_STEPS: TourStep[] = [
  {
    badge: '1 de 5 • Bienvenida',
    title: '¡Bienvenidos a Tándem! ✨',
    subtitle: 'El espacio financiero para construir juntos',
    description:
      'Tándem une las finanzas de la pareja en un solo lugar seguro. Ambos comparten las metas y los gastos del hogar, manteniendo su independencia y privacidad.',
    exampleBox: {
      tag: 'Espacio Compartido',
      title: 'Dos usuarios, un mismo objetivo',
      content: 'Vinculados mediante un código único de pareja con sincronización en tiempo real.',
    },
    icon: <Heart size={28} className="text-pink-400" />,
    gradient: 'from-indigo-500/20 via-purple-500/20 to-pink-500/20',
  },
  {
    badge: '2 de 5 • Metas & Compras',
    title: 'Metas de Ahorro y Compras 🎯',
    subtitle: 'Ahorren para viajes o coticen productos con 1 link',
    description:
      'Creen metas conjuntas (un viaje, un auto, o fondo de emergencia). Si quieren comprar un producto online, ¡solo peguen el link de Amazon o MercadoLibre y Tándem extraerá la foto, título y precio!',
    exampleBox: {
      tag: 'Ejemplo Real',
      title: 'Meta: Viaje a la Playa ($2.500.000)',
      content: 'Ambos pueden hacer abonos individuales, ver el porcentaje completado y dejarse notas de amor.',
    },
    icon: <Target size={28} className="text-indigo-400" />,
    gradient: 'from-blue-500/20 via-indigo-500/20 to-violet-500/20',
  },
  {
    badge: '3 de 5 • Finanzas del Hogar',
    title: 'Control de Ingresos y Gastos 💵',
    subtitle: 'Balance disponible y recordatorios de pago',
    description:
      'Registren sus sueldos y gastos fijos mensuales (arriendo, servicios, suscripciones). El calendario de vencimientos les recordará con alertas push al celular antes de cada corte.',
    exampleBox: {
      tag: 'Ejemplo Real',
      title: 'Calendario de Facturas',
      content: 'Internet ($120.000) vence el día 5 • Luz ($85.000) vence el día 18. Alerta enviada al móvil.',
    },
    icon: <Wallet size={28} className="text-emerald-400" />,
    gradient: 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
  },
  {
    badge: '4 de 5 • División & Deudas',
    title: 'Reparto Justo y Deudas Internas ⚖️',
    subtitle: 'División proporcional y balance de cuentas',
    description:
      '¿Ganan diferente? El sistema calcula los aportes justos (50/50 o según el ingreso de cada uno). Además, anoten compras compartidas para saber quién le debe a quién y saldar con 1 clic.',
    exampleBox: {
      tag: 'Ejemplo Real',
      title: 'Módulo de Deudas Internas',
      content: 'Ella pagó la cena ($140.000) ➔ Balance neto: Él le debe $70.000. ¡Saldar con confeti!',
    },
    icon: <Scale size={28} className="text-amber-400" />,
    gradient: 'from-amber-500/20 via-orange-500/20 to-rose-500/20',
  },
  {
    badge: '5 de 5 • Experiencia',
    title: 'Simulador, Privacidad y Celular 📱',
    subtitle: 'Herramientas inteligentes para el día a día',
    description:
      'Proyecta cuántos meses tardarán en cumplir cada meta en el Simulador. En la calle, activa el Modo Privacidad (👁️) para ocultar las cifras. ¡E instala la app en tu celular para usarla a diario!',
    exampleBox: {
      tag: 'Tip Pro',
      title: 'PWA Instalable',
      content: 'Añade Tándem a la pantalla de inicio de tu smartphone para tener una experiencia de app nativa.',
    },
    icon: <Smartphone size={28} className="text-cyan-400" />,
    gradient: 'from-purple-500/20 via-pink-500/20 to-rose-500/20',
  },
]

export default function WelcomeTourModal({
  forceOpen = false,
  onCloseTour,
}: WelcomeTourModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true)
      setCurrentStep(0)
      return
    }

    const hasSeenTour = localStorage.getItem('tandem_welcome_tour_seen')
    if (!hasSeenTour) {
      // Small delay for smooth entry animation on first load
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [forceOpen])

  const handleClose = () => {
    localStorage.setItem('tandem_welcome_tour_seen', 'true')
    setIsOpen(false)
    if (onCloseTour) onCloseTour()
  }

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      triggerCelebrationConfetti()
      handleClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  if (!isOpen) return null

  const step = TOUR_STEPS[currentStep]
  const isLast = currentStep === TOUR_STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      {/* Modal Card Container */}
      <div className="relative w-full max-w-lg rounded-[var(--radius-xl)] bg-bg-card border border-border shadow-2xl overflow-hidden animate-scale-up">
        {/* Top Gradient Background Header */}
        <div className={`p-6 pb-5 bg-gradient-to-br ${step.gradient} border-b border-border/50 transition-all duration-300`}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full bg-bg-card/80 backdrop-blur-sm border border-border text-[11px] font-bold text-text-primary tracking-wide">
              {step.badge}
            </span>
            <button
              onClick={handleClose}
              className="text-text-muted hover:text-text-primary text-xs font-semibold px-2 py-1 rounded-[var(--radius-md)] hover:bg-bg-card/60 transition-colors flex items-center gap-1"
            >
              Saltar tour <X size={14} />
            </button>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-bg-card/90 border border-border flex items-center justify-center shadow-md shrink-0">
              {step.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary leading-tight">
                {step.title}
              </h2>
              <p className="text-xs text-text-muted mt-0.5 font-medium">
                {step.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            {step.description}
          </p>

          {/* Example Box */}
          <div className="p-4 rounded-[var(--radius-lg)] bg-bg-surface/80 border border-border space-y-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-accent-primary bg-accent-primary-soft px-2 py-0.5 rounded-full">
                {step.exampleBox.tag}
              </span>
            </div>
            <p className="text-xs font-bold text-text-primary pt-0.5">
              {step.exampleBox.title}
            </p>
            <p className="text-xs text-text-muted leading-normal">
              {step.exampleBox.content}
            </p>
          </div>
        </div>

        {/* Footer & Navigation Controls */}
        <div className="p-4 sm:p-6 pt-2 bg-bg-surface/30 border-t border-border flex items-center justify-between gap-3">
          {/* Step indicator dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                aria-label={`Ir al paso ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep === idx
                    ? 'w-6 bg-accent-primary'
                    : 'w-2 bg-text-muted/30 hover:bg-text-muted/60'
                }`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                icon={<ChevronLeft size={14} />}
              >
                Atrás
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleNext}
              icon={isLast ? <Sparkles size={14} /> : <ChevronRight size={14} />}
              className={isLast ? '!bg-success hover:!bg-success/90 text-white' : ''}
            >
              {isLast ? '¡Comenzar ahora!' : 'Siguiente'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
