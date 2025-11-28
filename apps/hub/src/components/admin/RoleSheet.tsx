'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield, Check, X } from "lucide-react";
import { createRole, updateRole, getPermissions } from '@/app/actions/roles';
import { toast } from "sonner";

interface RoleSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    role?: any; // Role to edit, null for create
    onSuccess: () => void;
}

export function RoleSheet({ isOpen, onOpenChange, role, onSuccess }: RoleSheetProps) {
    const isEditing = !!role;
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    // Data State
    const [allPermissions, setAllPermissions] = useState<any[]>([]);
    const [groupedPermissions, setGroupedPermissions] = useState<Record<string, any[]>>({});

    // Load permissions on mount
    useEffect(() => {
        const fetchPermissions = async () => {
            setIsLoading(true);
            const result = await getPermissions();
            if (result.success) {
                setAllPermissions(result.data);
                groupPermissions(result.data);
            }
            setIsLoading(false);
        };

        if (isOpen) {
            fetchPermissions();
        }
    }, [isOpen]);

    // Initialize form when role changes
    useEffect(() => {
        if (role) {
            setName(role.name);
            setDescription(role.description || '');
            setSelectedPermissions(role.permissions?.map((p: any) => p.id) || []);
        } else {
            setName('');
            setDescription('');
            setSelectedPermissions([]);
        }
    }, [role, isOpen]);

    // Group permissions by resource (e.g., 'patients.view' -> 'patients')
    const groupPermissions = (perms: any[]) => {
        const groups: Record<string, any[]> = {};

        perms.forEach(perm => {
            // Use resource field directly from DB
            const resource = perm.resource || 'general';

            if (!groups[resource]) {
                groups[resource] = [];
            }
            groups[resource].push(perm);
        });

        setGroupedPermissions(groups);
    };

    const handlePermissionToggle = (permId: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permId)
                ? prev.filter(id => id !== permId)
                : [...prev, permId]
        );
    };

    const handleGroupToggle = (resource: string, permissions: any[]) => {
        const groupIds = permissions.map(p => p.id);
        const allSelected = groupIds.every(id => selectedPermissions.includes(id));

        if (allSelected) {
            // Deselect all
            setSelectedPermissions(prev => prev.filter(id => !groupIds.includes(id)));
        } else {
            // Select all
            const newSelected = [...selectedPermissions];
            groupIds.forEach(id => {
                if (!newSelected.includes(id)) newSelected.push(id);
            });
            setSelectedPermissions(newSelected);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('permissions', JSON.stringify(selectedPermissions));

        try {
            let result;
            if (isEditing) {
                result = await updateRole(role.id, formData);
            } else {
                result = await createRole(formData);
            }

            if (result.success) {
                toast.success(isEditing ? "Rol actualizado" : "Rol creado exitosamente");
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(result.error || "Error al guardar el rol");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl w-full overflow-y-auto bg-white dark:bg-slate-950 border-l shadow-2xl p-0">
                <div className="p-6">
                    <SheetHeader className="border-b pb-4 mb-6">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Shield className="h-5 w-5 text-primary" />
                            </div>
                            {isEditing ? 'Editar Rol' : 'Nuevo Rol'}
                        </SheetTitle>
                        <SheetDescription>
                            Define los permisos y accesos para este perfil de usuario.
                        </SheetDescription>
                    </SheetHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Rol</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Médico Auditor"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe las responsabilidades de este rol..."
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Matriz de Permisos</Label>
                                <Badge variant="outline" className="text-xs">
                                    {selectedPermissions.length} seleccionados
                                </Badge>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {Object.entries(groupedPermissions).map(([resource, perms]) => {
                                        const groupIds = perms.map(p => p.id);
                                        const allSelected = groupIds.every(id => selectedPermissions.includes(id));
                                        const someSelected = groupIds.some(id => selectedPermissions.includes(id));

                                        return (
                                            <Card key={resource} className="border-l-4 border-l-primary/20">
                                                <CardHeader className="py-3 px-4 bg-muted/30 flex flex-row items-center justify-between space-y-0">
                                                    <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
                                                        {resource === 'general' ? 'General' : resource}
                                                    </CardTitle>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-xs"
                                                        onClick={() => handleGroupToggle(resource, perms)}
                                                    >
                                                        {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                                                    </Button>
                                                </CardHeader>
                                                <CardContent className="py-3 px-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {perms.map(perm => (
                                                            <div key={perm.id} className="flex items-start space-x-2">
                                                                <Checkbox
                                                                    id={perm.id}
                                                                    checked={selectedPermissions.includes(perm.id)}
                                                                    onCheckedChange={() => handlePermissionToggle(perm.id)}
                                                                />
                                                                <div className="grid gap-1.5 leading-none">
                                                                    <label
                                                                        htmlFor={perm.id}
                                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                                    >
                                                                        {perm.name || perm.slug}
                                                                    </label>
                                                                    {perm.description && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {perm.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <SheetFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Guardar Cambios' : 'Crear Rol'}
                            </Button>
                        </SheetFooter>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
