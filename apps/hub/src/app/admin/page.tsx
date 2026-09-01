"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantsTab } from "@/components/admin/TenantsTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { RolesTab } from "@/components/admin/RolesTab";
import { AuditTab } from "@/components/admin/AuditTab";
import { AnnouncementsTab } from "@/components/admin/AnnouncementsTab";
import { ParametersTab } from "@/components/admin/ParametersTab";
import { PurgeTab } from "@/components/admin/PurgeTab";
import { Building2, Users, ShieldCheck, FileText, Megaphone, Sliders, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminPage() {

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex flex-col space-y-4 mb-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Dashboard Administrativo</h1>
                </div>
                <p className="text-muted-foreground dark:text-slate-400">
                    Gestiona hospitales, usuarios, roles, auditoría y parámetros arancelarios globales.
                </p>
            </div>

            <Tabs defaultValue="tenants" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 h-auto p-1 dark:bg-slate-800">
                    <TabsTrigger value="tenants" className="flex items-center gap-2 py-3">
                        <Building2 className="h-4 w-4" />
                        <span className="hidden md:inline">Hospitales</span>
                        <span className="md:hidden">Hospitales</span>
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center gap-2 py-3">
                        <Users className="h-4 w-4" />
                        <span className="hidden md:inline">Usuarios</span>
                        <span className="md:hidden">Usuarios</span>
                    </TabsTrigger>
                    <TabsTrigger value="roles" className="flex items-center gap-2 py-3">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="hidden md:inline">Roles</span>
                        <span className="md:hidden">Roles</span>
                    </TabsTrigger>
                    <TabsTrigger value="parameters" className="flex items-center gap-2 py-3">
                        <Sliders className="h-4 w-4" />
                        <span className="hidden md:inline">Parámetros</span>
                        <span className="md:hidden">Tarifas</span>
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="flex items-center gap-2 py-3">
                        <FileText className="h-4 w-4" />
                        <span className="hidden md:inline">Auditoría</span>
                        <span className="md:hidden">Logs</span>
                    </TabsTrigger>
                    <TabsTrigger value="announcements" className="flex items-center gap-2 py-3">
                        <Megaphone className="h-4 w-4" />
                        <span className="hidden md:inline">Anuncios</span>
                        <span className="md:hidden">Avisos</span>
                    </TabsTrigger>
                    <TabsTrigger value="purge" className="flex items-center gap-2 py-3 text-rose-600 dark:text-rose-400 font-semibold">
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden md:inline">Purgar Prueba</span>
                        <span className="md:hidden">Purga</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tenants" className="space-y-4">
                    <TenantsTab />
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                    <UsersTab />
                </TabsContent>

                <TabsContent value="roles" className="space-y-4">
                    <RolesTab />
                </TabsContent>

                <TabsContent value="parameters" className="space-y-4">
                    <ParametersTab />
                </TabsContent>

                <TabsContent value="audit" className="space-y-4">
                    <AuditTab />
                </TabsContent>

                <TabsContent value="announcements" className="space-y-4">
                    <AnnouncementsTab />
                </TabsContent>

                <TabsContent value="purge" className="space-y-4">
                    <PurgeTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
