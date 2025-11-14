"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from '@/components/SessionProvider';

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

  useEffect(() => {
    console.log(`🔄 WorkspaceProvider: sessionStatus changed to ${sessionStatus}. Current Workspace Status: ${status}`);

    if (sessionStatus === 'loading') {
      setStatus('waiting');
      return;
    }

    if (sessionStatus === 'unauthenticated') {
      console.log('❌ WorkspaceProvider: Session is unauthenticated. Clearing workspace.');
      clearWorkspace();
      setStatus('ready'); // Ready, but with no data
      return;
    }

    if (sessionStatus === 'authenticated') {
      console.log('✅ WorkspaceProvider: Session is authenticated. Initializing workspace.');
      setStatus('initializing');
      const savedWorkspace = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      console.log('DIAGNOSTIC: Retrieved from localStorage:', savedWorkspace); // Log 1
      if (savedWorkspace) {
        try {
          const { tenant, role } = JSON.parse(savedWorkspace);
          console.log('DIAGNOSTIC: Parsed tenant from localStorage:', tenant); // Log 2
          console.log('DIAGNOSTIC: Parsed role from localStorage:', role);     // Log 3
          setCurrentTenant(tenant);
          setCurrentRole(role);
          console.log('✅ WorkspaceProvider: Loaded workspace from localStorage.');
        } catch (error) {
          console.error('❌ WorkspaceProvider: Error loading saved workspace:', error);
          localStorage.removeItem(WORKSPACE_STORAGE_KEY);
        }
      }
      setStatus('ready');
      console.log('✅ WorkspaceProvider: Workspace initialization complete. Status set to READY.');
    }
  }, [sessionStatus]); // Depend on sessionStatus

  const loadAvailableTenants = (userRoles: any[]) => {
    const tenants = userRoles.map((role: any) => role.tenant).filter((tenant): tenant is Tenant => tenant !== undefined);
    const uniqueTenants = [...new Map(tenants.map(t => [t.id, t])).values()];
    setAvailableTenants(uniqueTenants);
  };

  const setWorkspace = (tenant: Tenant, role: UserRole) => {
    setCurrentTenant(tenant);
    setCurrentRole(role);
    const workspaceToSave = { tenant, role };
    console.log('DIAGNOSTIC: Saving to localStorage:', workspaceToSave); // Log 4
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspaceToSave));
    console.log('✅ WorkspaceProvider: Workspace set and saved to localStorage.');
  };

  const clearWorkspace = () => {
    setCurrentTenant(null);
    setCurrentRole(null);
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    console.log('🗑️ WorkspaceProvider: Workspace cleared.');
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