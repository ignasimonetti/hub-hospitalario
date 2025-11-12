-- HUB HOSPITALARIO - CONFIGURACIÓN DE LÍMITES DE SESIÓN
-- Script para configurar límites de sesión por rol en Supabase

-- =====================================================
-- CONFIGURACIÓN DE SESIONES POR ROL
-- =====================================================

-- Agregar columna de configuración de sesión a la tabla de roles
ALTER TABLE hub_roles
ADD COLUMN IF NOT EXISTS session_absolute_timeout INTERVAL DEFAULT '8 hours',
ADD COLUMN IF NOT EXISTS session_idle_timeout INTERVAL DEFAULT '2 hours',
ADD COLUMN IF NOT EXISTS session_warning_time INTERVAL DEFAULT '5 minutes';

-- Configuración por defecto para roles estándar
UPDATE hub_roles
SET
  session_absolute_timeout = '8 hours',
  session_idle_timeout = '2 hours',
  session_warning_time = '5 minutes'
WHERE name NOT IN ('medico', 'medical_senior');

-- Configuración especial para médicos (turnos largos)
UPDATE hub_roles
SET
  session_absolute_timeout = '12 hours',
  session_idle_timeout = '3 hours',
  session_warning_time = '10 minutes'
WHERE name IN ('medico', 'medical_senior');

-- Configuración restrictiva para administrativos
UPDATE hub_roles
SET
  session_absolute_timeout = '8 hours',
  session_idle_timeout = '30 minutes',
  session_warning_time = '2 minutes'
WHERE name IN ('admin_staff', 'basic_user');

-- =====================================================
-- CONFIGURACIÓN DE SESIONES POR USUARIO
-- =====================================================

-- Agregar campos de sesión personalizada a perfiles de usuario
ALTER TABLE hub_user_profiles
ADD COLUMN IF NOT EXISTS custom_session_timeout INTERVAL,
ADD COLUMN IF NOT EXISTS custom_idle_timeout INTERVAL,
ADD COLUMN IF NOT EXISTS session_auto_extend BOOLEAN DEFAULT true;

-- =====================================================
-- POLÍTICAS RLS PARA CONFIGURACIÓN DE SESIÓN
-- =====================================================

-- Los usuarios solo pueden ver su propia configuración de sesión
CREATE POLICY "Users can view own session config" ON hub_user_profiles
FOR SELECT USING (auth.uid()::text = id);

-- Los usuarios pueden actualizar su propia configuración de sesión
CREATE POLICY "Users can update own session config" ON hub_user_profiles
FOR UPDATE USING (auth.uid()::text = id)
WITH CHECK (
  auth.uid()::text = id AND
  -- Validar límites razonables
  (custom_session_timeout IS NULL OR custom_session_timeout <= INTERVAL '24 hours') AND
  (custom_idle_timeout IS NULL OR custom_idle_timeout <= INTERVAL '8 hours')
);

-- =====================================================
-- FUNCIÓN PARA OBTENER CONFIGURACIÓN DE SESIÓN
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_session_config(user_id UUID)
RETURNS TABLE (
  absolute_timeout INTERVAL,
  idle_timeout INTERVAL,
  warning_time INTERVAL,
  auto_extend BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(up.custom_session_timeout, r.session_absolute_timeout, INTERVAL '8 hours') as absolute_timeout,
    COALESCE(up.custom_idle_timeout, r.session_idle_timeout, INTERVAL '2 hours') as idle_timeout,
    COALESCE(r.session_warning_time, INTERVAL '5 minutes') as warning_time,
    COALESCE(up.session_auto_extend, true) as auto_extend
  FROM hub_user_profiles up
  LEFT JOIN hub_user_roles ur ON up.id = ur.user_id
  LEFT JOIN hub_roles r ON ur.role_id = r.id
  WHERE up.id = user_id
  ORDER BY r.level DESC
  LIMIT 1;
END;
$$;

-- =====================================================
-- LOGGING DE SESIONES
-- =====================================================

-- Tabla para logging de eventos de sesión
CREATE TABLE IF NOT EXISTS hub_session_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout', 'extend', 'timeout', 'warning_shown')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Políticas RLS para logs de sesión
ALTER TABLE hub_session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session logs" ON hub_session_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert session logs" ON hub_session_logs
FOR INSERT WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_session_logs_user_created ON hub_session_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_logs_event_type ON hub_session_logs(event_type);

-- =====================================================
-- FUNCIÓN PARA LOGGING DE SESIONES
-- =====================================================

CREATE OR REPLACE FUNCTION log_session_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO hub_session_logs (user_id, event_type, metadata)
  VALUES (p_user_id, p_event_type, p_metadata);
END;
$$;

-- =====================================================
-- CONFIGURACIÓN INICIAL DE DATOS
-- =====================================================

-- Insertar configuración por defecto si no existe
INSERT INTO hub_roles (id, name, display_name, level, session_absolute_timeout, session_idle_timeout, session_warning_time)
VALUES
  ('role-medico', 'medico', 'Médico', 6, INTERVAL '12 hours', INTERVAL '3 hours', INTERVAL '10 minutes'),
  ('role-medical-senior', 'medical_senior', 'Médico Senior', 7, INTERVAL '12 hours', INTERVAL '3 hours', INTERVAL '10 minutes'),
  ('role-nursing', 'nursing_staff', 'Personal de Enfermería', 5, INTERVAL '8 hours', INTERVAL '1 hour', INTERVAL '5 minutes'),
  ('role-admin', 'admin_staff', 'Personal Administrativo', 4, INTERVAL '8 hours', INTERVAL '30 minutes', INTERVAL '2 minutes')
ON CONFLICT (id) DO UPDATE SET
  session_absolute_timeout = EXCLUDED.session_absolute_timeout,
  session_idle_timeout = EXCLUDED.session_idle_timeout,
  session_warning_time = EXCLUDED.session_warning_time;

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE hub_session_logs IS 'Log de eventos de sesión para auditoría y monitoreo';
COMMENT ON FUNCTION get_user_session_config(UUID) IS 'Obtiene la configuración de sesión personalizada para un usuario';
COMMENT ON FUNCTION log_session_event(UUID, TEXT, JSONB) IS 'Registra eventos de sesión para auditoría';

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar configuración aplicada
SELECT
  r.name,
  r.session_absolute_timeout,
  r.session_idle_timeout,
  r.session_warning_time
FROM hub_roles r
WHERE r.session_absolute_timeout IS NOT NULL
ORDER BY r.level DESC;