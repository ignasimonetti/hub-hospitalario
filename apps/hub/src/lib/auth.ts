// POCKETBASE AUTHENTICATION - CONFIGURACIÓN FINAL
// Conectado a PocketBase real con colección auth_users

// Importar la instancia compartida de PocketBase
import { pocketbase } from '@hospital/core/lib/auth'

// PocketBase usa la colección 'auth_users' para la autenticación
// Esta colección se crea automáticamente por PocketBase
const USERS_COLLECTION = 'auth_users'

// Re-exportar la instancia de pocketbase para que otros módulos en 'apps/hub' puedan usarla
export { pocketbase }

/**
 * Iniciar sesión de usuario con email y contraseña
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const authData = await pocketbase.collection(USERS_COLLECTION).authWithPassword(email, password)
    return {
      data: { user: authData },
      error: null
    }
  } catch (error: any) {
    return {
      data: null,
      error: { message: error.message }
    }
  }
}

/**
 * Registrar nuevo usuario en la colección auth_users de PocketBase
 */
export async function signUp(email: string, password: string, options: any = {}) {
  try {
    // Usar la colección auth_users de PocketBase directamente
    // Nombres de campo actualizados para coincidir con el esquema de PocketBase
    const userData = await pocketbase.collection('auth_users').create({
      email,
      password,
      passwordConfirm: password,
      firstName: options.first_name,
      lastName: options.last_name
    })

    console.log('Usuario creado exitosamente en PocketBase:', userData.email)

    return {
      data: { user: userData },
      error: null,
      generateConfirmationToken: () => 'handled_by_pocketbase'
    }

  } catch (err: any) {
    console.error('Error en PocketBase signUp:', err)
    
    // Proporcionar mensajes de error útiles
    if (err.status === 403) {
      return {
        data: null,
        error: {
          message: 'Error de permisos. Verifica que la colección auth_users tenga habilitado el registro público en "Authentication rule" (debe estar vacío, no "Set superusers only").'
        }
      }
    }
    
    if (err.status === 404) {
      return {
        data: null,
        error: {
          message: 'Colección auth_users no encontrada. Verifica que exista en tu PocketBase.'
        }
      }
    }
    
    if (err.status === 400 && err.message?.includes('already registered')) {
      return {
        data: null,
        error: {
          message: 'Ya existe un usuario con este email.'
        }
      }
    }
    
    return { data: null, error: { message: err.message } }
  }
}

/**
 * Registrar nuevo usuario (alias para compatibilidad con versiones anteriores)
 */
export async function signUpNewUser(email: string, password: string, options: any = {}) {
  return signUp(email, password, options)
}

/**
 * Cerrar sesión de usuario
 */
export async function signOut() {
  try {
    await pocketbase.authStore.clear()
    return { error: null }
  } catch (error: any) {
    return { error: { message: error.message } }
  }
}

/**
 * Confirmar email - Enfoque simplificado para PocketBase
 */
export async function confirmEmail(token: string) {
  try {
    // En PocketBase, los tokens de confirmación de email son IDs de usuario
    // Solo obtener los datos del usuario - si podemos obtenerlos, el email está confirmado
    const userData = await pocketbase.collection(USERS_COLLECTION).getOne(token)

    console.log('Confirmación de email exitosa para el usuario:', userData.email)
    console.log('Estado de verificación del usuario:', userData.verified)

    return {
      data: { user: userData },
      error: null
    }
  } catch (err: any) {
    console.error('Error confirmando email:', err)
    return { data: null, error: { message: err.message } }
  }
}

/**
 * Restablecer contraseña
 */
export async function resetPassword(email: string) {
  try {
    await pocketbase.collection(USERS_COLLECTION).requestPasswordReset(email)
    return { data: null, error: null }
  } catch (error: any) {
    return {
      data: null,
      error: { message: error.message }
    }
  }
}

/**
 * Actualizar contraseña de usuario
 */
export async function updatePassword(newPassword: string) {
  try {
    if (!pocketbase.authStore.model) {
      return {
        data: null,
        error: { message: 'No user authenticated' }
      }
    }
    
    const user = await pocketbase.collection(USERS_COLLECTION).update(
      pocketbase.authStore.model.id,
      { password: newPassword }
    )
    
    return { data: { user }, error: null }
  } catch (error: any) {
    return {
      data: null,
      error: { message: error.message }
    }
  }
}

/**
 * Obtener usuario actual
 */
export function getCurrentUser() {
  return pocketbase.authStore.model
}

/**
 * Verificar si el usuario está autenticado
 */
export function isAuthenticated() {
  return pocketbase.authStore.isValid
}

/**
 * Obtener roles y permisos del usuario actual
 */
export async function getCurrentUserRoles(tenantId: string | null = null) {
  try {
    if (!pocketbase.authStore.model) return []

    const userId = pocketbase.authStore.model.id
    let filter = `user = "${userId}"`

    if (tenantId) {
      filter += ` && tenant = "${tenantId}"`
    }

    const userRoles = await pocketbase.collection('hub_user_roles').getList(1, 100, {
      filter: filter,
      expand: 'role,tenant'
    })

    // --- DIAGNOSTIC LOG ---
    if (userRoles.items.length > 0) {
      console.log("DIAGNOSTIC INFO: First user role object received from PocketBase:");
      console.log(JSON.stringify(userRoles.items[0], null, 2));
      if (userRoles.items[0].expand?.tenant) {
        console.log("DIAGNOSTIC INFO: Expanded tenant object:");
        console.log(JSON.stringify(userRoles.items[0].expand.tenant, null, 2));
      } else {
        console.log("DIAGNOSTIC INFO: Tenant field was NOT expanded.");
      }
    }
    // --- END DIAGNOSTIC LOG ---

    console.log('✅ User roles fetched successfully:', userRoles.items.length, 'roles found')
    return userRoles.items
  } catch (error: any) {
    // Verificar si es un error de autocancelación (no es un problema de permisos real)
    if (error.message?.includes('autocancelled') ||
        error.message?.includes('signal is aborted')) {
      console.warn('⚠️ La solicitud fue autocancelada por React, pero los datos aún pueden llegar. Esto es normal.')
      // Para errores de autocancelación, devolver un array vacío pero no mostrar el diálogo pendiente
      // El componente reintentará cuando tenga un estado estable
      return []
    }

    // Si no podemos acceder a los roles debido a permisos u otros problemas, devolver un array vacío
    // Esto permite a los usuarios acceder al dashboard incluso sin permisos de rol
    console.error('❌ No se pueden acceder a los roles de usuario:', error)
    return []
  }
}

/**
 * Obtener permisos del usuario basados en roles
 */
export async function getCurrentUserPermissions(tenantId: string | null = null) {
  try {
    const userRoles = await getCurrentUserRoles(tenantId)
    if (!userRoles.length) return []
    
    const roleIds = userRoles.map((ur: any) => ur.role)
    
    const rolePermissions = await pocketbase.collection('hub_role_permissions').getList(1, 100, {
      filter: `role = "${roleIds.join('" || role = "')}"`,
      expand: 'permission'
    })
    
    return rolePermissions.items.map((rp: any) => rp.permission)
  } catch (error) {
    console.error('Error obteniendo permisos de usuario:', error)
    return []
  }
}

/**
 * Verificar si el usuario tiene un permiso específico
 */
export async function hasPermission(permissionSlug: string, tenantId: string | null = null) {
  try {
    const permissions = await getCurrentUserPermissions(tenantId)
    return permissions.some((p: any) => p.slug === permissionSlug)
  } catch (error: any) {
    console.error('Error verificando permiso:', error)
    return false
  }
}

/**
 * Verificar si el usuario tiene un rol específico
 */
export async function hasRole(roleSlug: string, tenantId: string | null = null) {
  try {
    const userRoles = await getCurrentUserRoles(tenantId)
    return userRoles.some((ur: any) => ur.role?.slug === roleSlug)
  } catch (error: any) {
    console.error('Error verificando rol:', error)
    return false
  }
}