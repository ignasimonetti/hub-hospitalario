"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

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
  name: string;
  slug: string;
  description?: string;
  level?: number;
}

interface UserRoleAssignment {
  role: UserRole;
  tenant: Tenant;
}

interface WorkspaceSelectorProps {
  userRoles: UserRoleAssignment[];
  onWorkspaceSelect: (tenant: Tenant, role: UserRole) => void;
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
  }, {} as Record<string, { tenant: Tenant; roles: UserRole[] }>);

  const handleWorkspaceSelect = (tenantId: string) => {
    const workspace = tenantRoles[tenantId];
    if (workspace) {
      const selectedRole = workspace.roles.reduce((prev: UserRole, current: UserRole) => {
        return (current.level || 0) < (prev.level || 0) ? current : prev;
      }, workspace.roles[0]);

      onWorkspaceSelect(workspace.tenant, selectedRole);
      setSelectedWorkspace(tenantId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-200/40 dark:bg-sky-900/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl relative z-10"
      >
        {/* Header with CISB Logo */}
        <div className="text-center mb-10 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-4"
          >
            <Image
              src="/assets/cisb.png"
              alt="CISB Logo"
              width={160}
              height={50}
              className="h-14 w-auto object-contain dark:brightness-110"
              priority
            />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Seleccionar Espacio de Trabajo
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Selecciona la institución a la que deseas acceder para iniciar tu jornada laboral.
          </p>
        </div>

        {/* Workspace Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(tenantRoles).map(([tenantId, workspaceData]: [string, any], index) => {
            const { tenant, roles } = workspaceData;
            const isSelected = selectedWorkspace === tenantId;

            return (
              <motion.div
                key={tenantId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-xl backdrop-blur-md border ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 shadow-sky-100 dark:shadow-none'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-sky-300 dark:hover:border-sky-800'
                  }`}
                  onClick={() => handleWorkspaceSelect(tenantId)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                          {tenant.name}
                        </CardTitle>
                        {tenant.code && (
                          <CardDescription className="text-xs text-sky-600 dark:text-sky-400 font-medium tracking-wide uppercase">
                            {tenant.code}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Roles Badges */}
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium">
                        Roles asignados:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {roles.map((role: UserRole) => (
                          <Badge
                            key={role.id}
                            variant="secondary"
                            className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50 text-[11px] font-normal"
                          >
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Address / Details */}
                    {(tenant.address || tenant.phone) && (
                      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        {tenant.address && (
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{tenant.address}</span>
                          </div>
                        )}
                        {tenant.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{tenant.phone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      className={`w-full mt-2 transition-all ${
                        isSelected
                          ? 'bg-sky-600 hover:bg-sky-700 text-white'
                          : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-sky-600 dark:hover:bg-sky-500 dark:hover:text-white'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWorkspaceSelect(tenantId);
                      }}
                    >
                      <span>Ingresar</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}