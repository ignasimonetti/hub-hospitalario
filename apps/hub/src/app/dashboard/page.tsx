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

import { getDashboardNote, saveDashboardNote } from "@/app/actions/dashboard-notes";

export default function DashboardPage() {
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

  const isUserPending = userRoles.length === 0 && user;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <div className="hidden md:block">
        <AppSidebar currentPage="dashboard" />
      </div>

      {/* Main Content */}
      <div className={`pt-14 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'} ml-0`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="max-w-6xl mx-auto px-4 md:px-8 py-12"
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