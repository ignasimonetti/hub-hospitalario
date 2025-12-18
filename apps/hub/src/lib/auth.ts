// POCKETBASE AUTHENTICATION - CONFIGURACIÓN FINAL
// Conectado a PocketBase real con colección auth_users

// Configuración de PocketBase local
import PocketBase from 'pocketbase';
import Cookies from 'js-cookie';

// Crear instancia local de PocketBase
const pocketbase = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090');

// PocketBase usa la colección 'auth_users' para la autenticación
// Esta colección se crea automáticamente por PocketBase
const USERS_COLLECTION = 'auth_users'

// Sincronizar el estado de autenticación con las cookies para el servidor (Next.js)
const syncCookie = () => {
  if (typeof document !== 'undefined') {
    if (pocketbase.authStore.isValid) {
      document.cookie = pocketbase.authStore.exportToCookie({ httpOnly: false });
    } else {
      // Para borrar, necesitamos establecer la fecha de expiración en el pasado
      document.cookie = 'pb_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  }
};

pocketbase.authStore.onChange(() => {
  syncCookie();
});

// Sincronizar inmediatamente al cargar (por si el usuario ya estaba logueado)
syncCookie();

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
      // Mantener compatibilidad con el código existente
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
 * Confirmar email - Llama a nuestra API interna que usa el Admin Client
 */
export async function confirmEmail(token: string) {
  try {
    const response = await fetch('/api/auth/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al confirmar email');
    }

    return {
      data: { user: data.user },
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
    if (!pocketbase.authStore.model) {
      return [];
    }

    const userId = pocketbase.authStore.model.id;
    let filter = `user = "${userId}"`;

    if (tenantId) {
      filter += ` && tenant = "${tenantId}"`;
    }

    const userRoles = await pocketbase.collection('hub_user_roles').getList(1, 100, {
      filter: filter,
      expand: 'role,tenant'
    });

    return userRoles.items;
  } catch (error: any) {
    if (error.message?.includes('autocancelled') ||
      error.message?.includes('signal is aborted')) {
      console.warn('⚠️ La solicitud fue autocancelada por React, pero los datos aún pueden llegar. Esto es normal.');
      return [];
    }
    console.error('❌ Error al acceder a los roles de usuario:', error);
    // Log the full error response if available from PocketBase
    if (error.response) {
      console.error('PocketBase Error Response:', JSON.stringify(error.response, null, 2));
    }
    return [];
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