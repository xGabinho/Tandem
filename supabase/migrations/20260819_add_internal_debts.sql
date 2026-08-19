-- ==============================================================================
-- MIGRACIÓN: AÑADIR TABLA DE DEUDAS INTERNAS EN PAREJA (internal_debts)
-- Ejecuta este script en Supabase Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- 1. Crear tabla de Deudas Internas
CREATE TABLE IF NOT EXISTS public.internal_debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    debtor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    creditor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'settled')),
    settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar seguridad por fila (RLS)
ALTER TABLE public.internal_debts ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de seguridad (RLS)
DROP POLICY IF EXISTS "Ver deudas del espacio" ON public.internal_debts;
CREATE POLICY "Ver deudas del espacio" ON public.internal_debts 
FOR SELECT USING (workspace_id = public.get_user_workspace_id());

DROP POLICY IF EXISTS "Gestionar deudas del espacio" ON public.internal_debts;
CREATE POLICY "Gestionar deudas del espacio" ON public.internal_debts 
FOR ALL USING (workspace_id = public.get_user_workspace_id());
