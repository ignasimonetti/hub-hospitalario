"use client";

import { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { motion } from "framer-motion";
import { getCurrentUser, getCurrentUserRoles } from "@/lib/auth";
import { PendingUserDialog } from "@/components/PendingUserDialog";
import { SessionWarningDialog } from "@/components/SessionWarningDialog";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { AppSidebar } from "@/components/AppSidebar";
import dynamic from 'next/dynamic';
const NotionEditor = dynamic(() => import('@hospital/core').then(mod => mod.NotionEditor), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg" />
});

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { getDashboardNote, saveDashboardNote } from "@/app/actions/dashboard-notes";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";

export default function DashboardPage() {
  const { currentTenant, currentRole, setWorkspace } = useWorkspace();
  const [user, setUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [noteContent, setNoteContent] = useState<any>(undefined);
  const [isLoadingNote, setIsLoadingNote] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const checkUserRoles = async (userId: string) => {
    try {
      // Si ya tenemos un workspace activo (tenant y rol), asumimos que el usuario
      // NO está pendiente y tiene acceso. Esto evita el "fogonazo" del modal.
      if (currentTenant && currentRole) {
        setShowPendingDialog(false);
        return;
      }

      // TODO: Aquí se podría implementar una lógica más robusta si fuera necesario
      // verificar roles contra el servidor, pero por ahora confiamos en el contexto
      // del WorkspaceProvider para saber si el usuario debe seleccionar un espacio
      // o si está pendiente de asignación.

      // Si no hay tenant/rol y tampoco roles en la lista (userRoles), entonces sí podría estar pendiente.
      // Pero como userRoles no se está obteniendo aquí (está vacío), esta lógica es delicada.
      // Lo mejor es confiar en que si llegó al dashboard y no tiene workspace, el WorkspaceGuard
      // o el selector de workspace deberían haber intervenido antes si fuera necesario.

      // Mantenemos showPendingDialog en false por defecto para evitar el flash,
      // a menos que estemos seguros de que el usuario NO tiene ningún acceso.
      setShowPendingDialog(false);

    } catch (error) {
      console.error('Error checking user roles:', error);
    }
  };

  const isUserPending = userRoles.length === 0 && user;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Mobile Header & Sidebar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white">
            {currentTenant?.name || 'Hub Hospitalario'}
          </span>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <button className="p-2 -mr-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 border-r-gray-200 dark:border-slate-800">
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
          {/* Header - shadcn/ui Style */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold md:text-2xl text-gray-900 dark:text-slate-100">Dashboard</h1>
              {/* Se eliminó el bloque de texto del hospital y rol */}
            </div>
          </div>

          {/* Dashboard Widgets */}
          <div className="mt-8">
            <DashboardWidgets />
          </div>

          {/* Notion-like Canvas */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Notas
              </h2>
            </div>
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