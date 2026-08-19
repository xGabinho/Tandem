'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { triggerCelebrationConfetti } from '@/lib/utils/confetti'
import Button from '@/components/ui/Button'
import {
  LayoutDashboard,
  Target,
  Wallet,
  Scale,
  Sparkles,
  Users2,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  ArrowRight,
} from 'lucide-react'

export interface TourStep {
  id: string
  route: string
  badge: string
  title: string
  subtitle: string
  description: string
  instruction: string
  icon: React.ReactNode
  accentColor: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard',
    route: '/dashboard',
    badge: 'Paso 1 de 6 • Inicio',
    title: '1. Tu Panel Principal (Dashboard) 📊',
    subtitle: 'El pulso de sus metas y dinero en tiempo real',
    description:
      'Aquí ven el porcentaje global de ahorro, el dinero total acumulado, las metas activas y el flujo financiero mensual (ingresos vs gastos fijos).',
    instruction:
      '💡 Tip: Puedes activar el Modo Privacidad (👁️ en la barra lateral o superior) para esconder los números cuando estés en lugares públicos.',
    icon: <LayoutDashboard size={24} className="text-indigo-400" />,
    accentColor: '#6366f1',
  },
  {
    id: 'goals',
    route: '/goals',
    badge: 'Paso 2 de 6 • Metas',
    title: '2. Metas de Ahorro & Compras Conjuntas 🎯',
    subtitle: 'Ahorren para sueños o coticen productos con 1 link',
    description:
      'Creen metas de ahorro (un viaje, un auto) o metas de compra. ¡Si van a comprar algo en Amazon o MercadoLibre, solo peguen el link del producto y Tándem extraerá la foto, título y precio automáticamente!',
    instruction:
      '💡 Cómo usarlo: Pulsa en "+ Nueva Meta", elige si es de ahorro o cotización, y luego ambos pueden hacer abonos con confeti festivo y dejarse notas de ánimo.',
    icon: <Target size={24} className="text-pink-400" />,
    accentColor: '#ec4899',
  },
  {
    id: 'finances-budget',
    route: '/finances',
    badge: 'Paso 3 de 6 • Finanzas',
    title: '3. Ingresos, Gastos y Vencimientos 💵',
    subtitle: 'Control total de lo que entra y sale en el hogar',
    description:
      'Registren los sueldos de ambos y los gastos fijos (arriendo, servicios, internet). El sistema calcula el balance disponible neto y el calendario les muestra qué facturas vencen en los próximos días.',
    instruction:
      '💡 Cómo usarlo: En la pestaña "Resumen" pulsa "+ Ingreso" o "+ Gasto". En el Calendario de Vencimientos puedes pulsar "Notificar al móvil" para recibir una alerta push.',
    icon: <Wallet size={24} className="text-emerald-400" />,
    accentColor: '#10b981',
  },
  {
    id: 'finances-debts',
    route: '/finances',
    badge: 'Paso 4 de 6 • Pareja',
    title: '4. Deudas Internas & División de Gastos ⚖️',
    subtitle: 'Cuentas claras y cero discusiones por dinero',
    description:
      '¿Ganan diferente o uno pagó la cuenta del restaurante? En la pestaña "División de Pareja" el sistema calcula los aportes justos (50/50 o proporcional al sueldo). Y en "Deudas de Pareja" anotan préstamos informales para saldarlos con 1 clic.',
    instruction:
      '💡 Ejemplo: "Ella pagó el supermercado ($120.000) ➔ Anotan la deuda y el sistema calcula la transferencia exacta para quedar a mano".',
    icon: <Scale size={24} className="text-amber-400" />,
    accentColor: '#f59e0b',
  },
  {
    id: 'simulator',
    route: '/simulator',
    badge: 'Paso 5 de 6 • Simulador',
    title: '5. Simulador Financiero & Proyecciones 🔮',
    subtitle: 'Calculen cuándo cumplirán cada meta',
    description:
      'El simulador toma sus finanzas reales y calcula cuántas cuotas (mensuales o quincenales) necesitan para comprar lo que desean o alcanzar un fondo.',
    instruction:
      '💡 Cómo usarlo: Selecciona una meta activa, ajusta cuánto quieren aportar al mes y mira la fecha estimada de cumplimiento.',
    icon: <Sparkles size={24} className="text-cyan-400" />,
    accentColor: '#06b6d4',
  },
  {
    id: 'settings',
    route: '/settings',
    badge: 'Paso 6 de 6 • Pareja y Temas',
    title: '6. Invitar a tu Pareja & Personalización 👥',
    subtitle: 'Comparte tu código único y cambia el diseño',
    description:
      'Aquí encuentras tu Código de Espacio para invitar a tu pareja (o unirte si ella ya lo creó). También puedes activar las Notificaciones Push y elegir entre 4 Temas visuales.',
    instruction:
      '💡 Cómo invitar: En la sección "Gestión de Pareja", copia el código de 6 caracteres y envíaselo por WhatsApp. Al registrarse, solo debe elegir "Unirme con código".',
    icon: <Users2 size={24} className="text-purple-400" />,
    accentColor: '#a855f7',
  },
]

interface TourContextType {
  isTourActive: boolean
  currentStepIndex: number
  startTour: () => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isTourActive, setIsTourActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Check first-time visit
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('tandem_interactive_tour_seen')
    // Solo auto-iniciar si estamos en dashboard/onboarding y no lo ha visto
    if (!hasSeenTour && (pathname === '/dashboard' || pathname === '/onboarding')) {
      const timer = setTimeout(() => {
        setIsTourActive(true)
        setCurrentStepIndex(0)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [pathname])

  const goToStep = (index: number) => {
    if (index >= 0 && index < TOUR_STEPS.length) {
      setCurrentStepIndex(index)
      const targetStep = TOUR_STEPS[index]
      if (pathname !== targetStep.route) {
        router.push(targetStep.route)
      }
    }
  }

  const startTour = () => {
    setIsTourActive(true)
    goToStep(0)
  }

  const nextStep = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      goToStep(currentStepIndex + 1)
    } else {
      // Tour completed
      triggerCelebrationConfetti()
      skipTour()
    }
  }

  const prevStep = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1)
    }
  }

  const skipTour = () => {
    localStorage.setItem('tandem_interactive_tour_seen', 'true')
    setIsTourActive(false)
  }

  const currentStep = TOUR_STEPS[currentStepIndex]
  const isLast = currentStepIndex === TOUR_STEPS.length - 1

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        currentStepIndex,
        startTour,
        nextStep,
        prevStep,
        skipTour,
      }}
    >
      {children}

      {/* Floating Interactive Guide Overlay */}
      {isTourActive && (
        <div className="fixed inset-x-0 bottom-4 sm:bottom-6 z-50 flex justify-center px-3 pointer-events-none animate-slide-up">
          <div className="pointer-events-auto w-full max-w-xl rounded-[var(--radius-xl)] bg-bg-card/95 backdrop-blur-xl border border-border shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300">
            {/* Top Accent Line */}
            <div
              className="h-1.5 w-full transition-all duration-500"
              style={{
                background: `linear-gradient(90deg, ${currentStep.accentColor}, #a855f7, #ec4899)`,
              }}
            />

            <div className="p-4 sm:p-5 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center shrink-0 shadow-md"
                    style={{ backgroundColor: `${currentStep.accentColor}20` }}
                  >
                    {currentStep.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted bg-bg-surface px-2 py-0.5 rounded-full border border-border">
                        {currentStep.badge}
                      </span>
                      <span className="text-[10px] text-accent-primary font-semibold">
                        📍 Navegando a: {currentStep.route}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-text-primary mt-0.5 leading-snug">
                      {currentStep.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={skipTour}
                  className="text-text-muted hover:text-text-primary text-xs font-semibold p-1.5 rounded-[var(--radius-md)] hover:bg-bg-surface transition-colors shrink-0"
                  title="Saltar recorrido"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Description & Instruction */}
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                {currentStep.description}
              </p>

              <div className="p-2.5 sm:p-3 rounded-[var(--radius-lg)] bg-bg-surface/90 border border-border/80 text-xs text-text-muted leading-normal">
                {currentStep.instruction}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/60">
                {/* Step dots */}
                <div className="flex items-center gap-1">
                  {TOUR_STEPS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToStep(idx)}
                      aria-label={`Ir al paso ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        currentStepIndex === idx
                          ? 'w-5 bg-accent-primary'
                          : 'w-1.5 bg-text-muted/30 hover:bg-text-muted/60'
                      }`}
                    />
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={skipTour}
                    className="text-xs text-text-muted hover:text-text-primary px-2.5 py-1.5 transition-colors"
                  >
                    Saltar
                  </button>

                  {currentStepIndex > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevStep}
                      icon={<ChevronLeft size={13} />}
                      className="!py-1 !px-2.5 !text-xs"
                    >
                      Atrás
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={nextStep}
                    icon={isLast ? <Sparkles size={13} /> : <ChevronRight size={13} />}
                    className={`!py-1 !px-3 !text-xs ${
                      isLast ? '!bg-success hover:!bg-success/90 text-white font-bold' : ''
                    }`}
                  >
                    {isLast ? '¡Comenzar a usar Tándem!' : 'Siguiente'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}
