"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantsTab } from "@/components/admin/TenantsTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { RolesTab } from "@/components/admin/RolesTab";
import { AuditTab } from "@/components/admin/AuditTab";
import { AnnouncementsTab } from "@/components/admin/AnnouncementsTab";
import { Building2, Users, ShieldCheck, FileText, ArrowLeft, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AdminPage() {
    const router = useRouter();

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex flex-col space-y-4 mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard Administrativo</h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400 ml-14">
                    Gestiona hospitales, usuarios, roles y auditoría del sistema desde un solo lugar.
                </p>
            </div>

            <Tabs defaultValue="tenants" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1">
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

                <TabsContent value="audit" className="space-y-4">
                    <AuditTab />
                </TabsContent>

                <TabsContent value="announcements" className="space-y-4">
                    <AnnouncementsTab />
                </TabsContent>
            </Tabs>
        </div >
    );
}
