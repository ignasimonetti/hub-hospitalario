import PocketBase from 'pocketbase'
// sendEmailConfirmation no se usa aquí, se mantiene en apps/hub/src/lib/resend.ts

// Inicializar el cliente de PocketBase - ESTA ES LA ÚNICA INSTANCIA
export const pocketbase = new PocketBase('https://pocketbase.manta.com.ar')

// Exportar instancia de PocketBase para usar en otras partes de la app
// export { pocketbase } // Ya se exporta arriba

// Funciones JWT para compatibilidad con versiones anteriores
export { generateEmailConfirmationToken, verifyEmailConfirmationToken, isTokenExpired } from './jwt'

/**
 * Iniciar sesión de usuario con email y contraseña
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const authData = await pocketbase.collection('auth_users').authWithPassword(email, password)
    return {
      data: { user: authData },
      error: null
    }
  } catch (error: any) {
    return {
      data: null,
      error: { message: error?.message || 'Error desconocido' }
    }
  }
}

/**
 * Registrar nuevo usuario
 * Nota: PocketBase maneja la confirmación de email automáticamente
 */
export async function signUp(email: string, password: string, options = {}) {
  try {
    // Crear usuario en PocketBase - la confirmación de email es automática
    const userData = await pocketbase.collection('auth_users').create({
      email,
      password,
      ...options
    })

    return {
      data: { user: userData },
      error: null,
      // Mantener compatibilidad con el código existente
      generateConfirmationToken: () => {
        // PocketBase lo maneja automáticamente
        return 'handled_by_pocketbase'
      }
    }
  } catch (err: any) {
    console.error('Error en PocketBase signUp:', err)
    return { data: null, error: { message: err?.message || 'Error desconocido' } }
  }
}

/**
 * Cerrar sesión de usuario
 */
export async function signOut() {
  try {
    await pocketbase.authStore.clear()
    return { error: null }
  } catch (error: any) {
    return { error: { message: error?.message || 'Error desconocido' } }
  }
}

/**
 * Confirmar email
 * Nota: PocketBase lo maneja automáticamente durante el registro
 */
export async function confirmEmail(token: string) {
  try {
    // Para PocketBase, esto se maneja automáticamente
    // Si tienes una confirmación de email personalizada, verifica el token aquí
    return {
      data: { user: null },
      error: null
    }
  } catch (err: any) {
    console.error('Error confirmando email:', err)
    return { data: null, error: { message: err?.message || 'Error desconocido' } }
  }
}

/**
 * Restablecer contraseña
 */
export async function resetPassword(email: string) {
  try {
    await pocketbase.collection('auth_users').requestPasswordReset(email)
    return { data: null, error: null }
  } catch (error: any) {
    return {
      data: null,
      error: { message: error?.message || 'Error desconocido' }
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
    
    const user = await pocketbase.collection('auth_users').update(
      pocketbase.authStore.model.id,
      { password: newPassword }
    )
    
    return { data: { user }, error: null }
  } catch (error: any) {
    return {
      data: null,
      error: { message: error?.message || 'Error desconocido' }
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
    
    return userRoles.items
  } catch (error: any) {
    console.error('Error obteniendo roles de usuario:', error)
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
    
    const roleIds = userRoles.map(ur => ur.role)
    
    const rolePermissions = await pocketbase.collection('hub_role_permissions').getList(1, 100, {
      filter: `role = "${roleIds.join('" || role = "')}"`,
      expand: 'permission'
    })
    
    return rolePermissions.items.map(rp => rp.permission)
  } catch (error: any) {
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
    return permissions.some(p => p.slug === permissionSlug)
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
    return userRoles.some(ur => ur.role?.slug === roleSlug)
  } catch (error: any) {
    console.error('Error verificando rol:', error)
    return false
  }
}