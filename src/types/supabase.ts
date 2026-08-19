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
      incomes: {
        Row: {
          id: string
          workspace_id: string
          user_id: string | null
          title: string
          amount: number
          category: 'salary' | 'freelance' | 'investments' | 'business' | 'bonus' | 'other' | (string & {})
          frequency: 'monthly' | 'biweekly' | 'one_time' | 'weekly' | 'yearly'
          created_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id?: string | null
          title: string
          amount: number
          category?: 'salary' | 'freelance' | 'investments' | 'business' | 'bonus' | 'other' | (string & {})
          frequency?: 'monthly' | 'biweekly' | 'one_time' | 'weekly' | 'yearly'
          created_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string | null
          title?: string
          amount?: number
          category?: 'salary' | 'freelance' | 'investments' | 'business' | 'bonus' | 'other' | (string & {})
          frequency?: 'monthly' | 'biweekly' | 'one_time' | 'weekly' | 'yearly'
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'incomes_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'incomes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      expenses: {
        Row: {
          id: string
          workspace_id: string
          user_id: string | null
          title: string
          amount: number
          category: 'housing' | 'utilities' | 'food' | 'transport' | 'pets' | 'entertainment' | 'shopping' | 'travel' | 'subscriptions' | 'health' | 'debt' | 'education' | 'maintenance' | 'other' | (string & {})
          due_day: number | null
          frequency: 'monthly' | 'biweekly' | 'one_time' | 'weekly' | 'yearly'
          is_fixed: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id?: string | null
          title: string
          amount: number
          category?: 'housing' | 'utilities' | 'food' | 'transport' | 'pets' | 'entertainment' | 'shopping' | 'travel' | 'subscriptions' | 'health' | 'debt' | 'education' | 'maintenance' | 'other' | (string & {})
          due_day?: number | null
          frequency?: 'monthly' | 'biweekly' | 'one_time' | 'weekly' | 'yearly'
          is_fixed?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string | null
          title?: string
          amount?: number
          category?: 'housing' | 'utilities' | 'food' | 'transport' | 'pets' | 'entertainment' | 'shopping' | 'travel' | 'subscriptions' | 'health' | 'debt' | 'education' | 'maintenance' | 'other' | (string & {})
          due_day?: number | null
          frequency?: 'monthly' | 'biweekly' | 'one_time' | 'weekly' | 'yearly'
          is_fixed?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'expenses_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expenses_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      internal_debts: {
        Row: {
          id: string
          workspace_id: string
          debtor_id: string
          creditor_id: string
          amount: number
          description: string
          status: 'pending' | 'settled'
          settled_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          debtor_id: string
          creditor_id: string
          amount: number
          description: string
          status?: 'pending' | 'settled'
          settled_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          debtor_id?: string
          creditor_id?: string
          amount?: number
          description?: string
          status?: 'pending' | 'settled'
          settled_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'internal_debts_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'internal_debts_debtor_id_fkey'
            columns: ['debtor_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'internal_debts_creditor_id_fkey'
            columns: ['creditor_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      goal_comments: {
        Row: {
          id: string
          goal_id: string
          user_id: string
          message: string
          created_at: string | null
        }
        Insert: {
          id?: string
          goal_id: string
          user_id: string
          message: string
          created_at?: string | null
        }
        Update: {
          id?: string
          goal_id?: string
          user_id?: string
          message?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'goal_comments_goal_id_fkey'
            columns: ['goal_id']
            isOneToOne: false
            referencedRelation: 'goals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'goal_comments_user_id_fkey'
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

export type IncomeRow = Database['public']['Tables']['incomes']['Row']
export type IncomeInsert = Database['public']['Tables']['incomes']['Insert']
export type IncomeUpdate = Database['public']['Tables']['incomes']['Update']

export type ExpenseRow = Database['public']['Tables']['expenses']['Row']
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

export type InternalDebtRow = Database['public']['Tables']['internal_debts']['Row']
export type InternalDebtInsert = Database['public']['Tables']['internal_debts']['Insert']
export type InternalDebtUpdate = Database['public']['Tables']['internal_debts']['Update']

export type GoalRow = Database['public']['Tables']['goals']['Row']
export type GoalInsert = Database['public']['Tables']['goals']['Insert']
export type GoalUpdate = Database['public']['Tables']['goals']['Update']

export type GoalCommentRow = Database['public']['Tables']['goal_comments']['Row']
export type GoalCommentInsert = Database['public']['Tables']['goal_comments']['Insert']

export type ContributionRow = Database['public']['Tables']['contributions']['Row']
export type ContributionInsert = Database['public']['Tables']['contributions']['Insert']

export type WorkspaceRow = Database['public']['Tables']['workspaces']['Row']
export type UserRow = Database['public']['Tables']['users']['Row']
