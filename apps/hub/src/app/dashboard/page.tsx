"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { motion } from "framer-motion";
import { getCurrentUser, getCurrentUserRoles } from "@/lib/auth";
import { PendingUserDialog } from "@/components/PendingUserDialog";
import { SessionWarningDialog } from "@/components/SessionWarningDialog";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { AppSidebar } from "@/components/AppSidebar";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";

export default function DashboardPage() {
  const { currentTenant, currentRole, setWorkspace } = useWorkspace();
  const [user, setUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Mobile Header & Sidebar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-white">
            {currentTenant?.name || 'Hub Hospitalario'}
          </span>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <button className="p-2 -mr-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 border-r-slate-200 dark:border-slate-800">
            <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
            <AppSidebar
              currentPage="dashboard"
              isMobile={true}
              onMobileClose={() => setIsMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar currentPage="dashboard" />
      </div>

      {/* Main Content */}
      <div className={`pt-4 md:pt-14 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} ml-0`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-12"
        >
          {/* Welcome Banner */}
          <div className="rounded-2xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 mb-8 shadow-xs">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
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