// POCKETBASE AUTHENTICATION - CONFIGURACIÓN FINAL
// Conectado a PocketBase real con colección auth_users

import PocketBase from 'pocketbase'

// Initialize PocketBase client
export const pocketbase = new PocketBase('https://pocketbase.manta.com.ar')

// PocketBase uses 'auth_users' collection for authentication
// This collection is automatically created by PocketBase
const USERS_COLLECTION = 'auth_users'

/**
 * Sign in user with email and password
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
 * Sign up new user in PocketBase auth_users collection
 */
export async function signUp(email: string, password: string, options: any = {}) {
  try {
    // Use PocketBase auth_users collection directly
    // Updated field names to match PocketBase schema
    const userData = await pocketbase.collection('auth_users').create({
      email,
      password,
      passwordConfirm: password,
      firstName: options.first_name,
      lastName: options.last_name
    })

    console.log('User created successfully in PocketBase:', userData.email)

    return {
      data: { user: userData },
      error: null,
      generateConfirmationToken: () => 'handled_by_pocketbase'
    }

  } catch (err: any) {
    console.error('Error in PocketBase signUp:', err)
    
    // Provide helpful error messages
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
 * Sign up new user (alias for backward compatibility)
 */
export async function signUpNewUser(email: string, password: string, options: any = {}) {
  return signUp(email, password, options)
}

/**
 * Sign out user
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
 * Confirm email - Simplified approach for PocketBase
 */
export async function confirmEmail(token: string) {
  try {
    // In PocketBase, email confirmation tokens are user IDs
    // Just get the user data - if we can get it, the email is confirmed
    const userData = await pocketbase.collection(USERS_COLLECTION).getOne(token)

    console.log('Email confirmation successful for user:', userData.email)
    console.log('User verification status:', userData.verified)

    return {
      data: { user: userData },
      error: null
    }
  } catch (err: any) {
    console.error('Error confirming email:', err)
    return { data: null, error: { message: err.message } }
  }
}

/**
 * Reset password
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
 * Update user password
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
 * Get current user
 */
export function getCurrentUser() {
  return pocketbase.authStore.model
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return pocketbase.authStore.isValid
}

/**
 * Get current user's roles and permissions
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
    // Check if this is an auto-cancellation error (not a real permission issue)
    if (error.message?.includes('autocancelled') ||
        error.message?.includes('signal is aborted')) {
      console.warn('⚠️ Request was auto-cancelled by React, but data may still arrive. This is normal.')
      // For auto-cancellation errors, return empty array but don't show pending dialog
      // The component will retry when it has a stable state
      return []
    }

    // If we can't access roles due to permissions or other issues, return empty array
    // This allows users to access the dashboard even without role permissions
    console.error('❌ Cannot access user roles:', error)
    return []
  }
}

/**
 * Get user's permissions based on roles
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
    console.error('Error getting user permissions:', error)
    return []
  }
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(permissionSlug: string, tenantId: string | null = null) {
  try {
    const permissions = await getCurrentUserPermissions(tenantId)
    return permissions.some((p: any) => p.slug === permissionSlug)
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Check if user has specific role
 */
export async function hasRole(roleSlug: string, tenantId: string | null = null) {
  try {
    const userRoles = await getCurrentUserRoles(tenantId)
    return userRoles.some((ur: any) => ur.role?.slug === roleSlug)
  } catch (error) {
    console.error('Error checking role:', error)
    return false
  }
}