// HUB HOSPITALARIO - HOOK DE PERMISOS Y ROLES
// Hook para verificar permisos y roles en componentes de la UI

import { useState, useEffect, useCallback } from 'react'
import { pocketbase } from '@/lib/auth'

export interface Permission {
  id: string
  name: string
  slug: string
  description: string
  category: string
  module: string
  action: string
  resource: string
}

export interface Role {
  id: string
  name: string
  slug: string
  description: string
  level: number
  is_system: boolean
  is_default: boolean
}

export interface UserRole {
  id: string
  user: string
  role: Role
  tenant: string
  expand?: {
    role?: Role
    tenant?: any
  }
}

export interface UserPermission {
  id: string
  name: string
  slug: string
  description: string
  category: string
  module: string
  action: string
  resource: string
}

/**
 * Hook principal para verificar permisos del usuario actual
 */
export function usePermissions(tenantId?: string) {
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPermissions = useCallback(async () => {
    if (!pocketbase.authStore.model) {
      setPermissions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const userPermissions = await getCurrentUserPermissions(tenantId)
      setPermissions(userPermissions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading permissions')
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  // Verificar si el usuario tiene un permiso específico
  const hasUserPermission = useCallback((permissionSlug: string) => {
    return permissions.some(p => p.slug === permissionSlug)
  }, [permissions])

  // Verificar si el usuario tiene cualquier permiso de una lista
  const hasAnyPermission = useCallback((permissionSlugs: string[]) => {
    return permissionSlugs.some(slug => hasUserPermission(slug))
  }, [permissions, hasUserPermission])

  // Verificar si el usuario tiene todos los permisos de una lista
  const hasAllPermissions = useCallback((permissionSlugs: string[]) => {
    return permissionSlugs.every(slug => hasUserPermission(slug))
  }, [permissions, hasUserPermission])

  // Obtener permisos por categoría
  const getPermissionsByCategory = useCallback((category: string) => {
    return permissions.filter(p => p.category === category)
  }, [permissions])

  return {
    permissions,
    loading,
    error,
    hasPermission: hasUserPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionsByCategory,
    reload: loadPermissions
  }
}

/**
 * Hook para verificar roles del usuario actual
 */
export function useRoles(tenantId?: string) {
  const [roles, setRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRoles = useCallback(async () => {
    if (!pocketbase.authStore.model) {
      setRoles([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const userRoles = await getCurrentUserRoles(tenantId)
      setRoles(userRoles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading roles')
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  // Verificar si el usuario tiene un rol específico
  const hasUserRole = useCallback((roleIdentifier: string) => {
    // 1. Acceso Universal para Super Admin (Flag en Usuario)
    if (pocketbase.authStore.model?.is_super_admin) return true;

    return roles.some(r => {
      const role = r.expand?.role;
      if (!role) return false;

      // 2. Coincidencia exacta de Slug
      if (role.slug === roleIdentifier) return true;

      // 3. Manejo de variaciones comunes (superadmin vs super_admin)
      if (roleIdentifier === 'superadmin' && role.slug === 'super_admin') return true;

      // 4. Fallback: Coincidencia por Nombre (si el slug falla o no existe)
      const normalizedName = role.name.toLowerCase();
      const search = roleIdentifier.toLowerCase();

      // "Editor Blog" vs "editor_blog"
      if (search.includes('_')) {
        if (normalizedName === search.replace('_', ' ')) return true;
      }

      // Coincidencia directa de nombre
      if (normalizedName === search) return true;

      // Casos especiales conocidos
      if (search === 'superadmin' && (normalizedName.includes('admin') || normalizedName.includes('super'))) return true;
      if (search === 'editor_blog' && normalizedName.includes('editor')) return true;

      return false;
    })
  }, [roles])

  // Verificar si el usuario tiene cualquier rol de una lista
  const hasAnyRole = useCallback((roleSlugs: string[]) => {
    return roleSlugs.some(slug => hasUserRole(slug))
  }, [roles, hasUserRole])

  // Obtener el nivel más alto del usuario
  const getHighestRoleLevel = useCallback(() => {
    if (roles.length === 0) return Infinity
    return Math.min(...roles.map(r => r.expand?.role?.level || Infinity))
  }, [roles])

  return {
    roles,
    loading,
    error,
    hasRole: hasUserRole,
    hasAnyRole,
    getHighestRoleLevel,
    reload: loadRoles
  }
}

/**
 * Hook combinado para permisos y roles
 */
export function useAuth(tenantId?: string) {
  const permissions = usePermissions(tenantId)
  const roles = useRoles(tenantId)

  return {
    ...permissions,
    ...roles,
    isLoading: permissions.loading || roles.loading,
    hasError: permissions.error || roles.error
  }
}

/**
 * Helper functions - estas deberían estar en el core pero las incluimos aquí para conveniencia
 */
async function getCurrentUserRoles(tenantId?: string): Promise<any[]> {
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
}

async function getCurrentUserPermissions(tenantId?: string): Promise<any[]> {
  const userRoles = await getCurrentUserRoles(tenantId)
  if (!userRoles.length) return []

  const roleIds = userRoles.map(ur => ur.role)

  const rolePermissions = await pocketbase.collection('hub_role_permissions').getList(1, 100, {
    filter: `role = "${roleIds.join('" || role = "')}"`,
    expand: 'permission'
  })

  return rolePermissions.items.map(rp => rp.expand?.permission)
}