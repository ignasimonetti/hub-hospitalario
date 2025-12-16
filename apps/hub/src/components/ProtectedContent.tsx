'use client';

// HUB HOSPITALARIO - COMPONENTES CON PROTECCIÓN DE PERMISOS
// Versión simplificada y funcional

import { ReactNode } from 'react'
import { usePermissions, useRoles } from '@/hooks/usePermissions'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ShieldX, Lock } from 'lucide-react'

/**
 * Componente principal que protege contenido basado en permisos
 */
export function ProtectedContent({
  permission,
  permissions = [],
  role,
  roles = [],
  tenantId,
  children,
  fallback
}: {
  permission?: string
  permissions?: string[]
  role?: string
  roles?: string[]
  tenantId?: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const { hasPermission, loading: loadingPermissions } = usePermissions(tenantId)
  const { hasRole, hasAnyRole, loading: loadingRoles } = useRoles(tenantId)

  if (loadingPermissions || loadingRoles) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2">Verificando permisos...</span>
      </div>
    )
  }

  // Verificar permiso específico
  if (permission && !hasPermission(permission)) {
    return fallback || <DefaultNoPermissionMessage />
  }

  // Verificar múltiples permisos
  if (permissions.length > 0 && !permissions.some((p: string) => hasPermission(p))) {
    return fallback || <DefaultNoPermissionMessage />
  }

  // Verificar rol específico
  if (role && !hasRole(role)) {
    return fallback || <DefaultNoPermissionMessage />
  }

  // Verificar múltiples roles (acceso si tiene AL MENOS UNO de los roles listados)
  if (roles.length > 0 && !hasAnyRole(roles)) {
    return fallback || <DefaultNoPermissionMessage />
  }

  return <>{children}</>
}

/**
 * Botón protegido que solo se muestra si el usuario tiene el permiso
 */
export function ProtectedButton({
  permission,
  permissions = [],
  children,
  className,
  variant = "default",
  size = "default",
  disabled,
  onClick,
  tenantId,
  ...props
}: any) {
  const { hasPermission, loading } = usePermissions(tenantId)

  if (loading) {
    return null
  }

  let hasAccess = true

  if (permission && !hasPermission(permission)) {
    hasAccess = false
  }

  if (permissions.length > 0 && !permissions.some((p: string) => hasPermission(p))) {
    hasAccess = false
  }

  if (!hasAccess) {
    return null
  }

  return (
    <Button
      className={className}
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  )
}

/**
 * Hook helper para usar con componentes existentes
 */
export function useCanAccess(permission: string, tenantId?: string) {
  const { hasPermission, loading } = usePermissions(tenantId)

  return {
    canAccess: hasPermission(permission),
    loading,
    check: (perm: string) => hasPermission(perm)
  }
}

/**
 * Mensaje por defecto cuando no hay permiso
 */
function DefaultNoPermissionMessage() {
  return (
    <Alert className="mt-4">
      <Lock className="h-4 w-4" />
      <AlertTitle>Acceso denegado</AlertTitle>
      <AlertDescription>
        No tienes permisos para acceder a este contenido.
      </AlertDescription>
    </Alert>
  )
}