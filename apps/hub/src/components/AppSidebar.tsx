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
    LifeBuoy,
    FolderOpen,
    Package,
    Stethoscope,
    Receipt
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppSidebarProps {
    currentPage?: 'dashboard' | 'blog' | 'admin' | 'expedientes' | 'supply' | 'prestadores' | 'tesoreria';
    isMobile?: boolean;
    onMobileClose?: () => void;
}

export function AppSidebar({ currentPage = 'dashboard', isMobile = false, onMobileClose }: AppSidebarProps) {
    const router = useRouter();
    const { currentTenant, currentRole } = useWorkspace();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();
        setUser(currentUser);

        // Load sidebar state from localStorage only if not mobile
        if (!isMobile) {
            const savedSidebarState = localStorage.getItem('sidebar-collapsed');
            if (savedSidebarState !== null) {
                setSidebarCollapsed(JSON.parse(savedSidebarState));
            }
        }
    }, [isMobile]);

    const toggleSidebar = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
        // Emit custom event for same-tab updates
        window.dispatchEvent(new CustomEvent('sidebarToggle'));
    };

    const handleNavigation = (path: string) => {
        router.push(path);
        if (isMobile && onMobileClose) {
            onMobileClose();
        }
    };

    // Helper to determine role access safely
    // 1. Check strict user.is_super_admin flag (highest privilege)
    // 2. Check currentRole.slug (preferred if available)
    // 3. Fallback to currentRole.name normalized (legacy/fallback)
    const isAdmin = user?.is_super_admin ||
        ['superadmin', 'super_admin'].includes(currentRole?.slug || '') ||
        ['superadmin', 'super admin', 'administrador', 'admin', 'super usuario', 'sysadmin', 'sistema'].includes(currentRole?.name?.toLowerCase() || '');

    // Check if user has blog editor access
    const isBlogEditor = ['editor_blog', 'editor blog'].includes(currentRole?.slug || '') ||
        (currentRole?.name?.toLowerCase() || '').includes('editor');

    const canAccessBlog = isAdmin || isBlogEditor;

    // Check if user has access to Expedientes
    console.log('DEBUG SIDEBAR ROLE:', currentRole);
    const isMesaEntrada = ['mesa_entrada', 'mesa de entrada', 'mesa de entradas'].includes(currentRole?.slug || '') ||
        (currentRole?.name?.toLowerCase() || '').includes('mesa de entrada');

    const canAccessExpedientes = isAdmin || isMesaEntrada;

    // Check if user has supply module access
    // Admin or any role starting with 'supply_' or containing 'suministros'
    const isSupplyUser = (currentRole?.slug || '').startsWith('supply_') ||
        (currentRole?.name?.toLowerCase() || '').includes('suministros');
    const canAccessSupply = isAdmin || isSupplyUser;

    // Check if user has Tesoreria access (excluyendo a director_adjunto)
    const roleSlug = currentRole?.slug || '';
    const roleName = (currentRole?.name || '').toLowerCase();
    const isDirectorAdjunto = roleSlug === 'director_adjunto' || roleName.includes('adjunto');
    const isTesoreriaUser =
        !isDirectorAdjunto && (
            roleSlug.includes('tesoreria') ||
            roleName.includes('tesorer') ||
            roleSlug === 'director_coordinador' ||
            roleSlug === 'director'
        );
    const canAccessTesoreria = isAdmin || isTesoreriaUser;

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

    // Base classes
    const containerClasses = isMobile
        ? "h-full w-full bg-[#f6f5f4] dark:bg-[#1f1f1f] flex flex-col"
        : `fixed left-0 top-0 bottom-0 bg-[#f6f5f4] dark:bg-[#1f1f1f] border-r border-[#e6e6e6] dark:border-[#2e2e2e] z-10 flex flex-col transition-all duration-200 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'}`;

    const showContent = isMobile || !sidebarCollapsed;

    // Helper for Notion item classes
    const getNavButtonClasses = (isActive: boolean) => `
        w-full flex items-center ${!showContent ? 'justify-center px-2' : 'gap-2.5 px-2.5'} py-1.5 text-sm font-medium rounded-md transition-colors
        ${isActive
            ? 'text-[#000000] dark:text-white bg-[#eae8e6] dark:bg-[#2b2b2b] font-semibold'
            : 'text-[#615d59] dark:text-[#a39e98] hover:text-[#000000] dark:hover:text-white hover:bg-[#eae8e6]/60 dark:hover:bg-[#2a2a2a]/60'
        }
    `;

    return (
        <>
            <div className={containerClasses}>
                {/* Header Integrado con Logo / Workspace Switcher Style con 100% de espacio */}
                <div className={`h-14 border-b border-[#e6e6e6] dark:border-[#2e2e2e] flex items-center justify-between flex-shrink-0 ${!showContent ? 'px-2 justify-center' : 'px-3'}`}>
                    <div className={`flex items-center min-w-0 ${!showContent ? 'justify-center w-full' : 'gap-2.5 flex-1'}`}>
                        <button
                            type="button"
                            onClick={!showContent ? toggleSidebar : undefined}
                            className={`flex items-center justify-center rounded-lg transition-transform active:scale-95 ${!showContent ? 'cursor-pointer hover:ring-2 hover:ring-[#0075de]/30' : ''}`}
                            title={!showContent ? "Expandir menú de navegación" : undefined}
                        >
                            <Avatar className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white dark:bg-[#2b2b2b] border border-[#e6e6e6] dark:border-[#383838] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                                <AvatarImage src={tenantLogoUrl} alt={currentTenant?.name} className="object-contain p-0.5" />
                                <AvatarFallback className="bg-[#0075de] text-white text-xs font-bold rounded-lg">
                                    {currentTenant?.name?.charAt(0).toUpperCase() || 'H'}
                                </AvatarFallback>
                            </Avatar>
                        </button>

                        {showContent && (
                            <div className="flex-1 min-w-0">
                                <h1
                                    className="text-xs font-bold text-[#000000] dark:text-white truncate tracking-[-0.01em] leading-snug"
                                    title={currentTenant?.name || 'Hub Hospitalario'}
                                >
                                    {currentTenant?.name || 'Hub Hospitalario'}
                                </h1>
                                <p className="text-[11px] text-[#615d59] dark:text-[#a39e98] truncate leading-tight">
                                    CISB • Workspace
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Botón único de colapsar en desktop */}
                    {showContent && !isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className="h-7 w-7 p-0 hover:bg-[#eae8e6] dark:hover:bg-[#2b2b2b] text-[#615d59] dark:text-[#a39e98] hover:text-[#000000] dark:hover:text-white rounded-md flex items-center justify-center transition-colors shrink-0 ml-1"
                            title="Colapsar sidebar"
                        >
                            <PanelLeftClose className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className={`flex-1 ${!showContent ? 'p-1.5' : 'p-2.5'} overflow-y-auto space-y-1`}>
                    <div className="space-y-0.5">
                        {showContent && (
                            <div className="px-2.5 py-1 text-[11px] font-medium text-[#a39e98] dark:text-[#615d59] uppercase tracking-wider">
                                Espacios
                            </div>
                        )}

                        {/* Dashboard Button */}
                        <button
                            className={getNavButtonClasses(currentPage === 'dashboard')}
                            title={!showContent ? 'Dashboard' : undefined}
                            onClick={() => handleNavigation('/dashboard')}
                        >
                            <Activity className={`h-4 w-4 flex-shrink-0 ${currentPage === 'dashboard' ? 'text-[#0075de]' : 'text-[#615d59] dark:text-[#a39e98]'}`} />
                            {showContent && <span>Dashboard</span>}
                        </button>

                        {/* Content Management Module */}
                        {canAccessBlog && (
                            <button
                                className={getNavButtonClasses(currentPage === 'blog')}
                                title={!showContent ? 'Blog' : undefined}
                                onClick={() => handleNavigation('/modules/content')}
                            >
                                <FileText className={`h-4 w-4 flex-shrink-0 ${currentPage === 'blog' ? 'text-[#0075de]' : 'text-[#615d59] dark:text-[#a39e98]'}`} />
                                {showContent && <span>Blog</span>}
                            </button>
                        )}

                        {/* Expedientes Module */}
                        {canAccessExpedientes && (
                            <button
                                className={getNavButtonClasses(currentPage === 'expedientes')}
                                title={!showContent ? 'Expedientes' : undefined}
                                onClick={() => handleNavigation('/modules/expedientes')}
                            >
                                <FolderOpen className={`h-4 w-4 flex-shrink-0 ${currentPage === 'expedientes' ? 'text-[#0075de]' : 'text-[#615d59] dark:text-[#a39e98]'}`} />
                                {showContent && <span>Expedientes</span>}
                            </button>
                        )}

                        {/* Supply Module */}
                        {canAccessSupply && (
                            <button
                                className={getNavButtonClasses(currentPage === 'supply')}
                                title={!showContent ? 'Suministros' : undefined}
                                onClick={() => handleNavigation('/modules/supply')}
                            >
                                <Package className={`h-4 w-4 flex-shrink-0 ${currentPage === 'supply' ? 'text-[#0075de]' : 'text-[#615d59] dark:text-[#a39e98]'}`} />
                                {showContent && <span>Suministros</span>}
                            </button>
                        )}

                        {/* Portal de Prestadores */}
                        <button
                            className={getNavButtonClasses(currentPage === 'prestadores')}
                            title={!showContent ? 'Portal de Prestadores' : undefined}
                            onClick={() => handleNavigation('/modules/prestadores')}
                        >
                            <Stethoscope className={`h-4 w-4 flex-shrink-0 ${currentPage === 'prestadores' ? 'text-[#0075de]' : 'text-[#615d59] dark:text-[#a39e98]'}`} />
                            {showContent && <span>Portal de Prestadores</span>}
                        </button>

                        {/* Módulo de Tesorería */}
                        {canAccessTesoreria && (
                            <button
                                className={getNavButtonClasses(currentPage === 'tesoreria')}
                                title={!showContent ? 'Tesorería' : undefined}
                                onClick={() => handleNavigation('/modules/tesoreria')}
                            >
                                <Receipt className={`h-4 w-4 flex-shrink-0 ${currentPage === 'tesoreria' ? 'text-[#0075de]' : 'text-[#615d59] dark:text-[#a39e98]'}`} />
                                {showContent && <span>Tesorería</span>}
                            </button>
                        )}

                        {/* Admin Section */}
                        {isAdmin && (
                            <>
                                {showContent && (
                                    <div className="px-2.5 pt-3 pb-1 text-[11px] font-medium text-[#a39e98] dark:text-[#615d59] uppercase tracking-wider">
                                        Administración
                                    </div>
                                )}
                                <button
                                    className={getNavButtonClasses(currentPage === 'admin')}
                                    title={!showContent ? 'Configuración' : undefined}
                                    onClick={() => handleNavigation('/admin')}
                                >
                                    <Settings className={`h-4 w-4 flex-shrink-0 ${currentPage === 'admin' ? 'text-[#0075de]' : 'text-[#615d59] dark:text-[#a39e98]'}`} />
                                    {showContent && <span>Configuración</span>}
                                </button>

                                <button
                                    className={getNavButtonClasses(currentPage === 'admin')}
                                    title={!showContent ? 'Soporte' : undefined}
                                    onClick={() => handleNavigation('/admin/support')}
                                >
                                    <LifeBuoy className="h-4 w-4 text-[#615d59] dark:text-[#a39e98] flex-shrink-0" />
                                    {showContent && <span>Soporte</span>}
                                </button>
                            </>
                        )}
                    </div>
                </nav>

                {/* Utilidades de Barra Inferior: Tema y Notificaciones (Estilo Notion Footer) */}
                <div className={`px-2.5 py-1.5 border-t border-[#e6e6e6] dark:border-[#2e2e2e] flex items-center ${!showContent ? 'justify-center flex-col gap-1' : 'justify-between'}`}>
                    <div className="flex items-center gap-1">
                        <ThemeToggleButton />
                        <NotificationBell />
                    </div>
                    {showContent && (
                        <span className="text-[10px] text-[#a39e98] font-mono tracking-tighter">
                            v2.5 CISB
                        </span>
                    )}
                </div>

                {/* User Profile Dropdown - Fixed at bottom */}
                <div className="border-t border-[#e6e6e6] dark:border-[#2e2e2e]">
                    {user && <UserProfileDropdown user={user} collapsed={!showContent} />}
                </div>

                {/* Error Report Button - Fixed at bottom */}
                <div className={`${!showContent ? 'p-1.5' : 'p-2.5'} border-t border-[#e6e6e6] dark:border-[#2e2e2e] transition-all`}>
                    <ErrorReportButton collapsed={!showContent} />
                </div>
            </div>

            {/* Announcement Banner - Show only on desktop, or inside mobile sidebar if preferred. 
                Keeping it global as per original code, but note it might be covered on mobile if not careful. 
                The original code had check for sidebarCollapsed? No, it was outside.
            */}
            {!isMobile && <AnnouncementBanner />}
        </>
    );
}