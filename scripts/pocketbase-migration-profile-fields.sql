-- =====================================================
-- MIGRACIÓN POCKETBASE: Agregar campos de perfil extendido
-- Fecha: 2025-11-11 21:26:00
-- Propósito: Habilitar campos adicionales en la colección auth_users
-- =====================================================

-- NOTA IMPORTANTE:
-- Esta migración debe ejecutarse desde el Admin UI de PocketBase
-- o usar la API REST para agregar campos a la colección auth_users

-- =====================================================
-- CAMPOS A AGREGAR EN POCKETBASE ADMIN UI
-- =====================================================

-- 1. Ir a PocketBase Admin UI
-- 2. Navegar a: Collections → auth_users
-- 3. Agregar los siguientes campos:

-- Campo: dni
-- Tipo: Text
-- Nombre: DNI
-- Requerido: Sí
-- Validación: Regex /^[0-9]{7,8}$/
-- Mensaje de error: "El DNI debe contener entre 7 y 8 dígitos numéricos"
-- Valor por defecto: "" (vacío)

-- Campo: phone
-- Tipo: Text
-- Nombre: Teléfono
-- Requerido: No (opcional)
-- Validación: Regex /^[+]?[0-9\s\-\(\)]{10,}$/
-- Mensaje de error: "Formato de teléfono inválido"
-- Valor por defecto: "" (vacío)

-- Campo: professional_id (opcional - para médicos)
-- Tipo: Text
-- Nombre: Matrícula Profesional
-- Requerido: No
-- Validación: Regex /^[A-Z0-9\-]{5,20}$/
-- Mensaje de error: "Formato de matrícula inválido"
-- Valor por defecto: "" (vacío)

-- Campo: specialty (opcional - para médicos)
-- Tipo: Select
-- Nombre: Especialidad Médica
-- Requerido: No
-- Opciones:
--   - Medicina General
--   - Cardiología
--   - Neurología
--   - Pediatría
--   - Ginecología
--   - Traumatología
--   - Medicina Interna
--   - Medicina de Urgencias
--   - Anestesiología
--   - Radiología
--   - Laboratorio
--   - Farmacia
--   - Enfermería
--   - Técnico en Radiología
--   - Técnico en Laboratorio
--   - Administración Hospitalaria
--   - Servicios Generales
--   - Otro

-- Campo: department (opcional)
-- Tipo: Text
-- Nombre: Departamento
-- Requerido: No
-- Validación: Regex /^[A-Za-záéíóúñÑ\s]{2,50}$/
-- Mensaje de error: "El departamento debe tener entre 2 y 50 caracteres"
-- Valor por defecto: "" (vacío)

-- Campo: position (opcional)
-- Tipo: Select
-- Nombre: Cargo
-- Requerido: No
-- Opciones:
--   - Jefe de Servicio
--   - Médico Senior
--   - Médico Residente
--   - Enfermero/a
--   - Técnico
--   - Administrativo
--   - Servicios Generales
--   - Otro

-- =====================================================
-- CONFIGURACIÓN DE API RULES PARA CAMPOS DE PERFIL
-- =====================================================

-- En la colección auth_users, configurar las siguientes reglas:

-- List/Search Rule:
-- @request.auth.id != ""

-- View Rule:
-- @request.auth.id = @collection.id

-- Create Rule:
-- @request.auth.id != ""

-- Update Rule:
-- @request.auth.id = @collection.id || @request.auth.role.name = "superadmin" || @request.auth.role.name = "admin"

-- Delete Rule:
-- @request.auth.role.name = "superadmin" || @request.auth.role.name = "admin"

-- =====================================================
-- VALIDACIÓN ADICIONAL
-- =====================================================

-- Verificar que los campos estén configurados correctamente:
-- 1. Los campos aparezcan en el formulario de edición de auth_users
-- 2. Los campos sean visibles y editables por el usuario en su perfil
-- 3. Las validaciones funcionen correctamente
-- 4. Los permisos de actualización sean correctos

-- =====================================================
-- TESTING DE LA MIGRACIÓN
-- =====================================================

-- Después de aplicar la migración, probar:
-- 1. Crear un nuevo usuario con los campos opcionales
-- 2. Editar usuario existente agregando DNI y teléfono
-- 3. Verificar que las validaciones funcionan
-- 4. Probar que solo el usuario puede editar sus propios campos
-- 5. Verificar que los admins pueden editar cualquier campo

-- =====================================================
-- COMANDOS PARA VERIFICAR EN POCKETBASE
-- =====================================================

-- Una vez aplicados los campos, pueden consultarse via:
-- GET /api/collections/auth_users/records
-- GET /api/collections/auth_users/records/{id}

-- Para actualizar un perfil con todos los campos:
-- PATCH /api/collections/auth_users/records/{id}
-- {
--   "firstName": "Juan",
--   "lastName": "Pérez",
--   "email": "juan@hospital.com",
--   "dni": "12345678",
--   "phone": "+54 351 123 4567",
--   "professional_id": "MP-12345",
--   "specialty": "Cardiología",
--   "department": "Cardiología",
--   "position": "Médico Senior"
-- }

-- =====================================================
-- ROLLBACK (Si es necesario)
-- =====================================================

-- Para remover los campos si algo sale mal:
-- 1. Ir a PocketBase Admin UI
-- 2. Collections → auth_users
-- 3. Eliminar cada campo agregado manualmente
-- 4. Confirmar eliminación

-- =====================================================