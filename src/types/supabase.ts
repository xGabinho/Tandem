export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          join_code: string | null
          name: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          join_code?: string | null
          name?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          join_code?: string | null
          name?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          workspace_id: string | null
          name: string
          theme_preference: string | null
          avatar_url: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          workspace_id?: string | null
          name: string
          theme_preference?: string | null
          avatar_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string | null
          name?: string
          theme_preference?: string | null
          avatar_url?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'users_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      goals: {
        Row: {
          id: string
          workspace_id: string
          title: string
          type: 'savings' | 'quoting' | 'experience'
          priority: 'high' | 'medium' | 'low'
          target_amount: number | null
          target_date: string | null
          image_url: string | null
          assigned_to: string | null
          status: 'pending' | 'in_progress' | 'completed' | null
          reference_links: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          title: string
          type: 'savings' | 'quoting' | 'experience'
          priority: 'high' | 'medium' | 'low'
          target_amount?: number | null
          target_date?: string | null
          image_url?: string | null
          assigned_to?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | null
          reference_links?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          title?: string
          type?: 'savings' | 'quoting' | 'experience'
          priority?: 'high' | 'medium' | 'low'
          target_amount?: number | null
          target_date?: string | null
          image_url?: string | null
          assigned_to?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | null
          reference_links?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'goals_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'goals_assigned_to_fkey'
            columns: ['assigned_to']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      contributions: {
        Row: {
          id: string
          goal_id: string
          user_id: string
          amount: number
          note: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          goal_id: string
          user_id: string
          amount: number
          note?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          goal_id?: string
          user_id?: string
          amount?: number
          note?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'contributions_goal_id_fkey'
            columns: ['goal_id']
            isOneToOne: false
            referencedRelation: 'goals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contributions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_workspace_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
