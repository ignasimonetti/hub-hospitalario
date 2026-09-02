"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { motion } from "framer-motion";
import { getCurrentUser, getCurrentUserRoles } from "@/lib/auth";
import { PendingUserDialog } from "@/components/PendingUserDialog";
import { SessionWarningDialog } from "@/components/SessionWarningDialog";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileSidebarHeader } from "@/components/MobileSidebarHeader";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";

export default function DashboardPage() {
  const { currentTenant, currentRole, setWorkspace } = useWorkspace();
  const [user, setUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [firstName, setFirstName] = useState<string>("");

  // Session timeout management
  const { showWarning, timeRemaining, extendSession, logout } = useSessionTimeout(currentRole?.name);

  // Format current date in Spanish
  const today = new Date();
  const formattedDate = today.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  // Capitalize first letter
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      checkUserRoles(currentUser.id);
      // Fetch full profile to get first name
      fetch("/api/auth/profile")
        .then((res) => res.json())
        .then((data) => {
          const profileUser = data.user || data;
          const rawName =
            profileUser.firstName ||
            profileUser.first_name ||
            profileUser.name ||
            currentUser.firstName ||
            currentUser.first_name ||
            currentUser.name ||
            "";
          if (rawName) {
            // Si viene un mail por error o fallback, no tomar el mail
            const cleanName = rawName.includes("@") ? rawName.split("@")[0] : rawName;
            const first = cleanName.split(" ")[0].replace(/[0-9]/g, '');
            if (first) {
              setFirstName(first.charAt(0).toUpperCase() + first.slice(1).toLowerCase());
            }
          }
        })
        .catch((err) => console.error("Failed to load profile:", err));
    }

    // Load sidebar state from localStorage
    const savedSidebarState = localStorage.getItem('sidebar-collapsed');
    if (savedSidebarState !== null) {
      setSidebarCollapsed(JSON.parse(savedSidebarState));
    }

    // Listen for sidebar state changes
    const handleSidebarToggle = () => {
      const savedState = localStorage.getItem('sidebar-collapsed');
      if (savedState !== null) {
        setSidebarCollapsed(JSON.parse(savedState));
      }
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
    };
  }, [currentTenant, currentRole]);

  const checkUserRoles = async (userId: string) => {
    try {
      if (currentTenant && currentRole) {
        setShowPendingDialog(false);
        return;
      }
      setShowPendingDialog(false);
    } catch (error) {
      console.error('Error checking user roles:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f5f4] dark:bg-[#191919]">
      {/* Mobile Header & Sidebar */}
      <MobileSidebarHeader
        currentPage="dashboard"
        title={currentTenant?.name || "Hub Hospitalario"}
      />

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar currentPage="dashboard" />
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-200 ease-in-out ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} ml-0`}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10"
        >
          {/* Welcome Banner */}
          <div className="rounded-xl bg-white dark:bg-[#242424] border border-[#e6e6e6] dark:border-[#383838] p-6 md:p-8 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h1 className="text-2xl md:text-3xl font-bold text-[#000000] dark:text-white tracking-[-0.03em]">
              {firstName ? `¡Hola, ${firstName}!` : "¡Bienvenido!"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {displayDate}
              {currentTenant?.name && (
                <span> · {currentTenant.name}</span>
              )}
            </p>
          </div>

          {/* Dashboard Widgets */}
          <div>
            <DashboardWidgets />
          </div>

          {/* Dialog para usuario pendiente */}
          <PendingUserDialog
            open={showPendingDialog}
            onOpenChange={setShowPendingDialog}
            userEmail={user?.email}
          />

          {/* Session Warning Dialog */}
          <SessionWarningDialog
            isOpen={showWarning}
            timeRemaining={timeRemaining}
            onExtend={extendSession}
            onLogout={logout}
          />
        </motion.div>
      </div>
    </div>
  );
}