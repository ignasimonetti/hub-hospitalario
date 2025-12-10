'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getCurrentUser, pocketbase } from "@/lib/auth";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { ThemeToggleButton } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { ErrorReportButton } from "@/components/ErrorReportButton";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import {
    Activity,
    FileText,
    Settings,
    PanelLeftClose,
    PanelLeftOpen,
    LifeBuoy
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppSidebarProps {
    currentPage?: 'dashboard' | 'blog' | 'admin';
}

export function AppSidebar({ currentPage = 'dashboard' }: AppSidebarProps) {
    const router = useRouter();
    const { currentTenant, currentRole } = useWorkspace();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        setUser(currentUser);

        // Load sidebar state from localStorage
        const savedSidebarState = localStorage.getItem('sidebar-collapsed');
        if (savedSidebarState !== null) {
            setSidebarCollapsed(JSON.parse(savedSidebarState));
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
        // Emit custom event for same-tab updates
        window.dispatchEvent(new CustomEvent('sidebarToggle'));
    };

    // Helper to determine role access safely
    // 1. Check strict user.is_super_admin flag (highest privilege)
    // 2. Check currentRole.slug (preferred if available)
    // 3. Fallback to currentRole.name normalized (legacy/fallback)
    const isAdmin = user?.is_super_admin ||
        ['superadmin', 'super_admin'].includes(currentRole?.slug || '') ||
        ['superadmin', 'super admin', 'administrador', 'admin'].includes(currentRole?.name?.toLowerCase() || '');

    // Check if user has blog editor access
    const isBlogEditor = ['editor_blog', 'editor blog'].includes(currentRole?.slug || '') ||
        (currentRole?.name?.toLowerCase() || '').includes('editor');

    const canAccessBlog = isAdmin || isBlogEditor;

    const getTenantLogoUrl = () => {
        if (currentTenant && currentTenant.logo) {
            const logoFileName = Array.isArray(currentTenant.logo) ? currentTenant.logo[0] : currentTenant.logo;
            if (logoFileName && currentTenant.id) {
                return pocketbase.files.getURL(currentTenant, logoFileName, { thumb: '40x40' });
            }
        }
        return undefined;
    };

    const tenantLogoUrl = getTenantLogoUrl();

    return (
        <>
            <div className={`fixed left-0 top-0 bottom-0 bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 z-10 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
                {/* Integrated Header */}
                <div className="h-14 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 flex-shrink-0">
                    <button
                        onClick={toggleSidebar}
                        className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-slate-800 rounded flex items-center justify-center"
                        title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                    >
                        {sidebarCollapsed ? (
                            <PanelLeftOpen className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                        ) : (
                            <PanelLeftClose className="h-4 w-4 text-gray-600 dark:text-slate-400" />
                        )}
                    </button>
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2">
                            <ThemeToggleButton />
                            <NotificationBell />
                        </div>
                    )}
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
                                    className="text-base font-semibold text-gray-900 dark:text-slate-100"
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

                        {/* Dashboard Button */}
                        <button
                            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 text-sm font-medium ${currentPage === 'dashboard'
                                ? 'text-gray-900 dark:text-slate-100 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700'
                                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg'
                                } transition-colors`}
                            title={sidebarCollapsed ? 'Dashboard' : undefined}
                            onClick={() => router.push('/dashboard')}
                        >
                            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            {!sidebarCollapsed && <span>Dashboard</span>}
                        </button>

                        {/* Content Management Module */}
                        {canAccessBlog && (
                            <button
                                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 text-sm ${currentPage === 'blog'
                                    ? 'text-gray-900 dark:text-slate-100 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700'
                                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg'
                                    } transition-colors`}
                                title={sidebarCollapsed ? 'Blog' : undefined}
                                onClick={() => router.push('/modules/content')}
                            >
                                <FileText className="h-4 w-4 text-gray-500 dark:text-slate-400 flex-shrink-0" />
                                {!sidebarCollapsed && <span>Blog</span>}
                            </button>
                        )}

                        {/* Admin Section */}
                        {isAdmin && (
                            <>
                                {!sidebarCollapsed && (
                                    <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mt-2">
                                        Administración
                                    </div>
                                )}
                                <button
                                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 text-sm ${currentPage === 'admin'
                                        ? 'text-gray-900 dark:text-slate-100 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700'
                                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg'
                                        } transition-colors`}
                                    title={sidebarCollapsed ? 'Configuración' : undefined}
                                    onClick={() => router.push('/admin')}
                                >
                                    <Settings className="h-4 w-4 text-gray-500 dark:text-slate-400 flex-shrink-0" />
                                    {!sidebarCollapsed && <span>Configuración</span>}
                                </button>

                                <button
                                    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 text-sm ${currentPage === 'admin'
                                        ? 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg'
                                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg'
                                        } transition-colors`}
                                    title={sidebarCollapsed ? 'Soporte' : undefined}
                                    onClick={() => router.push('/admin/support')}
                                >
                                    <LifeBuoy className="h-4 w-4 text-gray-500 dark:text-slate-400 flex-shrink-0" />
                                    {!sidebarCollapsed && <span>Soporte</span>}
                                </button>
                            </>
                        )}
                    </div>
                </nav>

                {/* User Profile Dropdown - Fixed at bottom */}
                <div className="border-t border-gray-200 dark:border-slate-700">
                    {user && <UserProfileDropdown user={user} collapsed={sidebarCollapsed} />}
                </div>

                {/* Error Report Button - Fixed at bottom */}
                <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                    <ErrorReportButton />
                </div>
            </div>

            {/* Announcement Banner - Fixed position */}
            <AnnouncementBanner />
        </>
    );
}