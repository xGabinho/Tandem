-- ==============================================================================
-- SCHEMA COMPLETO DE BASE DE DATOS, TRIGGERS Y STORAGE PARA TÁNDEM
-- Ejecuta este script COMPLETO en: Supabase Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- 1. Tabla de Espacios (Workspaces)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    join_code VARCHAR(10) UNIQUE,
    name VARCHAR(100) DEFAULT 'Nuestro Espacio',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Usuarios (Extensión de auth.users de Supabase)
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    theme_preference VARCHAR(50) DEFAULT 'minimal_dark',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Metas
CREATE TABLE IF NOT EXISTS goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('savings', 'quoting', 'experience')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    target_amount DECIMAL(12, 2),
    target_date DATE,
    image_url TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    reference_links JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Abonos
CREATE TABLE IF NOT EXISTS contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    note VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Ingresos
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

-- 6. Tabla de Gastos Mensuales / Fijos
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

-- 7. Tabla de Deudas Internas entre la Pareja (IOU / Préstamos y Gastos Compartidos)
CREATE TABLE IF NOT EXISTS internal_debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    debtor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    creditor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'settled')),
    settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabla de Mensajes y Notas en Metas
CREATE TABLE IF NOT EXISTS goal_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 5. TRIGGERS AUTOMÁTICOS
-- ==============================================================================

-- A) Trigger para crear perfil automáticamente en public.users al registrarse en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, theme_preference, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    'minimal_dark',
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.users.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B) Trigger para generar join_code único de formato XXXX-XXXX
CREATE OR REPLACE FUNCTION generate_random_string(length integer) RETURNS text AS $$
DECLARE
    chars text[] := '{A,B,C,D,E,F,G,H,J,K,L,M,N,P,Q,R,S,T,U,V,W,X,Y,Z,2,3,4,5,6,7,8,9}';
    result text := '';
    i integer := 0;
BEGIN
    FOR i IN 1..length LOOP
        result := result || chars[1+random()*(array_length(chars, 1)-1)];
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION assign_workspace_join_code() RETURNS TRIGGER AS $$
DECLARE
    new_code VARCHAR(10);
    is_unique BOOLEAN := false;
BEGIN
    IF NEW.join_code IS NULL THEN
        WHILE NOT is_unique LOOP
            new_code := generate_random_string(4) || '-' || generate_random_string(4);
            PERFORM 1 FROM workspaces WHERE join_code = new_code;
            IF NOT FOUND THEN is_unique := true; END IF;
        END LOOP;
        NEW.join_code := new_code;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_workspace_join_code ON workspaces;
CREATE TRIGGER trigger_workspace_join_code BEFORE INSERT ON workspaces FOR EACH ROW EXECUTE FUNCTION assign_workspace_join_code();

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) - SIN RECURSIÓN
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Función segura SECURITY DEFINER para obtener el workspace_id sin disparar recursión en RLS
CREATE OR REPLACE FUNCTION get_user_workspace_id() 
RETURNS UUID AS $$
  SELECT workspace_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Políticas para users (Usa la función SECURITY DEFINER para evitar bucle recursivo)
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil y el de su pareja" ON users;
CREATE POLICY "Usuarios pueden ver su propio perfil y el de su pareja" ON users
FOR SELECT USING (
    id = auth.uid() 
    OR (workspace_id IS NOT NULL AND workspace_id = get_user_workspace_id())
);

DROP POLICY IF EXISTS "Usuarios pueden insertar su propio perfil" ON users;
CREATE POLICY "Usuarios pueden insertar su propio perfil" ON users
FOR INSERT WITH CHECK (id = auth.uid() OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON users;
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON users
FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Políticas para workspaces
DROP POLICY IF EXISTS "Usuarios pueden ver su workspace" ON workspaces;
CREATE POLICY "Usuarios pueden ver su workspace" ON workspaces
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear workspace" ON workspaces;
CREATE POLICY "Usuarios autenticados pueden crear workspace" ON workspaces
FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su workspace" ON workspaces;
CREATE POLICY "Usuarios pueden actualizar su workspace" ON workspaces
FOR UPDATE USING (id = get_user_workspace_id());

-- Políticas para goals
DROP POLICY IF EXISTS "Ver metas del espacio" ON goals;
CREATE POLICY "Ver metas del espacio" ON goals 
FOR SELECT USING (workspace_id = get_user_workspace_id());

DROP POLICY IF EXISTS "Gestionar metas del espacio" ON goals;
CREATE POLICY "Gestionar metas del espacio" ON goals 
FOR ALL USING (workspace_id = get_user_workspace_id());

-- Políticas para contributions
DROP POLICY IF EXISTS "Ver abonos del espacio" ON contributions;
CREATE POLICY "Ver abonos del espacio" ON contributions 
FOR SELECT USING (goal_id IN (SELECT id FROM goals WHERE workspace_id = get_user_workspace_id()));

DROP POLICY IF EXISTS "Insertar abonos en metas del espacio" ON contributions;
CREATE POLICY "Insertar abonos en metas del espacio" ON contributions 
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Eliminar propio abono" ON contributions;
CREATE POLICY "Eliminar propio abono" ON contributions 
FOR DELETE USING (user_id = auth.uid());

-- Políticas para incomes
DROP POLICY IF EXISTS "Ver ingresos del espacio" ON incomes;
CREATE POLICY "Ver ingresos del espacio" ON incomes 
FOR SELECT USING (workspace_id = get_user_workspace_id());

DROP POLICY IF EXISTS "Gestionar ingresos del espacio" ON incomes;
CREATE POLICY "Gestionar ingresos del espacio" ON incomes 
FOR ALL USING (workspace_id = get_user_workspace_id());

-- Políticas para expenses
DROP POLICY IF EXISTS "Ver gastos del espacio" ON expenses;
CREATE POLICY "Ver gastos del espacio" ON expenses 
FOR SELECT USING (workspace_id = get_user_workspace_id());

DROP POLICY IF EXISTS "Gestionar gastos del espacio" ON expenses;
CREATE POLICY "Gestionar gastos del espacio" ON expenses 
FOR ALL USING (workspace_id = get_user_workspace_id());

-- Políticas para internal_debts
ALTER TABLE internal_debts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver deudas del espacio" ON internal_debts;
CREATE POLICY "Ver deudas del espacio" ON internal_debts 
FOR SELECT USING (workspace_id = get_user_workspace_id());

DROP POLICY IF EXISTS "Gestionar deudas del espacio" ON internal_debts;
CREATE POLICY "Gestionar deudas del espacio" ON internal_debts 
FOR ALL USING (workspace_id = get_user_workspace_id());

-- Políticas para goal_comments
ALTER TABLE goal_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver comentarios de metas del espacio" ON goal_comments;
CREATE POLICY "Ver comentarios de metas del espacio" ON goal_comments 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM goals g
        WHERE g.id = goal_comments.goal_id
          AND g.workspace_id = get_user_workspace_id()
    )
);

DROP POLICY IF EXISTS "Agregar comentarios a metas del espacio" ON goal_comments;
CREATE POLICY "Agregar comentarios a metas del espacio" ON goal_comments 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM goals g
        WHERE g.id = goal_comments.goal_id
          AND g.workspace_id = get_user_workspace_id()
    )
);

DROP POLICY IF EXISTS "Eliminar comentarios propios" ON goal_comments;
CREATE POLICY "Eliminar comentarios propios" ON goal_comments 
FOR DELETE USING (user_id = auth.uid());

-- ==============================================================================
-- 7. BUCKET DE STORAGE PARA FOTOS DE METAS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'goal-images',
    'goal-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Imágenes de metas son públicas" ON storage.objects;
CREATE POLICY "Imágenes de metas son públicas" ON storage.objects FOR SELECT USING (bucket_id = 'goal-images');

DROP POLICY IF EXISTS "Usuarios autenticados pueden subir imágenes" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir imágenes" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'goal-images');

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar sus imágenes" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden actualizar sus imágenes" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'goal-images') WITH CHECK (bucket_id = 'goal-images');

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar imágenes" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden eliminar imágenes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'goal-images');
