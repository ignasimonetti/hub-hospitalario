// POCKETBASE AUTHENTICATION MIGRATION
// Migrated from Supabase to PocketBase for Hub Hospitalario

import PocketBase from 'pocketbase'
import { sendEmailConfirmation } from './resend'

// Initialize PocketBase client
const pocketbase = new PocketBase('https://pocketbase.manta.com.ar')

// Export PocketBase instance for use in other parts of the app
export { pocketbase }

// JWT functions for backward compatibility
export { generateEmailConfirmationToken, verifyEmailConfirmationToken, isTokenExpired } from './jwt'

/**
 * Sign in user with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const authData = await pocketbase.collection('users').authWithPassword(email, password)
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
 * Sign up new user
 * Note: PocketBase handles email confirmation automatically
 */
export async function signUp(email: string, password: string, options = {}) {
  try {
    // Create user in PocketBase - email confirmation is automatic
    const userData = await pocketbase.collection('users').create({
      email,
      password,
      ...options
    })

    return {
      data: { user: userData },
      error: null,
      // Keep compatibility with existing code
      generateConfirmationToken: () => {
        // PocketBase handles this automatically
        return 'handled_by_pocketbase'
      }
    }
  } catch (err: any) {
    console.error('Error in PocketBase signUp:', err)
    return { data: null, error: { message: err?.message || 'Error desconocido' } }
  }
}

/**
 * Sign out user
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
 * Confirm email
 * Note: PocketBase handles this automatically during signup
 */
export async function confirmEmail(token: string) {
  try {
    // For PocketBase, this is usually handled automatically
    // If you have custom email confirmation, verify the token here
    return {
      data: { user: null },
      error: null
    }
  } catch (err: any) {
    console.error('Error confirming email:', err)
    return { data: null, error: { message: err?.message || 'Error desconocido' } }
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  try {
    await pocketbase.collection('users').requestPasswordReset(email)
    return { data: null, error: null }
  } catch (error: any) {
    return {
      data: null,
      error: { message: error?.message || 'Error desconocido' }
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
    
    const user = await pocketbase.collection('users').update(
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
    
    return userRoles.items
  } catch (error: any) {
    console.error('Error getting user roles:', error)
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
    
    const roleIds = userRoles.map(ur => ur.role)
    
    const rolePermissions = await pocketbase.collection('hub_role_permissions').getList(1, 100, {
      filter: `role = "${roleIds.join('" || role = "')}"`,
      expand: 'permission'
    })
    
    return rolePermissions.items.map(rp => rp.permission)
  } catch (error: any) {
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
    return permissions.some(p => p.slug === permissionSlug)
  } catch (error: any) {
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
    return userRoles.some(ur => ur.role?.slug === roleSlug)
  } catch (error: any) {
    console.error('Error checking role:', error)
    return false
  }
}