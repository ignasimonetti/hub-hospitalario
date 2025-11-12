"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Tenant {
  id: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  logo?: string;
  active: boolean;
  created: string;
}

interface UserRole {
  id: string;
  name: string;
  description?: string;
}

interface WorkspaceContextType {
  currentTenant: Tenant | null;
  currentRole: UserRole | null;
  availableTenants: Tenant[];
  setWorkspace: (tenant: Tenant, role: UserRole) => void;
  clearWorkspace: () => void;
  isWorkspaceSelected: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const WORKSPACE_STORAGE_KEY = 'hub-selected-workspace';

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);

  // Load workspace from localStorage on mount
  useEffect(() => {
    const savedWorkspace = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (savedWorkspace) {
      try {
        const { tenant, role } = JSON.parse(savedWorkspace);
        setCurrentTenant(tenant);
        setCurrentRole(role);
      } catch (error) {
        console.error('Error loading saved workspace:', error);
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      }
    }
  }, []);

  const setWorkspace = (tenant: Tenant, role: UserRole) => {
    setCurrentTenant(tenant);
    setCurrentRole(role);

    // Save to localStorage
    const workspaceData = { tenant, role };
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspaceData));
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