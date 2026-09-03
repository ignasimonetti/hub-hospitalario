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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Users, Plus, Edit, Trash2, Search, Loader2, UserCheck, UserX, UserCog, Filter, ChevronLeft, ChevronRight, X } from "lucide-react";
import { getUsers, deleteUser, toggleUserStatus, updateUser } from "@/app/actions/users";
import { UserSheet } from "./UserSheet";
import { pocketbase } from "@/lib/auth";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";

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

    // Filtros avanzados
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [verificationFilter, setVerificationFilter] = useState<string>("all");

    // Paginación
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(15);

    useEffect(() => {
        loadUsers();
    }, []);

    // Resetear a página 1 al cambiar cualquier filtro
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter, statusFilter, verificationFilter, pageSize]);

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

    // Extraer lista única de roles disponibles en los usuarios
    const availableRoles = Array.from(
        new Set(
            users.flatMap(u =>
                u.expand?.hub_user_roles_via_user?.map((ur: any) => ur.expand?.role?.name).filter(Boolean) || []
            )
        )
    ).sort();

    const filteredUsers = users.filter(user => {
        // 1. Filtro por término de búsqueda (nombre, apellido, email)
        const matchesSearch = !searchTerm || (
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // 2. Filtro por Rol
        let matchesRole = true;
        const userRoles: string[] = user.expand?.hub_user_roles_via_user?.map((ur: any) => ur.expand?.role?.name).filter(Boolean) || [];
        if (roleFilter === "sin_rol") {
            matchesRole = userRoles.length === 0;
        } else if (roleFilter !== "all") {
            matchesRole = userRoles.includes(roleFilter);
        }

        // 3. Filtro por Estado (Activo / Inactivo)
        let matchesStatus = true;
        if (statusFilter === "active") {
            matchesStatus = user.active !== false;
        } else if (statusFilter === "inactive") {
            matchesStatus = user.active === false;
        }

        // 4. Filtro por Verificación de Correo
        let matchesVerification = true;
        if (verificationFilter === "verified") {
            matchesVerification = !!user.verified;
        } else if (verificationFilter === "unverified") {
            matchesVerification = !user.verified;
        }

        return matchesSearch && matchesRole && matchesStatus && matchesVerification;
    });

    // Paginación calculada sobre los resultados filtrados
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const hasActiveFilters = searchTerm !== "" || roleFilter !== "all" || statusFilter !== "all" || verificationFilter !== "all";

    const resetFilters = () => {
        setSearchTerm("");
        setRoleFilter("all");
        setStatusFilter("all");
        setVerificationFilter("all");
        setCurrentPage(1);
    };

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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Administración de Usuarios</h2>
                    <p className="text-muted-foreground dark:text-slate-400 mt-1">
                        Gestiona usuarios del sistema y asigna roles de acceso
                    </p>
                </div>
                <Button onClick={handleNewUser} className="dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold dark:text-slate-100">{users.length}</p>
                                <p className="text-sm text-muted-foreground dark:text-slate-400">Total Usuarios</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <UserCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold dark:text-slate-100">{verifiedUsers.length}</p>
                                <p className="text-sm text-muted-foreground dark:text-slate-400">Emails Verificados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <UserX className="h-8 w-8 text-red-600 dark:text-red-400" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold dark:text-slate-100">{inactiveUsers.length}</p>
                                <p className="text-sm text-muted-foreground dark:text-slate-400">Sin Activar</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <UserCog className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                            <div className="ml-4">
                                <p className="text-2xl font-bold dark:text-slate-100">{usersWithoutRoles.length}</p>
                                <p className="text-sm text-muted-foreground dark:text-slate-400">Sin Roles</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xs">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 h-4 w-4" />
                    <Input
                        placeholder="Buscar por nombre o correo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9 text-xs bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 dark:text-slate-200 dark:placeholder:text-slate-400"
                    />
                </div>

                {/* Filtro por Rol */}
                <div className="w-full md:w-52">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="h-9 text-xs bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800">
                            <SelectValue placeholder="Filtrar por Rol" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900">
                            <SelectItem value="all" className="text-xs">Todos los roles</SelectItem>
                            <SelectItem value="sin_rol" className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                                ⚠️ Sin rol asignado ({usersWithoutRoles.length})
                            </SelectItem>
                            {availableRoles.map(roleName => (
                                <SelectItem key={roleName} value={roleName} className="text-xs">
                                    {roleName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Filtro por Estado Operativo */}
                <div className="w-full md:w-40">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-9 text-xs bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900">
                            <SelectItem value="all" className="text-xs">Todos los estados</SelectItem>
                            <SelectItem value="active" className="text-xs">🟢 Solo Activos</SelectItem>
                            <SelectItem value="inactive" className="text-xs">🔒 Inactivos ({inactiveUsers.length})</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Filtro por Verificación Email */}
                <div className="w-full md:w-44">
                    <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                        <SelectTrigger className="h-9 text-xs bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800">
                            <SelectValue placeholder="Verificación" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900">
                            <SelectItem value="all" className="text-xs">Todas las cuentas</SelectItem>
                            <SelectItem value="verified" className="text-xs">✓ Email Verificado</SelectItem>
                            <SelectItem value="unverified" className="text-xs">⏳ Email Pendiente</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Botón Resetear si hay filtros activos */}
                {hasActiveFilters && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="h-9 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                    >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Limpiar ({filteredUsers.length} encontrados)
                    </Button>
                )}
            </div>

            {/* Users Table */}
            <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                        <Users className="h-5 w-5 dark:text-slate-400" />
                        Lista de Usuarios
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="dark:text-slate-400">Usuario</TableHead>
                                    <TableHead className="dark:text-slate-400 hidden sm:table-cell">Email</TableHead>
                                    <TableHead className="dark:text-slate-400 hidden md:table-cell">Roles</TableHead>
                                    <TableHead className="dark:text-slate-400">Estado</TableHead>
                                    <TableHead className="dark:text-slate-400 text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-2">
                                            <EmptyState
                                                icon={Users}
                                                title={users.length === 0 ? "No hay usuarios registrados" : "Sin resultados para los filtros seleccionados"}
                                                description={users.length === 0 ? "Comenzá invitando o creando usuarios en el sistema." : "Probá ajustando el rol, estado o término de búsqueda."}
                                                action={users.length === 0 ? {
                                                    label: "Nuevo Usuario",
                                                    onClick: handleNewUser,
                                                    icon: Plus
                                                } : hasActiveFilters ? {
                                                    label: "Limpiar Filtros",
                                                    onClick: resetFilters,
                                                    icon: X
                                                } : undefined}
                                                compact
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarImage src={getUserAvatarUrl(user)} alt={getFullName(user)} />
                                                        <AvatarFallback className="bg-blue-600 dark:bg-blue-500 text-white">
                                                            {getInitials(user)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <span className="font-medium dark:text-slate-200 block">{getFullName(user)}</span>
                                                        <span className="sm:hidden text-xs text-muted-foreground">{user.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <span className="dark:text-slate-300">{user.email}</span>
                                                    {user.verified && (
                                                        <Badge variant="outline" className="text-green-600 border-green-600 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-xs">
                                                            ✓
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="flex gap-1 flex-wrap">
                                                    {user.expand?.hub_user_roles_via_user && user.expand.hub_user_roles_via_user.length > 0 ? (
                                                        user.expand.hub_user_roles_via_user.map((userRole: any, index: number) => (
                                                            <Badge key={index} variant="outline" className="text-xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                                                                {userRole.expand?.role?.name || "Sin nombre"}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-xs text-nowrap">
                                                            Sin rol
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 min-w-[120px]">
                                                {user.active === false ? (
                                                    <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                                                        🔒 Inactivo
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                                        🟢 Activo
                                                    </Badge>
                                                )}
                                                {user.verified ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                                        ✓ Email Verificado
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
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
                                                    variant="ghost"
                                                    onClick={() => handleEditUser(user)}
                                                    className="hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteClick(user)}
                                                    className="text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/30"
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
                    </div>

                    {/* Pagination Controls */}
                    {filteredUsers.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-slate-400">
                                <span>
                                    Mostrando <strong>{((currentPage - 1) * pageSize) + 1}</strong> a <strong>{Math.min(currentPage * pageSize, filteredUsers.length)}</strong> de <strong>{filteredUsers.length}</strong> usuarios
                                    {hasActiveFilters && ` (filtrados de ${users.length} totales)`}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-slate-400">
                                    <span>Filas:</span>
                                    <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
                                        <SelectTrigger className="h-7 w-16 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-slate-900">
                                            <SelectItem value="10" className="text-xs">10</SelectItem>
                                            <SelectItem value="15" className="text-xs">15</SelectItem>
                                            <SelectItem value="25" className="text-xs">25</SelectItem>
                                            <SelectItem value="50" className="text-xs">50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage <= 1}
                                        className="h-7 px-2 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                                        Anterior
                                    </Button>
                                    <span className="text-xs font-semibold px-2 text-slate-700 dark:text-slate-300">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage >= totalPages}
                                        className="h-7 px-2 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"
                                    >
                                        Siguiente
                                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
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
