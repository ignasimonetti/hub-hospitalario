"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from '@/components/SessionProvider';
import { pocketbase } from '@/lib/auth'; // Importar la instancia de PocketBase

type WorkspaceStatus = "waiting" | "initializing" | "ready";

interface Tenant {
  id: string;
  name: string;
  code?: string;
  logo?: string | string[];
  // Add other tenant properties as needed
}

interface UserRole {
  id: string;
  name: string;
  // Add other role properties as needed
}

interface WorkspaceContextType {
  currentTenant: Tenant | null;
  currentRole: UserRole | null;
  availableTenants: Tenant[];
  setWorkspace: (tenant: Tenant, role: UserRole) => void;
  clearWorkspace: () => void;
  isWorkspaceSelected: boolean;
  loadAvailableTenants: (userRoles: any[]) => void;
  status: WorkspaceStatus;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const WORKSPACE_STORAGE_KEY = 'hub-selected-workspace';

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WorkspaceStatus>("waiting");
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const { status: sessionStatus } = useSession();

  // Función para obtener detalles completos de tenant y role desde PocketBase
  const fetchTenantAndRoleDetails = async (tenantId: string, roleId: string) => {
    try {
      const tenantDetails = await pocketbase.collection('hub_tenants').getOne(tenantId);
      const roleDetails = await pocketbase.collection('hub_roles').getOne(roleId);
      return { tenant: tenantDetails as unknown as Tenant, role: roleDetails as unknown as UserRole };
    } catch (error) {
      console.error('❌ Error fetching tenant or role details:', error);
      return { tenant: null, role: null };
    }
  };

  useEffect(() => {
    if (sessionStatus === 'loading') {
      setStatus('waiting');
      return;
    }

    if (sessionStatus === 'unauthenticated') {
      clearWorkspace();
      setStatus('ready'); // Ready, but with no data
      return;
    }

    if (sessionStatus === 'authenticated') {
      setStatus('initializing');
      const savedWorkspace = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (savedWorkspace) {
        try {
          const { tenant: savedTenant, role: savedRole } = JSON.parse(savedWorkspace);

          // Si solo se guardaron los IDs, buscar los detalles completos
          // O si el objeto guardado no tiene la propiedad 'name' (indicando que no es el objeto completo)
          if (typeof savedTenant === 'string' || !savedTenant.name || typeof savedRole === 'string' || !savedRole.name) {
            // Asegurarse de pasar los IDs correctos, incluso si el objeto guardado es incompleto
            const tenantIdToFetch = typeof savedTenant === 'string' ? savedTenant : savedTenant.id;
            const roleIdToFetch = typeof savedRole === 'string' ? savedRole : savedRole.id;

            fetchTenantAndRoleDetails(tenantIdToFetch, roleIdToFetch)
              .then(({ tenant, role }) => {
                if (tenant && role) {
                  setCurrentTenant(tenant);
                  setCurrentRole(role);
                } else {
                  console.warn('⚠️ WorkspaceProvider: Could not fetch full tenant/role details. Clearing workspace.');
                  clearWorkspace();
                }
              });
          } else {
            // Si ya se guardaron los objetos completos
            setCurrentTenant(savedTenant);
            setCurrentRole(savedRole);
          }
        } catch (error) {
          console.error('❌ WorkspaceProvider: Error loading saved workspace:', error);
          localStorage.removeItem(WORKSPACE_STORAGE_KEY);
        }
      }
      setStatus('ready');
    }
  }, [sessionStatus]); // Depend on sessionStatus

  const loadAvailableTenants = (userRoles: any[]) => {
    // Asegurarse de que los tenants en userRoles ya vienen expandidos con todos los detalles
    const tenants = userRoles.map((userRole: any) => userRole.tenant).filter((tenant): tenant is Tenant => tenant !== undefined);
    const uniqueTenants = Array.from(new Map(tenants.map(t => [t.id, t])).values());
    setAvailableTenants(uniqueTenants);
  };

  const setWorkspace = async (tenant: Tenant, role: UserRole) => {
    // Asegurarse de que tenemos los objetos completos antes de guardar
    let fullTenant = tenant;
    let fullRole = role;

    // La condición para re-buscar ahora es más estricta: si el objeto no tiene 'name'
    if (!tenant.name || !role.name) {
      const fetchedDetails = await fetchTenantAndRoleDetails(tenant.id, role.id);
      if (fetchedDetails.tenant && fetchedDetails.role) {
        fullTenant = fetchedDetails.tenant;
        fullRole = fetchedDetails.role;
      } else {
        console.error('❌ Could not fetch full tenant/role details. Aborting workspace set.');
        return;
      }
    }

    setCurrentTenant(fullTenant);
    setCurrentRole(fullRole);
    const workspaceToSave = { tenant: fullTenant, role: fullRole };
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspaceToSave));
  };

  const clearWorkspace = () => {
    setCurrentTenant(null);
    setCurrentRole(null);
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  };

  const value: WorkspaceContextType = {
    currentTenant,
    currentRole,
    availableTenants,
    setWorkspace,
    clearWorkspace,
    isWorkspaceSelected: currentTenant !== null && currentRole !== null,
    loadAvailableTenants,
    status,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}