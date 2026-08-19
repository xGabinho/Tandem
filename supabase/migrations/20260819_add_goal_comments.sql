-- ==============================================================================
-- MIGRACIÓN INCREMENTAL: Tabla de Comentarios y Mensajes en Metas (Goal Comments)
-- Permite a la pareja dejarse mensajes de apoyo, notas y motivación en cada meta.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS goal_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE goal_comments ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Ver comentarios de metas del mismo espacio
CREATE POLICY "Users can view comments of goals in their workspace"
    ON goal_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM goals g
            JOIN users u ON u.workspace_id = g.workspace_id
            WHERE g.id = goal_comments.goal_id
              AND u.id = auth.uid()
        )
    );

-- 2. INSERT: Agregar comentario a metas del mismo espacio
CREATE POLICY "Users can add comments to goals in their workspace"
    ON goal_comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM goals g
            JOIN users u ON u.workspace_id = g.workspace_id
            WHERE g.id = goal_comments.goal_id
              AND u.id = auth.uid()
        )
    );

-- 3. DELETE: Eliminar comentario propio
CREATE POLICY "Users can delete their own comments"
    ON goal_comments FOR DELETE
    USING (user_id = auth.uid());
