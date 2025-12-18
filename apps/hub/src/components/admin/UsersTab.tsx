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
import { Users, Plus, Edit, Trash2, Search, Loader2, UserCheck, UserX, UserCog } from "lucide-react";
import { getUsers, deleteUser, toggleUserStatus, updateUser } from "@/app/actions/users";
import { UserSheet } from "./UserSheet";
import { pocketbase } from "@/lib/auth";

export function UsersTab() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        console.log('[UsersTab] Loading users...');
        try {
            const result = await getUsers();
            console.log('[UsersTab] getUsers result:', {
                success: result.success,
                dataLength: result.data?.length,
                error: result.error,
            });

            if (result.success && result.data) {
                console.log('[UsersTab] Setting users:', result.data.length, 'users');
                setUsers(result.data);
            } else {
                console.error('[UsersTab] Failed to load users:', result.error);
            }
        } catch (error) {
            console.error("[UsersTab] Error loading users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewUser = () => {
        setSelectedUser(null);
        setSheetOpen(true);
    };

    const handleEditUser = (user: any) => {
        setSelectedUser(user);
        setSheetOpen(true);
    };

    const handleDeleteClick = (user: any) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            const result = await deleteUser(userToDelete.id);
            if (result.success) {
                await loadUsers();
                setDeleteDialogOpen(false);
                setUserToDelete(null);
            }
        } catch (error) {
            console.error("Error deleting user:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleStatus = async (user: any) => {
        setIsToggling(user.id);
        try {
            const newStatus = !(user.active !== false);
            const result = await toggleUserStatus(user.id, newStatus);
            if (result.success) {
                await loadUsers();
            }
        } catch (error) {
            console.error("Error toggling user status:", error);
        } finally {
            setIsToggling(null);
        }
    };

    const handleToggleVerified = async (user: any) => {
        setIsToggling(user.id);
        try {
            const formData = new FormData();
            formData.append('verified', String(!user.verified));
            const result = await updateUser(user.id, formData);
            if (result.success) {
                await loadUsers();
            }
        } catch (error) {
            console.error("Error toggling user verification:", error);
        } finally {
            setIsToggling(null);
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getUserAvatarUrl = (user: any) => {
        if (!user || !user.avatar) return undefined;
        return pocketbase.files.getURL(user, user.avatar, { thumb: '40x40' });
    };

    const getInitials = (user: any) => {
        if (!user) return "U";
        const first = user.firstName?.charAt(0).toUpperCase() || "";
        const last = user.lastName?.charAt(0).toUpperCase() || "";
        return first + last || user.email?.charAt(0).toUpperCase() || "U";
    };

    const getFullName = (user: any) => {
        if (!user) return "";
        const firstName = user.firstName || "";
        const lastName = user.lastName || "";
        return `${firstName} ${lastName}`.trim() || user.email || "";
    };

    const verifiedUsers = users.filter(u => u.verified);
    const inactiveUsers = users.filter(u => u.active === false);
    const usersWithoutRoles = users.filter(u => !u.expand || !u.expand.hub_user_roles_via_user || u.expand.hub_user_roles_via_user.length === 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando usuarios...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Administración de Usuarios</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Gestiona usuarios del sistema y asigna roles de acceso
                    </p>
                </div>
                <Button onClick={handleNewUser}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold">{users.length}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Usuarios</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <UserCheck className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold">{verifiedUsers.length}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Emails Verificados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <UserX className="h-8 w-8 text-red-600" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold">{inactiveUsers.length}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Sin Activar</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <UserCog className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold">{usersWithoutRoles.length}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Sin Roles</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Buscar usuarios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Lista de Usuarios
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Roles</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        {users.length === 0 ? "No hay usuarios registrados" : "No se encontraron usuarios"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={getUserAvatarUrl(user)} alt={getFullName(user)} />
                                                    <AvatarFallback className="bg-blue-600 text-white">
                                                        {getInitials(user)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{getFullName(user)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span>{user.email}</span>
                                                {user.verified && (
                                                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                                        ✓
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {user.expand?.hub_user_roles_via_user && user.expand.hub_user_roles_via_user.length > 0 ? (
                                                    user.expand.hub_user_roles_via_user.map((userRole: any, index: number) => (
                                                        <Badge key={index} variant="outline" className="text-xs">
                                                            {userRole.expand?.role?.name || "Sin nombre"}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <Badge variant="outline" className="text-gray-600 border-gray-600 text-xs text-nowrap">
                                                        Sin rol
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 min-w-[120px]">
                                                {user.active === false ? (
                                                    <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50 dark:bg-red-900/10">
                                                        🔒 Inactivo
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-900/10">
                                                        🟢 Activo
                                                    </Badge>
                                                )}
                                                {user.verified ? (
                                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                                        ✓ Email Verificado
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                                                        Email Pendiente
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    title={user.active === false ? "Activar Usuario" : "Desactivar Usuario"}
                                                    onClick={() => handleToggleStatus(user)}
                                                    disabled={isToggling === user.id}
                                                >
                                                    {isToggling === user.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : user.active === false ? (
                                                        <UserCheck className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <UserX className="h-4 w-4 text-orange-600" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    title={user.verified ? "Marcar como No Verificado" : "Marcar como Verificado"}
                                                    onClick={() => handleToggleVerified(user)}
                                                    disabled={isToggling === user.id}
                                                >
                                                    {isToggling === user.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : user.verified ? (
                                                        <UserCheck className="h-4 w-4 text-green-600 fill-green-100" />
                                                    ) : (
                                                        <UserCheck className="h-4 w-4 text-blue-600" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditUser(user)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeleteClick(user)}
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

            {/* User Sheet (Create/Edit) */}
            <UserSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                user={selectedUser}
                onSuccess={loadUsers}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente al usuario <strong>{getFullName(userToDelete)}</strong> y todos sus datos asociados.
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
