"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Search, MoreHorizontal, Edit, Trash2, Lock } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleSheet } from "./RoleSheet";
import { getRoles, deleteRole } from '@/app/actions/roles';
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function RolesTab() {
    const [roles, setRoles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);

    // Delete Dialog State
    const [roleToDelete, setRoleToDelete] = useState<any>(null);

    const fetchRoles = async () => {
        setIsLoading(true);
        const result = await getRoles();
        if (result.success) {
            setRoles(JSON.parse(JSON.stringify(result.data)));
        } else {
            toast.error("Error al cargar roles");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleCreateRole = () => {
        setEditingRole(null);
        setIsSheetOpen(true);
    };

    const handleEditRole = (role: any) => {
        setEditingRole(role);
        setIsSheetOpen(true);
    };

    const handleDeleteClick = (role: any) => {
        if (role.type === 'system') {
            toast.error("No se pueden eliminar roles de sistema");
            return;
        }
        setRoleToDelete(role);
    };

    const confirmDelete = async () => {
        if (!roleToDelete) return;

        const result = await deleteRole(roleToDelete.id);
        if (result.success) {
            toast.success("Rol eliminado correctamente");
            fetchRoles();
        } else {
            toast.error(result.error || "Error al eliminar el rol");
        }
        setRoleToDelete(null);
    };

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Roles y Permisos</h2>
                    <p className="text-muted-foreground">
                        Gestiona los perfiles de acceso y sus capacidades en el sistema.
                    </p>
                </div>
                <Button onClick={handleCreateRole} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar roles..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Roles Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rol</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                                <TableHead>Permisos</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Cargando roles...
                                    </TableCell>
                                </TableRow>
                            ) : filteredRoles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No se encontraron roles.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRoles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <Shield className="h-4 w-4" />
                                                </div>
                                                {role.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                                                {role.slug}
                                            </code>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">
                                            {role.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {(() => {
                                                    if (!role.permissions || role.permissions.length === 0) {
                                                        return <span className="text-muted-foreground text-xs">Sin permisos</span>;
                                                    }

                                                    // Extract unique resources from permissions
                                                    const resources = Array.from(new Set(
                                                        role.permissions.map((p: any) => p.resource || 'general')
                                                    )) as string[];

                                                    const displayLimit = 2;
                                                    const visibleResources = resources.slice(0, displayLimit);
                                                    const remainingCount = resources.length - displayLimit;

                                                    return (
                                                        <>
                                                            {visibleResources.map(res => (
                                                                <Badge key={res} variant="secondary" className="capitalize text-xs font-normal">
                                                                    {res === 'general' ? 'General' : res}
                                                                </Badge>
                                                            ))}

                                                            {remainingCount > 0 && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Badge variant="outline" className="text-xs font-normal cursor-help">
                                                                                +{remainingCount} más
                                                                            </Badge>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <div className="flex flex-col gap-1">
                                                                                <span className="font-semibold text-xs mb-1">Módulos adicionales:</span>
                                                                                {resources.slice(displayLimit).map(res => (
                                                                                    <span key={res} className="capitalize text-xs">• {res}</span>
                                                                                ))}
                                                                            </div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {role.type === 'system' ? (
                                                <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                                                    Sistema
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">Personalizado</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditRole(role)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>

                                                {role.type !== 'system' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteClick(role)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {role.type === 'system' && (
                                                    <Button variant="ghost" size="icon" disabled className="opacity-50">
                                                        <Lock className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Role Sheet (Create/Edit) */}
            <RoleSheet
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                role={editingRole}
                onSuccess={fetchRoles}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente el rol <strong>{roleToDelete?.name}</strong>.
                            Los usuarios que tengan este rol perderán los permisos asociados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
