"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { PendingUserDialog } from "@/components/PendingUserDialog";
import { getCurrentUserRoles } from "@/lib/auth";

interface UserRole {
  id: string;
  user: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
  tenant: {
    id: string;
    name: string;
    code?: string;
    address?: string;
    phone?: string;
    active: boolean;
    created: string;
  };
  assigned_by: string;
  assigned_at: string;
}

interface WorkspaceGuardProps {
  children: React.ReactNode;
}

export function WorkspaceGuard({ children }: WorkspaceGuardProps) {
  const { currentTenant, currentRole, setWorkspace, isWorkspaceSelected } = useWorkspace();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Pages that don't require workspace selection
  const publicPages = ['/', '/login', '/signup', '/confirm', '/forgot-password', '/verify'];

  useEffect(() => {
    const checkUserAccess = async () => {
      try {
        console.log('🔐 WorkspaceGuard: Checking user access for path:', pathname);

        // Skip workspace check for public pages
        if (publicPages.some(page => pathname.startsWith(page))) {
          console.log('🔓 WorkspaceGuard: Public page, skipping workspace check');
          setLoading(false);
          return;
        }

        console.log('🔍 WorkspaceGuard: Checking user authentication and roles...');
        const roles = await getCurrentUserRoles();

        if (!roles || roles.length === 0) {
          // User has no roles - show pending dialog
          setShowPendingDialog(true);
          setLoading(false);
          return;
        }

        setUserRoles(roles as unknown as UserRole[]);

        // Check if user has a saved workspace
        if (isWorkspaceSelected) {
          // User has a selected workspace, allow access
          setLoading(false);
          return;
        }

        // Count unique tenants
        const uniqueTenants = [...new Set(roles.map(role => role.tenant.id))];

        if (uniqueTenants.length === 1) {
          // User has only one tenant - auto-select it
          const tenant = roles[0].tenant;
          const primaryRole = roles.find(r => r.tenant.id === tenant.id)?.role;

          if (primaryRole) {
            setWorkspace(tenant, primaryRole);
            setLoading(false);
            return;
          }
        }

        // User has multiple tenants or no auto-selection - show selector
        setShowWorkspaceSelector(true);
        setLoading(false);

      } catch (error) {
        console.error('Error checking user access:', error);
        setShowPendingDialog(true);
        setLoading(false);
      }
    };

    checkUserAccess();
  }, [pathname, isWorkspaceSelected, setWorkspace]);

  const handleWorkspaceSelect = (tenant: any, role: any) => {
    setWorkspace(tenant, role);
    setShowWorkspaceSelector(false);
  };

  const handlePendingDialogClose = () => {
    setShowPendingDialog(false);
    // Redirect to landing page
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show workspace selector if user has multiple tenants and hasn't selected one
  if (showWorkspaceSelector && userRoles.length > 0) {
    return (
      <WorkspaceSelector
        userRoles={userRoles}
        onWorkspaceSelect={handleWorkspaceSelect}
      />
    );
  }

  // Show pending dialog if user has no roles
  if (showPendingDialog) {
    return (
      <PendingUserDialog
        open={true}
        onOpenChange={() => {}}
      />
    );
  }

  // User has access - render children
  return <>{children}</>;
}