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
  const isPublicPage = ['/login', '/signup', '/confirm', '/forgot-password', '/verify'].some(p => pathname.startsWith(p));

  useEffect(() => {
    // 1. Do nothing on public pages
    if (isPublicPage) {
      setUiState("ready");
      return;
    }

    // 2. Wait for both providers to finish their initialization
    if (sessionStatus === "loading" || workspaceStatus !== "ready") {
      setUiState("loading");
      return;
    }

    // 3. Handle unauthenticated users
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
      return;
    }

    // 4. From here, we know sessionStatus is "authenticated" and workspaceStatus is "ready"
    // TEMPORARILY COMMENTED OUT FOR DIAGNOSIS:
    // if (isWorkspaceSelected) {
    //   setUiState("ready");
    //   return;
    // }

    // 5. User is authenticated, workspace is ready, but no workspace is selected in context.
    // This is the ONLY place we should fetch roles.
    const fetchRolesAndDecide = async () => {
      try {
        const roles = await getCurrentUserRoles();
        if (!roles || roles.length === 0) {
          setUiState("pending");
          return;
        }

        const typedRoles = (roles as any[]).map(role => ({
          role: role.role,
          tenant: role.tenant
        }));
        setUserRoles(typedRoles);
        loadAvailableTenants(typedRoles); // Update context with all available tenants

        const uniqueTenants = [...new Map(typedRoles.map(r => [r.tenant.id, r.tenant])).values()];

        if (uniqueTenants.length === 1) {
          // Auto-select if there's only one option
          const tenant = uniqueTenants[0];
          const role = typedRoles.find(r => r.tenant.id === tenant.id)!.role;
          setWorkspace(tenant, role);
          setUiState("ready");
        } else {
          // Show selector for multiple options
          setUiState("selecting");
        }
      } catch (error) {
        console.error("Error fetching user roles in WorkspaceGuard:", error);
        setUiState("pending"); // Show pending dialog on error
      }
    };

    fetchRolesAndDecide();

  }, [sessionStatus, workspaceStatus, isWorkspaceSelected, pathname, router, setWorkspace, loadAvailableTenants, isPublicPage]);

  // --- RENDER LOGIC ---
  // This part is now a clean reflection of the `uiState`

  if (uiState === "loading" || isPublicPage) {
    // Show children for public pages immediately, or a loader for protected ones.
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
        onOpenChange={() => router.push('/')} // Redirect on close
      />
    );
  }

  // uiState is "ready" and it's not a public page
  return <>{children}</>;
}