"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSession } from "@/components/SessionProvider";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { PendingUserDialog } from "@/components/PendingUserDialog";
import { getCurrentUserRoles } from "@/lib/auth";

// Using any for PocketBase records to avoid type conflicts

interface WorkspaceGuardProps {
  children: React.ReactNode;
}

export function WorkspaceGuard({ children }: WorkspaceGuardProps) {
  const { status: sessionStatus } = useSession();
  const { status: workspaceStatus, isWorkspaceSelected, setWorkspace, loadAvailableTenants, availableTenants } = useWorkspace();
  
  const [uiState, setUiState] = useState<"loading" | "selecting" | "pending" | "ready">("loading");
  const [userRoles, setUserRoles] = useState<any[]>([]);

  const router = useRouter();
  const pathname = usePathname();
  // Corregir la lógica de isPublicPage: '/' debe ser una coincidencia exacta
  const isPublicPage = pathname === '/' || ['/login', '/signup', '/confirm', '/forgot-password', '/verify'].some(p => pathname.startsWith(p));

  useEffect(() => {
    // 1. No hacer nada en páginas públicas
    if (isPublicPage) {
      setUiState("ready");
      return;
    }

    // 2. Esperar a que ambos providers terminen su inicialización
    if (sessionStatus === "loading" || workspaceStatus !== "ready") {
      setUiState("loading");
      return;
    }

    // 3. Manejar usuarios no autenticados
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
      return;
    }

    // 4. A partir de aquí, sabemos que sessionStatus es "authenticated" y workspaceStatus es "ready"
    // Si ya hay un workspace seleccionado, podemos continuar
    if (isWorkspaceSelected) {
      setUiState("ready");
      return;
    }

    // 5. El usuario está autenticado, el workspace está listo, pero no hay un workspace seleccionado en el contexto.
    // Este es el ÚNICO lugar donde debemos obtener los roles.
    const fetchRolesAndDecide = async () => {
      try {
        const roles = await getCurrentUserRoles();
        if (!roles || roles.length === 0) {
          setUiState("pending");
          return;
        }

        // Extraer los objetos expandidos de role y tenant
        const expandedUserRoles = (roles as any[]).map(roleAssignment => ({
          role: roleAssignment.expand?.role,
          tenant: roleAssignment.expand?.tenant
        })).filter(item => item.role && item.tenant); // Filtrar cualquier asignación incompleta

        if (expandedUserRoles.length === 0) {
          setUiState("pending");
          return;
        }

        setUserRoles(expandedUserRoles);
        loadAvailableTenants(expandedUserRoles); // Actualizar el contexto con todos los tenants disponibles

        const uniqueTenants = [...new Map(expandedUserRoles.map(r => [r.tenant.id, r.tenant])).values()];

        if (uniqueTenants.length === 1) {
          // Auto-seleccionar si solo hay una opción
          const tenant = uniqueTenants[0];
          const role = expandedUserRoles.find(r => r.tenant.id === tenant.id)!.role;
          setWorkspace(tenant, role);
          setUiState("ready");
        } else {
          // Mostrar selector para múltiples opciones
          setUiState("selecting");
        }
      } catch (error) {
        console.error("Error obteniendo roles de usuario en WorkspaceGuard:", error);
        setUiState("pending"); // Mostrar diálogo pendiente en caso de error
      }
    };

    fetchRolesAndDecide();

  }, [sessionStatus, workspaceStatus, isWorkspaceSelected, pathname, router, setWorkspace, loadAvailableTenants, isPublicPage]);

  // --- LÓGICA DE RENDERIZADO ---
  // Esta parte ahora es un reflejo limpio del `uiState`

  if (uiState === "loading" || isPublicPage) {
    // Mostrar children para páginas públicas inmediatamente, o un loader para las protegidas.
    return isPublicPage ? <>{children}</> : <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  if (uiState === "selecting") {
    return (
      <WorkspaceSelector
        userRoles={userRoles}
        onWorkspaceSelect={(tenant, role) => {
          setWorkspace(tenant, role);
          setUiState("ready");
        }}
      />
    );
  }

  if (uiState === "pending") {
    return (
      <PendingUserDialog
        open={true}
        onOpenChange={() => router.push('/')} // Redirigir al cerrar
      />
    );
  }

  // uiState es "ready" y no es una página pública
  return <>{children}</>;
}