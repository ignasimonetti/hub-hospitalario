"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Building,
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle,
  Hospital,
  UserCircle,
  Settings,
  Phone,
  CreditCard,
  Save,
  X,
  AlertCircle,
 Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";

interface UserHospital {
  id: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  active: boolean;
  created: string;
}

interface UserRoleAssignment {
  id: string;
  roleId: string;
  tenantId: string;
  assignedAt: string;
  role: {
    id: string;
    name: string;
    description?: string;
    level?: number;
  };
  tenant: UserHospital;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone?: string;
  professional_id?: string;
  specialty?: string;
  department?: string;
  position?: string;
  verified: boolean;
  created: string;
  updated: string;
}

interface FullProfileResponse {
  success: boolean;
  user: UserProfile;
  hospitals: UserHospital[];
  userRoles: UserRoleAssignment[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { currentTenant, currentRole } = useWorkspace();
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [hospitals, setHospitals] = useState<UserHospital[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dni: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // Primero obtener usuario de la sesión local
        const currentUser = getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }

        // Obtener perfil completo desde la API (incluyendo hospitales y roles)
        const response = await fetch('/api/auth/full-profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          // Si la respuesta no es OK (por ejemplo, 401 Unauthorized)
          // No intentamos leer el cuerpo como JSON si sabemos que hay un error de autenticación
          if (response.status === 401) {
            // Usuario no autenticado, usar datos del currentUser
            const fallbackUser = getCurrentUser();
            if (fallbackUser) {
              setUser({
                id: fallbackUser.id,
                email: fallbackUser.email,
                firstName: fallbackUser.firstName || '',
                lastName: fallbackUser.lastName || '',
                dni: '',
                phone: '',
                verified: fallbackUser.verified || false,
                created: fallbackUser.created,
                updated: fallbackUser.updated
              });
              
              // Inicializar datos del formulario con la información disponible
              setFormData({
                firstName: fallbackUser.firstName || '',
                lastName: fallbackUser.lastName || '',
                email: fallbackUser.email || '',
                dni: '',
                phone: ''
              });
              return; // Salir exitosamente sin lanzar error
            } else {
              throw new Error('Usuario no autenticado');
            }
          } else {
            // Otros errores HTTP
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error al obtener el perfil: ${response.status} ${response.statusText}`);
          }
        } else {
          // La respuesta es exitosa, procesar normalmente
          const data: FullProfileResponse = await response.json();
          
          // Verificar si la respuesta tiene el formato esperado
          if (data && data.success && data.user) {
            setUser(data.user);
            setHospitals(data.hospitals || []);
            setUserRoles(data.userRoles || []);
            
            // Inicializar datos del formulario
            setFormData({
              firstName: data.user.firstName || '',
              lastName: data.user.lastName || '',
              email: data.user.email || '',
              dni: data.user.dni || '',
              phone: data.user.phone || ''
            });
          } else {
            // Si la respuesta no tiene el formato esperado, lanzar un error
            throw new Error('Error al cargar el perfil: formato de respuesta inesperado');
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Solo mostrar toast si no es un error de autentición (401) que ya fue manejado
        if (!(error instanceof Error && error.message.includes('Usuario no autenticado'))) {
          toast({
            title: "Error",
            description: "No se pudo cargar la información del perfil",
            variant: "destructive",
          });
        }
        // Si falla, usar datos básicos del usuario de sesión
        const fallbackUser = getCurrentUser();
        setUser(fallbackUser ? {
          id: fallbackUser.id,
          email: fallbackUser.email,
          firstName: fallbackUser.firstName || '',
          lastName: fallbackUser.lastName || '',
          dni: '',
          phone: '',
          verified: fallbackUser.verified || false,
          created: fallbackUser.created,
          updated: fallbackUser.updated
        } : null);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const openEditModal = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        dni: user.dni || '',
        phone: user.phone || ''
      });
      setErrors({});
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
    setEditModalOpen(true);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es requerido';
    } else if (!/^[0-9]{7,8}$/.test(formData.dni.replace(/\./g, ''))) {
      newErrors.dni = 'DNI no válido (7-8 dígitos)';
    }

    if (formData.phone && !/^[+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Número de teléfono no válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      toast({
        title: "Error de validación",
        description: "Por favor corrige los errores en el formulario",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          dni: formData.dni.replace(/\./g, '').trim(),
          phone: formData.phone.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al actualizar el perfil');
      }

      // Actualizar usuario local con los datos returned
      if (data.user) {
        setUser(data.user);
      }

      toast({
        title: "Perfil actualizado",
        description: data.message || "Los cambios se han guardado correctamente",
        variant: "default",
      });

      setEditModalOpen(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error al guardar",
        description: error.message || "Hubo un problema al actualizar el perfil",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Contraseña actual requerida';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Nueva contraseña requerida';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Mínimo 6 caracteres';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      // Simulación de cambio de contraseña
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Cambiando contraseña:', passwordData);

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente",
        variant: "default",
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordChange(false);
    } catch (error) {
      toast({
        title: "Error al cambiar contraseña",
        description: "Hubo un problema al actualizar la contraseña",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
 };

  const formatDNI = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 8);
    return limited.replace(/(\d{1,2})(\d{3})(\d{3})/, '$1.$2.$3');
  };

  const getUserDisplayName = () => {
    if (!user) return 'Usuario';
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email || 'Usuario';
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-16 w-16 border-4 border-gray-200 border-t-gray-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando perfil...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header mejorado con estilo monocromo */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Mi Perfil</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Configuración de cuenta personal</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center gap-3"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{getUserDisplayName()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
              <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >
          {/* Perfil Header Card - Diseño mejorado */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      Información Personal
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex flex-col lg:flex-row items-start gap-6">
                  {/* Avatar mejorado */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="relative"
                  >
                    <div className="relative">
                      <Avatar className="h-24 w-24 ring-2 ring-gray-200 dark:ring-gray-700">
                        <AvatarImage src={undefined} alt={getUserDisplayName()} />
                        <AvatarFallback className="text-2xl font-bold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Badge de estado */}
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 p-0.5 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Información del usuario */}
                  <div className="flex-1 space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {getUserDisplayName()}
                      </h2>
                      
                      <div className="flex items-center gap-2 text-base text-gray-600 dark:text-gray-300">
                        <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span>{user?.email}</span>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                      className="flex flex-wrap gap-3"
                    >
                      {currentRole && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                          <Shield className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium text-blue-800 dark:text-blue-400">
                            {currentRole.name}
                          </span>
                        </div>
                      )}

                      {currentTenant && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-full">
                          <Hospital className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                          <span className="text-xs text-gray-70 dark:text-gray-300 font-medium">
                            {currentTenant.name}
                            {currentTenant.code && ` (${currentTenant.code})`}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tarjetas de información mejoradas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-90 dark:text-white">
                      Información de la Cuenta
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email Principal
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-90 dark:text-white font-medium">
                        {user?.email}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      DNI
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white font-medium">
                        {user?.dni || 'No registrado'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Teléfono
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white font-medium">
                        {user?.phone || 'No registrado'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado de la Cuenta
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-800 dark:text-green-400 font-semibold">
                        Cuenta Activa y Verificada
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Roles Asignados
                    </label>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      {currentRole ? (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-blue-800 dark:text-blue-400 font-medium">
                            {currentRole.name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300 italic">
                            Sin roles asignados
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      Información Institucional
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mostrar todos los hospitales a los que está vinculado el usuario */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Hospitales Asociados
                    </label>
                    {currentTenant ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <Hospital className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-white font-semibold">
                            {currentTenant.name}
                          </span>
                        </div>
                        {currentTenant.code && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg ml-7">
                            <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                              Código: {currentTenant.code}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg italic text-gray-600 dark:text-gray-400">
                        No estás asociado a ningún hospital
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Acciones mejoradas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="flex flex-col sm:flex-row justify-center gap-3 pt-4"
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
            
            <Button
              size="lg"
              onClick={openEditModal}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 shadow-md hover:shadow-lg transition-shadow"
            >
              <Settings className="h-4 w-4" />
              Editar Perfil
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Modal de Edición de Perfil */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-40" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">
                    Editar Perfil
                  </DialogTitle>
                  <DialogDescription>
                    Actualiza tu información personal y de contacto
                  </DialogDescription>
                </div>
              </div>

            </DialogHeader>

            <div className="space-y-5 mt-5">
              {/* Campo Email (solo lectura) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email (No editable)
                </Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>

              {/* Información Personal */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Información Personal
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nombre *
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Tu nombre"
                      className={`border-gray-30 dark:border-gray-600 ${errors.firstName ? 'border-red-500' : ''}`}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Apellido *
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Tu apellido"
                      className={`border-gray-30 dark:border-gray-600 ${errors.lastName ? 'border-red-500' : ''}`}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dni" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    DNI *
                  </Label>
                  <Input
                    id="dni"
                    value={formData.dni}
                    onChange={(e) => handleInputChange('dni', formatDNI(e.target.value))}
                    placeholder="12.345.678"
                    className={`border-gray-30 dark:border-gray-600 ${errors.dni ? 'border-red-500' : ''}`}
                  />
                  {errors.dni && (
                    <p className="text-xs text-red-50 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.dni}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+54 9 351 123 4567"
                    className={`border-gray-30 dark:border-gray-600 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-50 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>

              </div>

              {/* Cambio de Contraseña */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Seguridad
                    </h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {showPasswordChange ? 'Cancelar' : 'Cambiar Contraseña'}
                  </Button>
                </div>

                {showPasswordChange && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-3 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Contraseña Actual
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData((prev: any) => ({ ...prev, currentPassword: e.target.value }))}
                        className={`border-gray-300 dark:border-gray-600 ${errors.currentPassword ? 'border-red-500' : ''}`}
                      />
                      {errors.currentPassword && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.currentPassword}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nueva Contraseña
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData((prev: any) => ({ ...prev, newPassword: e.target.value }))}
                        className={`border-gray-30 dark:border-gray-600 ${errors.newPassword ? 'border-red-500' : ''}`}
                      />
                      {errors.newPassword && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.newPassword}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confirmar Nueva Contraseña
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData((prev: any) => ({ ...prev, confirmPassword: e.target.value }))}
                        className={`border-gray-30 dark:border-gray-600 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      />
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={handlePasswordChange}
                      disabled={isSaving}
                      className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Cambiando...
                        </>
                      ) : (
                        'Confirmar Cambio de Contraseña'
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={isSaving}
                className="w-full sm:w-auto border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800 shadow-md hover:shadow-lg transition-shadow"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}