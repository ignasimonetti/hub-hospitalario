"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Users, MapPin, Phone, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Tenant {
  id: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  active: boolean;
  created: string;
}

interface UserRole {
  id: string;
  user: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
  tenant: Tenant;
  assigned_by: string;
  assigned_at: string;
}

interface WorkspaceSelectorProps {
  userRoles: any[];
  onWorkspaceSelect: (tenant: Tenant, role: any) => void;
}

export function WorkspaceSelector({ userRoles, onWorkspaceSelect }: WorkspaceSelectorProps) {
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const router = useRouter();

  // Group roles by tenant
  const tenantRoles = userRoles.reduce((acc, userRole) => {
    const tenantId = userRole.tenant.id;
    if (!acc[tenantId]) {
      acc[tenantId] = {
        tenant: userRole.tenant,
        roles: []
      };
    }
    acc[tenantId].roles.push(userRole.role);
    return acc;
  }, {} as Record<string, { tenant: any; roles: any[] }>);

  const handleWorkspaceSelect = (tenantId: string) => {
    const workspace = tenantRoles[tenantId];
    if (workspace) {
      // For now, select the highest role if multiple roles exist
      const selectedRole = workspace.roles.reduce((prev: any, current: any) => {
        // Simple role hierarchy - you might want to implement a proper hierarchy system
        const roleOrder = ['superadmin', 'admin', 'doctor', 'nurse', 'staff'];
        const prevIndex = roleOrder.indexOf(prev.name);
        const currentIndex = roleOrder.indexOf(current.name);
        return currentIndex > prevIndex ? current : prev;
      });

      onWorkspaceSelect(workspace.tenant, selectedRole);
      setSelectedWorkspace(tenantId);
    }
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'superadmin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'doctor':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4"
          >
            <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Seleccionar Espacio de Trabajo
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Elige el hospital donde deseas trabajar hoy
          </p>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(tenantRoles).map(([tenantId, workspaceData]: [string, any], index) => {
            const { tenant, roles } = workspaceData;
            return (
              <motion.div
                key={tenantId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                    selectedWorkspace === tenantId
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                  onClick={() => handleWorkspaceSelect(tenantId)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-gray-900 dark:text-white mb-1">
                          {tenant.name}
                        </CardTitle>
                        {tenant.code && (
                          <CardDescription className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {tenant.code}
                          </CardDescription>
                        )}
                      </div>
                      {selectedWorkspace === tenantId && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Roles */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tus roles en este hospital:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {roles.map((role: any, roleIndex: number) => (
                          <Badge
                            key={roleIndex}
                            variant={getRoleBadgeVariant(role.name)}
                            className="text-xs"
                          >
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Hospital Info */}
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      {tenant.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{tenant.address}</span>
                        </div>
                      )}
                      {tenant.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{tenant.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${tenant.active ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {tenant.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant={selectedWorkspace === tenantId ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWorkspaceSelect(tenantId);
                        }}
                        className="text-xs"
                      >
                        {selectedWorkspace === tenantId ? 'Seleccionado' : 'Seleccionar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Puedes cambiar de hospital en cualquier momento desde el menú de usuario
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}