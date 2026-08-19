'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getWorkspaceUsers } from '@/lib/api/workspaces'
import {
  getInternalDebts,
  createInternalDebt,
  settleInternalDebt,
  reopenInternalDebt,
  deleteInternalDebt,
  PopulatedInternalDebt,
} from '@/lib/api/internalDebts'
import { UserRow } from '@/types/supabase'
import { formatCurrency } from '@/lib/utils/calculations'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { triggerSubtleConfetti } from '@/lib/utils/confetti'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import {
  Handshake,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Users2,
  Receipt,
  HeartHandshake,
} from 'lucide-react'

export default function InternalDebtsCard() {
  const { user, profile } = useAuth()
  const { maskAmount } = usePrivacy()
  const [debts, setDebts] = useState<PopulatedInternalDebt[]>([])
  const [workspaceUsers, setWorkspaceUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'settled'>('pending')

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [creditorId, setCreditorId] = useState('') // Quién pagó/prestó
  const [debtorId, setDebtorId] = useState('') // Quién debe
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const loadData = async () => {
    if (!profile?.workspace_id) return
    setLoading(true)

    try {
      const [debtsData, usersData] = await Promise.all([
        getInternalDebts(),
        getWorkspaceUsers(profile.workspace_id),
      ])
      setDebts(debtsData)
      setWorkspaceUsers(usersData)

      // Defaults for modal
      if (usersData.length >= 2) {
        setCreditorId(profile.id)
        const partner = usersData.find((u) => u.id !== profile.id)
        if (partner) setDebtorId(partner.id)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [profile?.workspace_id])

  const pendingDebts = debts.filter((d) => d.status === 'pending')
  const settledDebts = debts.filter((d) => d.status === 'settled')

  // Calculate Net Balance between users
  const calculateNetBalance = () => {
    if (workspaceUsers.length < 2) return null

    const userA = workspaceUsers[0]
    const userB = workspaceUsers[1]

    let aOwesB = 0
    let bOwesA = 0

    for (const d of pendingDebts) {
      if (d.debtor_id === userA.id && d.creditor_id === userB.id) {
        aOwesB += Number(d.amount)
      } else if (d.debtor_id === userB.id && d.creditor_id === userA.id) {
        bOwesA += Number(d.amount)
      }
    }

    const net = aOwesB - bOwesA

    if (net > 0) {
      return {
        debtor: userA.name,
        creditor: userB.name,
        amount: net,
        isCurrentUserDebtor: userA.id === user?.id,
      }
    } else if (net < 0) {
      return {
        debtor: userB.name,
        creditor: userA.name,
        amount: Math.abs(net),
        isCurrentUserDebtor: userB.id === user?.id,
      }
    }

    return { debtor: '', creditor: '', amount: 0, isCurrentUserDebtor: false }
  }

  const netBalance = calculateNetBalance()

  const handleCreateDebt = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile?.workspace_id) return

    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('El monto debe ser mayor a 0.')
      return
    }

    if (!description.trim()) {
      setError('Escribe un concepto o motivo (ej: Mitad de la cena).')
      return
    }

    if (!creditorId || !debtorId || creditorId === debtorId) {
      setError('Debes seleccionar dos personas distintas.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await createInternalDebt({
        workspace_id: profile.workspace_id,
        creditor_id: creditorId,
        debtor_id: debtorId,
        amount: parsedAmount,
        description: description.trim(),
        status: 'pending',
      })

      setIsModalOpen(false)
      setAmount('')
      setDescription('')
      await loadData()
    } catch {
      setError('Error al registrar la deuda.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSettleDebt = async (id: string) => {
    setActionLoadingId(id)
    try {
      await settleInternalDebt(id)
      triggerSubtleConfetti()
      await loadData()
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReopenDebt = async (id: string) => {
    setActionLoadingId(id)
    try {
      await reopenInternalDebt(id)
      await loadData()
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDeleteDebt = async (id: string) => {
    setActionLoadingId(id)
    try {
      await deleteInternalDebt(id)
      await loadData()
    } catch {
      // ignore
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Net Balance Banner */}
      <div className="glass-card p-6 border-l-4 border-l-accent-primary relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-primary-soft text-accent-primary flex items-center justify-center">
                <HeartHandshake size={18} />
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                Deudas Internas en Pareja
              </h2>
            </div>
            <p className="text-xs text-text-muted">
              Lleven cuentas claras de préstamos o gastos compartidos sin presiones.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            icon={<Plus size={16} />}
          >
            Registrar Deuda / Gasto
          </Button>
        </div>

        {/* Consolidated Net Balance Box */}
        <div className="mt-6 p-4 rounded-[var(--radius-lg)] bg-bg-surface border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-bg-card border border-border flex items-center justify-center shrink-0">
              <Handshake size={20} className="text-accent-primary" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">Balance Neto Consolidado</p>
              {netBalance && netBalance.amount > 0 ? (
                <p className="text-base font-bold text-text-primary mt-0.5">
                  <span className="text-danger">{netBalance.debtor}</span> le debe{' '}
                  <span className="text-success font-extrabold">{maskAmount(netBalance.amount)}</span> a{' '}
                  <span className="text-accent-primary">{netBalance.creditor}</span>
                </p>
              ) : (
                <p className="text-base font-bold text-success mt-0.5 flex items-center gap-1.5">
                  <Sparkles size={16} /> ¡Están completamente a mano! 🎉
                </p>
              )}
            </div>
          </div>

          {netBalance && netBalance.amount > 0 && (
            <div className="px-3 py-1.5 rounded-[var(--radius-md)] bg-accent-primary-soft text-accent-primary text-xs font-semibold shrink-0">
              {pendingDebts.length} {pendingDebts.length === 1 ? 'pendiente' : 'pendientes'}
            </div>
          )}
        </div>
      </div>

      {/* Tabs: Pendientes vs Historial */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-[var(--radius-md)] text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'bg-accent-primary text-white shadow-sm'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-surface'
          }`}
        >
          <Clock size={14} />
          <span>Pendientes ({pendingDebts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settled')}
          className={`px-4 py-2 rounded-[var(--radius-md)] text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'settled'
              ? 'bg-accent-primary text-white shadow-sm'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-surface'
          }`}
        >
          <CheckCircle2 size={14} />
          <span>Saldadas ({settledDebts.length})</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="glass-card p-4 h-20 animate-pulse bg-bg-surface/50" />
          ))}
        </div>
      ) : activeTab === 'pending' ? (
        pendingDebts.length > 0 ? (
          <div className="space-y-3">
            {pendingDebts.map((item) => {
              const creditorName = item.creditor?.name || 'Pareja'
              const debtorName = item.debtor?.name || 'Pareja'
              const isDebtorMe = item.debtor_id === user?.id

              return (
                <div
                  key={item.id}
                  className="glass-card p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-border-hover transition-all"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-accent-primary-soft/40 border border-accent-primary/20 flex items-center justify-center shrink-0 font-bold text-accent-primary text-xs mt-0.5">
                      <Receipt size={18} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-text-primary">
                          {item.description}
                        </p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            isDebtorMe
                              ? 'bg-danger-soft text-danger'
                              : 'bg-success-soft text-success'
                          }`}
                        >
                          {isDebtorMe ? 'Debes tú' : `Te debe ${debtorName}`}
                        </span>
                      </div>

                      <p className="text-xs text-text-muted mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-text-secondary">{debtorName}</span>
                        <ArrowRight size={12} className="text-text-muted" />
                        <span className="font-semibold text-text-secondary">{creditorName}</span>
                        <span>•</span>
                        <span>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : 'Reciente'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Amount */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-border">
                    <div className="text-left sm:text-right">
                      <p className="text-base font-extrabold text-text-primary">
                        {maskAmount(item.amount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSettleDebt(item.id)}
                        loading={actionLoadingId === item.id}
                        icon={<CheckCircle2 size={14} className="text-success" />}
                      >
                        Saldar
                      </Button>

                      <button
                        onClick={() => handleDeleteDebt(item.id)}
                        disabled={actionLoadingId === item.id}
                        className="p-2 text-text-muted hover:text-danger hover:bg-danger-soft rounded-[var(--radius-md)] transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="glass-card p-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-success-soft text-success flex items-center justify-center mx-auto mb-2">
              <Sparkles size={22} />
            </div>
            <p className="font-bold text-text-primary">
              No hay deudas pendientes
            </p>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              Todo está al día entre ustedes. Si pagan algo compartido, pueden anotarlo aquí.
            </p>
          </div>
        )
      ) : settledDebts.length > 0 ? (
        <div className="space-y-3 opacity-90">
          {settledDebts.map((item) => (
            <div
              key={item.id}
              className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-bg-surface/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-success-soft text-success flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary line-through text-text-muted">
                    {item.description}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    Saldada el{' '}
                    {item.settled_at
                      ? new Date(item.settled_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xs font-bold text-text-muted">
                  {maskAmount(item.amount)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleReopenDebt(item.id)}
                    disabled={actionLoadingId === item.id}
                    className="p-1.5 text-text-muted hover:text-accent-primary hover:bg-accent-primary-soft rounded transition-colors text-xs flex items-center gap-1"
                    title="Reabrir deuda"
                  >
                    <RotateCcw size={13} />
                    <span className="text-[11px]">Reabrir</span>
                  </button>
                  <button
                    onClick={() => handleDeleteDebt(item.id)}
                    disabled={actionLoadingId === item.id}
                    className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-soft rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center text-xs text-text-muted">
          Aún no hay historial de deudas saldadas.
        </div>
      )}

      {/* Modal: Registrar Deuda */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Deuda o Gasto Compartido"
        subtitle="Anota un préstamo o pago para llevar la cuenta clara"
        size="md"
      >
        <form onSubmit={handleCreateDebt} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary pl-1">
                ¿Quién pagó / prestó?
              </label>
              <select
                value={creditorId}
                onChange={(e) => {
                  setCreditorId(e.target.value)
                  const partner = workspaceUsers.find((u) => u.id !== e.target.value)
                  if (partner) setDebtorId(partner.id)
                }}
                className="w-full bg-bg-input border border-border rounded-[var(--radius-lg)] px-3.5 py-2.5 text-xs text-text-primary outline-none focus:border-accent-primary"
              >
                {workspaceUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.id === user?.id ? '(Tú)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary pl-1">
                ¿Quién debe el dinero?
              </label>
              <select
                value={debtorId}
                onChange={(e) => setDebtorId(e.target.value)}
                className="w-full bg-bg-input border border-border rounded-[var(--radius-lg)] px-3.5 py-2.5 text-xs text-text-primary outline-none focus:border-accent-primary"
              >
                {workspaceUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.id === user?.id ? '(Tú)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Monto"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            icon={<span className="text-sm font-bold">$</span>}
            autoFocus
          />

          <Input
            label="Concepto / Motivo"
            placeholder="Ej: Mitad de la cena, Supermercado, Gasolina..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {error && (
            <p className="text-xs text-danger animate-slide-down pl-1">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="flex-1"
            >
              Guardar Registro
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
