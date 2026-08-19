-- ==============================================================================
-- MIGRACIÓN PARA INGRESOS Y GASTOS MENSUALES EN TÁNDEM
-- Ejecuta este script en: Supabase Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- 1. Tabla de Ingresos
CREATE TABLE IF NOT EXISTS incomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50) DEFAULT 'salary',
    frequency VARCHAR(20) DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'biweekly', 'one_time', 'weekly', 'yearly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Gastos Mensuales / Fijos
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50) DEFAULT 'housing',
    due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
    frequency VARCHAR(20) DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'biweekly', 'one_time', 'weekly', 'yearly')),
    is_fixed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para Incomes
DROP POLICY IF EXISTS "Ver ingresos del espacio" ON incomes;
CREATE POLICY "Ver ingresos del espacio" ON incomes 
FOR SELECT USING (workspace_id = get_user_workspace_id());

DROP POLICY IF EXISTS "Gestionar ingresos del espacio" ON incomes;
CREATE POLICY "Gestionar ingresos del espacio" ON incomes 
FOR ALL USING (workspace_id = get_user_workspace_id());

-- 5. Políticas para Expenses
DROP POLICY IF EXISTS "Ver gastos del espacio" ON expenses;
CREATE POLICY "Ver gastos del espacio" ON expenses 
FOR SELECT USING (workspace_id = get_user_workspace_id());

DROP POLICY IF EXISTS "Gestionar gastos del espacio" ON expenses;
CREATE POLICY "Gestionar gastos del espacio" ON expenses 
FOR ALL USING (workspace_id = get_user_workspace_id());
