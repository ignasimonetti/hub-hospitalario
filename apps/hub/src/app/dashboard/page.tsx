"use client";

import { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Activity,
  Users,
  FileText,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Clock,
  Bell,
  Settings,
  LogIn,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getCurrentUser, getCurrentUserRoles, pocketbase } from "@/lib/auth";
import { PendingUserDialog } from "@/components/PendingUserDialog";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { ThemeToggleButton } from "@/components/ThemeToggle";
import { SessionWarningDialog } from "@/components/SessionWarningDialog";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import dynamic from 'next/dynamic';
const NotionEditor = dynamic(() => import('@hospital/core').then(mod => mod.NotionEditor), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg" />
});

import { getDashboardNote, saveDashboardNote } from "@/app/actions/dashboard-notes";

export default function DashboardPage() {
  const router = useRouter();
  const { currentTenant, currentRole, setWorkspace } = useWorkspace();
  const [user, setUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [noteContent, setNoteContent] = useState<any>(undefined);
  const [isLoadingNote, setIsLoadingNote] = useState(true);

  // Session timeout management
  const { showWarning, timeRemaining, extendSession, logout } = useSessionTimeout(currentRole?.name);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      checkUserRoles(currentUser.id);
      // Fetch dashboard note
      getDashboardNote()
        .then((note) => {
          if (note?.content) {
            setNoteContent(note.content);
          }
        })
        .catch((err) => console.error("Failed to load note:", err))
        .finally(() => setIsLoadingNote(false));
    }

    // Load sidebar state from localStorage
    const savedSidebarState = localStorage.getItem('sidebar-collapsed');
    if (savedSidebarState !== null) {
      setSidebarCollapsed(JSON.parse(savedSidebarState));
    }
  }, [currentTenant, currentRole]);

  const handleSaveNote = useCallback(async (editor: any) => {
    const content = editor.getJSON();
    console.log('Saving note...', new Date().toISOString());
    const result = await saveDashboardNote(content);
    if (result.success) {
      console.log('Note saved successfully');
    } else {
      console.error('Failed to save note:', result.error);
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  const checkUserRoles = async (userId: string) => {
    try {
      // El dashboard ya tiene acceso al contexto de workspace
      // No es necesario volver a obtener los roles, solo usar los del contexto
      // Si se necesita actualizar los roles, debería hacerse a través del contexto

      // Si el contexto de workspace no tiene roles pero sí tiene tenant y rol,
      // podemos confiar en esos valores
      if (currentTenant && currentRole) {
        // Ya tenemos la información del entorno hospitalario
        setShowPendingDialog(false);
      } else {
        // Si no tenemos información del workspace, mostrar diálogo de pendiente
        setShowPendingDialog(true);
      }
    } catch (error) {
      console.error('Error checking user roles:', error);
    }
  };


  const getTenantLogoUrl = () => {
    if (currentTenant && currentTenant.logo) {
      // 'hub_tenants' is the collection name, 'currentTenant' is the record
      // PocketBase file fields can return a string (single file) or an array of strings (multiple files)
      const logoFileName = Array.isArray(currentTenant.logo) ? currentTenant.logo[0] : currentTenant.logo;
      if (logoFileName && currentTenant.id) { // Ensure currentTenant.id exists for getUrl
        // The collection ID for hub_tenants can be hardcoded or fetched if needed
        // For now, assuming collection name 'hub_tenants' for getUrl
        return pocketbase.files.getURL(currentTenant, logoFileName, { thumb: '40x40' }); // Optional: request a thumbnail
      }
    }
    return undefined;
  };

  const isUserPending = userRoles.length === 0 && user;

  const tenantLogoUrl = getTenantLogoUrl();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Sidebar Navigation - Full Height */}
      <div className={`fixed left-0 top-0 bottom-0 bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 z-10 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        {/* Integrated Header */}
        <div className="h-14 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-slate-800"
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 text-gray-600 dark:text-slate-400" />
            ) : (
              <PanelLeftClose className="h-4 w-4 text-gray-600 dark:text-slate-400" />
            )}
          </Button>
          {!sidebarCollapsed && <ThemeToggleButton />}
        </div>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-center">
          <div className={`flex items-center w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-3'}`}>
            <Avatar className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
              <AvatarImage src={tenantLogoUrl} alt={currentTenant?.name} />
              <AvatarFallback className="bg-blue-600 dark:bg-blue-500 text-white">
                {currentTenant?.name?.charAt(0).toUpperCase() || 'H'}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <h1
                  className="text-base font-semibold text-gray-900 dark:text-slate-100" // Removed truncate
                  title={currentTenant?.name || 'Hub Hospitalario'}
                >
                  {currentTenant?.name || 'Hub Hospitalario'}
                </h1>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">Hub Hospitalario</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${sidebarCollapsed ? 'p-2' : 'p-4'} overflow-y-auto`}>
          <div className="space-y-2">
            {!sidebarCollapsed && (
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Principal
              </div>
            )}
            <button
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 text-sm font-medium text-gray-900 dark:text-slate-100 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors`}
              title={sidebarCollapsed ? 'Dashboard' : undefined}
            >
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </button>

            {currentRole?.name?.toLowerCase().replace(/\s/g, '') === 'superadmin' && (
              <>
                {!sidebarCollapsed && (
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    Administración
                  </div>
                )}
                <button
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors`}
                  title={sidebarCollapsed ? 'Configuración' : undefined}
                >
                  <Settings className="h-4 w-4 text-gray-500 dark:text-slate-400 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Configuración</span>}
                </button>
              </>
            )}
          </div>
        </nav>

        {/* User Profile Dropdown - Fixed at bottom */}
        <div className="border-t border-gray-200 dark:border-slate-700">
          {user && <UserProfileDropdown user={user} collapsed={sidebarCollapsed} />}
        </div>
      </div>

      {/* Main Content */}
      <div className={`pt-14 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-6xl mx-auto px-8 py-12"
        >
          {/* Header - shadcn/ui Style */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold md:text-2xl text-gray-900 dark:text-slate-100">Dashboard</h1>
              {/* Se eliminó el bloque de texto del hospital y rol */}
            </div>
          </div>

          {/* Notion-like Canvas */}
          <div className="mt-8">
            {!isLoadingNote && (
              <NotionEditor
                key={noteContent ? 'loaded' : 'empty'} // Force re-mount when content loads
                initialContent={noteContent}
                onDebouncedUpdate={handleSaveNote}
              />
            )}
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