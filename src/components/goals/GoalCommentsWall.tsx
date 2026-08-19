'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { GoalCommentRow } from '@/types/supabase'
import { triggerSubtleConfetti } from '@/lib/utils/confetti'
import { MessageSquareHeart, Send, Trash2, Heart, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'

interface CommentWithUser extends GoalCommentRow {
  users?: {
    id: string
    name: string
    avatar_url: string | null
  } | null
}

interface GoalCommentsWallProps {
  goalId: string
}

export default function GoalCommentsWall({ goalId }: GoalCommentsWallProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadComments = async () => {
    const { data } = await supabase
      .from('goal_comments')
      .select('*, users(id, name, avatar_url)')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: true })

    if (data) {
      setComments(data as CommentWithUser[])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (goalId) {
      loadComments()
    }
  }, [goalId])

  const handleSendComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setSending(true)
    const { error } = await supabase.from('goal_comments').insert({
      goal_id: goalId,
      user_id: user.id,
      message: newComment.trim(),
    })

    if (!error) {
      setNewComment('')
      triggerSubtleConfetti()
      await loadComments()
    }
    setSending(false)
  }

  const handleDeleteComment = async (id: string) => {
    setDeletingId(id)
    const { error } = await supabase.from('goal_comments').delete().eq('id', id)
    if (!error) {
      await loadComments()
    }
    setDeletingId(null)
  }

  return (
    <div className="glass-card p-5 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center">
            <MessageSquareHeart size={18} />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
              Muro de Notas & Motivación ({comments.length})
            </h3>
            <p className="text-xs text-text-muted">
              Déjense mensajes de apoyo y notas sobre esta meta
            </p>
          </div>
        </div>
      </div>

      {/* Comments timeline */}
      {loading ? (
        <div className="py-6 text-center text-xs text-text-muted">
          Cargando notas...
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {comments.map((comment) => {
            const isMe = comment.user_id === user?.id
            const dateStr = comment.created_at
              ? new Date(comment.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''

            return (
              <div
                key={comment.id}
                className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Author Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    isMe
                      ? 'bg-accent-primary text-white shadow-sm'
                      : 'bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30'
                  }`}
                >
                  {comment.users?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>

                {/* Message bubble */}
                <div
                  className={`max-w-[82%] rounded-[var(--radius-lg)] p-3 border transition-all space-y-1 ${
                    isMe
                      ? 'bg-accent-primary-soft/40 border-accent-primary/30 text-text-primary rounded-tr-sm'
                      : 'bg-bg-surface border-border text-text-primary rounded-tl-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="font-bold text-text-primary">
                      {isMe ? 'Tú' : comment.users?.name || 'Pareja'}
                    </span>
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <span>{dateStr}</span>
                      {isMe && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingId === comment.id}
                          className="text-text-muted hover:text-danger p-0.5 transition-colors"
                          title="Eliminar mensaje"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed break-words">
                    {comment.message}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-6 text-center text-text-muted text-xs space-y-1 bg-bg-surface/40 rounded-[var(--radius-lg)] border border-dashed border-border p-4">
          <p className="font-medium text-text-secondary">
            Aún no hay notas en esta meta.
          </p>
          <p>Escribe el primer mensaje de ánimo para tu pareja 💕</p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendComment} className="flex gap-2 pt-1">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escribe una nota o mensaje de ánimo..."
          maxLength={500}
          className="flex-1 bg-bg-surface border border-border rounded-[var(--radius-lg)] px-3.5 py-2.5 text-xs text-text-primary outline-none focus:border-accent-primary transition-all placeholder:text-text-muted"
        />
        <Button
          type="submit"
          size="sm"
          loading={sending}
          disabled={!newComment.trim()}
          icon={<Send size={13} />}
        >
          Enviar
        </Button>
      </form>
    </div>
  )
}
