"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Lock, CheckCircle, XCircle, Settings } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

export function ProfileSettingsDialog({ open, onOpenChange, user }: ProfileSettingsDialogProps) {
  const { currentTenant, currentRole } = useWorkspace();
  const { toast } = useToast();

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // UI state
  const [activeTab, setActiveTab] = useState('profile');
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open && user) {
      setProfileData({
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        email: user.email || ''
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [open, user]);

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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileLoading(true);

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Perfil actualizado",
          description: "Tu información personal ha sido actualizada exitosamente.",
        });
        onOpenChange(false);
        // Optionally refresh the page or update user context
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al actualizar el perfil",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Error de conexión. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas nuevas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsPasswordLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Contraseña cambiada",
          description: "Tu contraseña ha sido cambiada exitosamente. Serás redirigido al login.",
        });
        onOpenChange(false);
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al cambiar la contraseña",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Error de conexión. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Configuración de Cuenta
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.avatar} alt={getUserDisplayName()} />
            <AvatarFallback className="text-lg font-medium">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium text-lg">{getUserDisplayName()}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
            {currentRole && (
              <Badge variant="secondary" className="mt-1">
                {currentRole.name}
              </Badge>
            )}
          </div>
          {currentTenant && (
            <div className="text-right">
              <p className="text-sm font-medium">{currentTenant.name}</p>
              {currentTenant.code && (
                <p className="text-xs text-gray-500">({currentTenant.code})</p>
              )}
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Información Personal
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Cambiar Contraseña
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferencias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Ingresa tu nombre"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Ingresa tu apellido"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ingresa tu email"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isProfileLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isProfileLoading}>
                  {isProfileLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="password" className="space-y-4">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <PasswordInput
                id="currentPassword"
                label="Contraseña Actual"
                value={passwordData.currentPassword}
                onChange={(value) => setPasswordData(prev => ({ ...prev, currentPassword: value }))}
                placeholder="Ingresa tu contraseña actual"
                required
              />

              <PasswordInput
                id="newPassword"
                label="Nueva Contraseña"
                value={passwordData.newPassword}
                onChange={(value) => setPasswordData(prev => ({ ...prev, newPassword: value }))}
                placeholder="Ingresa tu nueva contraseña"
                required
              />

              <PasswordInput
                id="confirmPassword"
                label="Confirmar Nueva Contraseña"
                value={passwordData.confirmPassword}
                onChange={(value) => setPasswordData(prev => ({ ...prev, confirmPassword: value }))}
                placeholder="Confirma tu nueva contraseña"
                required
              />

              <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <strong>Requisitos de contraseña:</strong>
                <ul className="mt-1 ml-4 list-disc">
                  <li>Mínimo 8 caracteres</li>
                  <li>Debe coincidir en ambos campos</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPasswordLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cambiando...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Cambiar Contraseña
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Apariencia</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Tema de la aplicación</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Cambia entre modo claro y oscuro
                      </p>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Próximamente</h3>
                <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <span>Notificaciones push</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <span>Configuraciones regionales</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <span>Idioma de la aplicación</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}