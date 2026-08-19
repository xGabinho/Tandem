'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import GoalCard from '@/components/goals/GoalCard'
import CreateGoalModal from '@/components/goals/CreateGoalModal'
import { GoalCardSkeleton } from '@/components/ui/SkeletonLoader'
import Button from '@/components/ui/Button'
import {
  Plus,
  Layers,
  PiggyBank,
  Search,
  Sparkles,
} from 'lucide-react'

type GoalRow = Database['public']['Tables']['goals']['Row']
type ContributionRow = Database['public']['Tables']['contributions']['Row']

type FilterType = 'all' | 'savings' | 'quoting' | 'experience'
type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed'

export default function GoalsPage() {
  const { profile } = useAuth()
  const [goals, setGoals] = useState<GoalRow[]>([])
  const [contributions, setContributions] = useState<ContributionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const fetchData = async () => {
    setLoading(true)
    const [goalsRes, contribRes] = await Promise.all([
      supabase.from('goals').select('*').order('created_at', { ascending: false }),
      supabase.from('contributions').select('*'),
    ])
    if (goalsRes.data) setGoals(goalsRes.data)
    if (contribRes.data) setContributions(contribRes.data)
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.workspace_id) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [profile?.workspace_id])

  // Calculate contributions per goal
  const contribByGoal = contributions.reduce(
    (acc, c) => {
      acc[c.goal_id] = (acc[c.goal_id] || 0) + c.amount
      return acc
    },
    {} as Record<string, number>
  )

  // Apply filters
  const filtered = goals.filter((g) => {
    if (filterType !== 'all' && g.type !== filterType) return false
    if (filterStatus !== 'all' && g.status !== filterStatus) return false
    return true
  })

  const typeFilters: { id: FilterType; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Todas', icon: <Layers size={14} /> },
    { id: 'savings', label: 'Ahorro', icon: <PiggyBank size={14} className="text-emerald-400" /> },
    { id: 'quoting', label: 'Cotización', icon: <Search size={14} className="text-blue-400" /> },
    { id: 'experience', label: 'Experiencia', icon: <Sparkles size={14} className="text-amber-400" /> },
  ]

  return (
    <>
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
            Metas
          </h2>
          <p className="text-text-muted text-sm mt-1">
            {goals.length} meta{goals.length !== 1 ? 's' : ''} en tu espacio
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus size={16} />}
        >
          Nueva Meta
        </Button>
      </header>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {typeFilters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2
              ${
                filterType === f.id
                  ? 'bg-accent-primary-soft text-accent-primary border border-accent-primary/20'
                  : 'bg-bg-card border border-border text-text-muted hover:text-text-primary hover:border-border-hover'
              }
            `}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {[...Array(6)].map((_, i) => (
            <GoalCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 stagger-children">
          {filtered.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              totalContributions={contribByGoal[goal.id] || 0}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-4">🎯</p>
          <h3 className="text-lg font-bold text-text-primary mb-2">
            {goals.length === 0 ? 'Sin metas aún' : 'Sin resultados'}
          </h3>
          <p className="text-sm text-text-muted max-w-sm mx-auto mb-4">
            {goals.length === 0
              ? 'Crea tu primera meta para empezar a planear juntos.'
              : 'Ninguna meta coincide con los filtros seleccionados.'}
          </p>
          {goals.length === 0 && (
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              Crear primera meta
            </Button>
          )}
        </div>
      )}

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchData}
      />
    </>
  )
}
