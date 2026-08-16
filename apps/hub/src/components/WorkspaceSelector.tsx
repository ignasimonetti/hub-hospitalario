"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Phone, ArrowRight, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

  const tenantCount = Object.keys(tenantRoles).length;

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
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Seleccionar Espacio de Trabajo
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Selecciona la institución a la que deseas acceder
          </p>
        </div>

        {/* Workspace Cards Grid */}
        <div className={tenantCount === 1 ? "flex justify-center" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
          {Object.entries(tenantRoles).map(([tenantId, workspaceData]: [string, any], index) => {
            const { tenant, roles } = workspaceData;
            const isSelected = selectedWorkspace === tenantId;
            const isCISB = tenant.name?.toLowerCase().includes("banda") || tenant.name?.toLowerCase().includes("cisb") || tenant.code?.toLowerCase().includes("cisb");

            // Nombre institucional completo para el CISB
            const displayName = isCISB ? "Centro Integral de Salud Banda" : tenant.name;
            const subtitle = isCISB ? "Dr. Ricardo Pololo Abdala" : null;

            return (
              <motion.div
                key={tenantId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
                className={tenantCount === 1 ? "w-full max-w-md" : undefined}
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-xl backdrop-blur-md border overflow-hidden ${
                    isSelected
                      ? 'border-[#08487A] bg-sky-50/50 dark:bg-sky-950/30 shadow-sky-100 dark:shadow-none'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-[#08487A]/40 dark:hover:border-sky-800'
                  }`}
                  onClick={() => handleWorkspaceSelect(tenantId)}
                >
                  <CardContent className="p-0">
                    {/* Título y Logo centrados */}
                    <div className="pt-6 pb-4 px-5 text-center">
                      <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {displayName}
                      </h3>
                      {subtitle && (
                        <p className="text-sm text-[#08487A] dark:text-sky-400 font-semibold mt-0.5 tracking-wide uppercase">
                          {subtitle}
                        </p>
                      )}
                      {tenant.code && !subtitle && (
                        <p className="text-xs text-sky-600 dark:text-sky-400 font-medium tracking-wide uppercase mt-1">
                          {tenant.code}
                        </p>
                      )}

                      {/* Logo centrado */}
                      <div className="mt-4 flex justify-center">
                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 inline-flex items-center justify-center shadow-sm">
                          {isCISB ? (
                            <Image
                              src="/assets/cisb.png"
                              alt="Centro Integral de Salud Banda"
                              width={200}
                              height={80}
                              className="h-16 md:h-20 w-auto max-w-[180px] md:max-w-[200px] object-contain"
                            />
                          ) : (
                            <Building2 className="w-12 h-12 text-sky-600 dark:text-sky-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contenido inferior */}
                    <div className="px-5 pb-5 space-y-4">
                      {/* Roles Badges */}
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium text-center">
                          Roles asignados:
                        </p>
                        <div className="flex flex-wrap gap-1.5 justify-center">
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
                        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                          {tenant.address && (
                            <div className="flex items-center gap-1.5 justify-center truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{tenant.address}</span>
                            </div>
                          )}
                          {tenant.phone && (
                            <div className="flex items-center gap-1.5 justify-center">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{tenant.phone}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Button con azul institucional */}
                      <Button
                        className="w-full mt-2 transition-colors font-semibold text-sm py-2.5 bg-[#08487A] hover:bg-[#053D6C] text-white shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWorkspaceSelect(tenantId);
                        }}
                      >
                        <span>Seleccionar</span>
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
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