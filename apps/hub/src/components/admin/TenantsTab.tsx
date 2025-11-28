"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Building2, Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";
import { getTenants, deleteTenant } from "@/app/actions/tenants";
import { TenantSheet } from "./TenantSheet";
import { pocketbase } from "@/lib/auth";

export function TenantsTab() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tenantToDelete, setTenantToDelete] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        setLoading(true);
        try {
            const result = await getTenants();
            if (result.success && result.data) {
                setTenants(result.data);
            }
        } catch (error) {
            console.error("Error loading tenants:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewTenant = () => {
        setSelectedTenant(null);
        setSheetOpen(true);
    };

    const handleEditTenant = (tenant: any) => {
        setSelectedTenant(tenant);
        setSheetOpen(true);
    };

    const handleDeleteClick = (tenant: any) => {
        setTenantToDelete(tenant);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!tenantToDelete) return;

        setIsDeleting(true);
        try {
            const result = await deleteTenant(tenantToDelete.id);
            if (result.success) {
                await loadTenants();
                setDeleteDialogOpen(false);
                setTenantToDelete(null);
            }
        } catch (error) {
            console.error("Error deleting tenant:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredTenants = tenants.filter(tenant =>
        tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTenantLogoUrl = (tenant: any) => {
        if (tenant.logo) {
            return pocketbase.files.getURL(tenant, tenant.logo, { thumb: '40x40' });
        }
        return undefined;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando hospitales...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Administración de Hospitales</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Gestiona los hospitales (tenants) registrados en la plataforma
                    </p>
                </div>
                <Button onClick={handleNewTenant}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Hospital
                </Button>
            </div>

            {/* Stats Card */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center">
                        <Building2 className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                            <p className="text-2xl font-bold">{tenants.length}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Hospitales</p>
                        </div>
                        <div className="ml-auto">
                            <Badge variant="outline" className="text-green-600 border-green-600">
                                {tenants.filter(t => t.is_active).length} Activos
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Search */}
            <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Buscar hospitales..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Tenants Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Lista de Hospitales
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Hospital</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha de Creación</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTenants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        {tenants.length === 0 ? "No hay hospitales registrados" : "No se encontraron hospitales"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTenants.map((tenant) => (
                                    <TableRow key={tenant.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={getTenantLogoUrl(tenant)} alt={tenant.name} />
                                                    <AvatarFallback className="bg-blue-600 text-white">
                                                        {tenant.name?.charAt(0).toUpperCase() || 'H'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{tenant.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                {tenant.slug}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            {tenant.is_active ? (
                                                <Badge variant="outline" className="text-green-600 border-green-600">Activo</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-600 border-gray-600">Inactivo</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(tenant.created).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditTenant(tenant)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeleteClick(tenant)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Tenant Sheet (Create/Edit) */}
            <TenantSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                tenant={selectedTenant}
                onSuccess={loadTenants}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente el hospital <strong>{tenantToDelete?.name}</strong> y todos sus datos asociados.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                "Eliminar"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
