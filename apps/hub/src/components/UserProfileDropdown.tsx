"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Settings,
  LogOut,
  ChevronUp,
  ChevronDown,
  Hospital,
  HelpCircle,
  Bell,
  Palette
} from "lucide-react";
import { signOut } from "@/lib/auth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { ProfileSettingsDialog } from "@/components/ProfileSettingsDialog";

interface UserProfileDropdownProps {
  user: any;
  collapsed?: boolean;
}

export function UserProfileDropdown({ user, collapsed = false }: UserProfileDropdownProps) {
  const router = useRouter();
  const { currentTenant, currentRole } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // Force re-render when workspace data changes
  const [workspaceData, setWorkspaceData] = useState({ tenant: currentTenant, role: currentRole });

  useEffect(() => {
    setWorkspaceData({ tenant: currentTenant, role: currentRole });
  }, [currentTenant, currentRole]);


  const getUserDisplayName = () => {
    if (!user) return 'Usuario';
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';

    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }

    return user.email || 'Usuario';
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';

    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    return user.email?.charAt(0).toUpperCase() || 'U';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  const handleSettings = () => {
    setIsOpen(false); // Close dropdown
    setShowSettingsDialog(true);
  };

  const handleHelp = () => {
    router.push('/help');
  };


  return (
    <div className={`${collapsed ? 'p-2' : 'p-4'} border-t border-gray-200 dark:border-slate-700`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`${collapsed ? 'w-full justify-center p-2' : 'w-full flex items-center gap-3 p-0'} h-auto hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors`}
            title={collapsed ? getUserDisplayName() : undefined}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} alt={getUserDisplayName()} />
              <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 text-sm font-medium">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email}</p>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                </motion.div>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <AnimatePresence>
          {isOpen && (
            <DropdownMenuContent
              align="start"
              className="w-64 mb-2"
              asChild
            >
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {/* User Info Header */}
                <DropdownMenuLabel className="flex items-center gap-3 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar} alt={getUserDisplayName()} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Hospital Info */}
                {workspaceData.tenant ? (
                  <>
                    <div className="px-3 py-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Hospital className="h-3 w-3 text-gray-500" />
                        <span className="font-medium">{workspaceData.tenant?.name}</span>
                        {workspaceData.tenant?.code && (
                          <span className="text-gray-500">({workspaceData.tenant.code})</span>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                ) : (
                  <>
                    <div className="px-3 py-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Hospital className="h-3 w-3 text-gray-500" />
                        <span>No se ha seleccionado un hospital</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Menu Items */}
                <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Mi Perfil</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleHelp} className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Centro de Ayuda</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </motion.div>
            </DropdownMenuContent>
          )}
        </AnimatePresence>
      </DropdownMenu>

      {/* Profile Settings Dialog */}
      <ProfileSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        user={user}
      />
    </div>
  );
}