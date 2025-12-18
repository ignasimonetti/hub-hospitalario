"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createUser, updateUser } from "@/app/actions/users";
import { Upload, Loader2, AlertTriangle, User, Building2, Shield } from "lucide-react";
import { pocketbase } from "@/lib/auth";
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

interface UserSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: any | null;
    onSuccess: () => void;
    currentTenantId?: string;
}

export function UserSheet({ open, onOpenChange, user, onSuccess, currentTenantId }: UserSheetProps) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [dni, setDni] = useState("");
    const [password, setPassword] = useState("");
    const [sendInvitation, setSendInvitation] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [isVerified, setIsVerified] = useState(false);
    const [showInactiveConfirm, setShowInactiveConfirm] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Roles and Tenants state
    const [tenants, setTenants] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<string>("");
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [activeUserRoles, setActiveUserRoles] = useState<any[]>([]);

    const isEditing = !!user;

    // Fetch lists on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tenantsList, rolesList] = await Promise.all([
                    pocketbase.collection('hub_tenants').getFullList({ sort: 'name' }),
                    pocketbase.collection('hub_roles').getFullList({ sort: 'name' }),
                ]);
                setTenants(tenantsList);
                setRoles(rolesList);
            } catch (err: any) {
                if (err.isAbort) return; // Ignore auto-cancellation
                console.error("Error fetching tenants/roles:", err);
            }
        };
        fetchData();
    }, []);

    // Update form when user changes
    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
            setEmail(user.email || "");
            setPhone(user.phone || "");
            setDni(user.dni || "");
            setPassword("");
            setSendInvitation(false);
            setIsActive(user.active !== false); // Default to true if undefined
            setIsVerified(user.verified === true);

            // Set avatar preview if exists
            if (user.avatar) {
                const avatarUrl = pocketbase.files.getURL(user, user.avatar, { thumb: '100x100' });
                setAvatarPreview(avatarUrl);
            } else {
                setAvatarPreview(null);
            }

            // Store all user roles for reference
            const userRoles = user.expand?.hub_user_roles_via_user || [];
            setActiveUserRoles(userRoles);

            // Pre-select tenant: use passed prop, or first from user roles, or first available
            let initialTenant = currentTenantId || "";
            if (!initialTenant && userRoles.length > 0) {
                // Try to find a role with a tenant
                const roleWithTenant = userRoles.find((ur: any) => ur.tenant);
                if (roleWithTenant) initialTenant = roleWithTenant.tenant;
            }
            if (!initialTenant && tenants.length > 0) {
                // Option: default to first tenant if nothing else?
                // initialTenant = tenants[0].id; 
                // Better to leave empty if creating new user unless currentTenantId is forced
            }
            setSelectedTenantId(initialTenant);

        } else {
            setFirstName("");
            setLastName("");
            setEmail("");
            setPhone("");
            setDni("");
            setPassword("");
            setSendInvitation(true);
            setIsActive(true);
            setIsVerified(false);
            setAvatarPreview(null);
            setActiveUserRoles([]);
            // new user defaults
            setSelectedTenantId(currentTenantId || "");
            setSelectedRoleIds([]);
        }
        setError(null);
    }, [user, currentTenantId, tenants]); // tenants added to dependency to allow auto-select if needed later

    // Update selected roles when tenant changes
    useEffect(() => {
        if (selectedTenantId && user) {
            // Filter roles for this tenant
            const rolesForTenant = activeUserRoles
                .filter((ur: any) => ur.tenant === selectedTenantId)
                .map((ur: any) => ur.role);
            setSelectedRoleIds(rolesForTenant);
        } else if (!user) {
            // For new user, we keep the selection as is or clear it?
            // If we change tenant, we should probably clear roles as they are per-tenant.
            // But if I selected 'Doctor' and change from Hospital A to B, do I want to keep 'Doctor'?
            // Let's assume yes for UX convenience in creation flow, but strictly speaking roles are tied to tenant.
            // Actually, roles are globally defined (e.g. ID for 'Doctor' is constant).
            // So keeping the selection is user-friendly. I will NOT clear selectedRoleIds when activeUserRoles is empty/new user.
        }
    }, [selectedTenantId, user, activeUserRoles]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRoleToggle = (roleId: string) => {
        setSelectedRoleIds(prev => {
            if (prev.includes(roleId)) {
                return prev.filter(id => id !== roleId);
            } else {
                return [...prev, roleId];
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.append("firstName", firstName);
        formData.append("lastName", lastName);
        formData.append("email", email);
        formData.append("phone", phone);
        formData.append("dni", dni);
        formData.append("active", String(isActive));
        formData.append("verified", String(isVerified));
        formData.append("sendInvitation", String(sendInvitation));

        if (!isEditing && password) {
            formData.append("password", password);
        }

        // Add avatar if changed
        const fileInput = fileInputRef.current;
        if (fileInput?.files?.[0]) {
            formData.append("avatar", fileInput.files[0]);
        }

        // Append Tenant & Roles
        if (selectedTenantId) {
            formData.append("tenantId", selectedTenantId);
        }
        // Always send roles array if we have a tenant selected, even if empty (to plain clear roles)
        // But createUser/updateUser logic expects 'roles' only if provided.
        if (selectedTenantId && selectedRoleIds.length >= 0) {
            formData.append("roles", JSON.stringify(selectedRoleIds));
        }

        try {
            let result;
            if (isEditing) {
                result = await updateUser(user.id, formData);
            } else {
                result = await createUser(formData);
            }

            console.log('[UserSheet] Result:', result);

            if (result.success) {
                onSuccess();
                onOpenChange(false);
            } else {
                const errorMsg = result.error || "Error al guardar el usuario";
                console.error('[UserSheet] Error from server:', errorMsg);
                setError(errorMsg);
            }
        } catch (err: any) {
            console.error('[UserSheet] Exception:', err);
            const errorMsg = err?.message || err?.toString() || "Error inesperado";
            setError(`Error: ${errorMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInitials = () => {
        const first = firstName.charAt(0).toUpperCase();
        const last = lastName.charAt(0).toUpperCase();
        return first + last || "U";
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl overflow-y-auto bg-white dark:bg-gray-950">
                <SheetHeader>
                    <SheetTitle>{isEditing ? "Editar Usuario" : "Nuevo Usuario"}</SheetTitle>
                    <SheetDescription>
                        {isEditing
                            ? "Actualiza la información y roles del usuario."
                            : "Crea un nuevo usuario y asígnale hospital y roles."}
                    </SheetDescription>
                </SheetHeader>

                <Separator className="my-4" />

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    {/* Avatar Upload */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Foto de Perfil</Label>
                        <div className="flex items-center gap-4">
                            <Avatar className="w-20 h-20">
                                <AvatarImage src={avatarPreview || undefined} alt="Avatar" />
                                <AvatarFallback className="bg-blue-600 text-white text-xl">
                                    {getInitials()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {avatarPreview ? "Cambiar Foto" : "Subir Foto"}
                                </Button>
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    PNG, JPG (máx. 1MB)
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Nombre *</Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Ej: Juan"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Apellido *</Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Ej: Pérez"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="usuario@ejemplo.com"
                            required
                            disabled={isEditing}
                        />
                        {isEditing && (
                            <p className="text-xs text-muted-foreground">
                                El email no se puede modificar
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+54 9 11..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dni">DNI</Label>
                            <Input
                                id="dni"
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                placeholder="12345678"
                            />
                        </div>
                    </div>

                    {/* Roles & Tenants Section */}
                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">Accesos y Hospitales</h3>
                        </div>

                        <div className="space-y-3">
                            <Label>Hospital (Tenant)</Label>
                            <Select
                                value={selectedTenantId}
                                onValueChange={setSelectedTenantId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar Hospital" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tenants.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Selecciona el hospital para el cual quieres asignar roles.
                            </p>
                        </div>

                        {selectedTenantId && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <Label>Roles Asignados</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-gray-200 dark:border-gray-800 rounded-md p-3 max-h-48 overflow-y-auto">
                                    {roles.map((role) => {
                                        const isChecked = selectedRoleIds.includes(role.id);
                                        return (
                                            <div
                                                key={role.id}
                                                className={`flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${isChecked ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                                    }`}
                                            >
                                                <Checkbox
                                                    id={`role-${role.id}`}
                                                    checked={isChecked}
                                                    onCheckedChange={() => handleRoleToggle(role.id)}
                                                />
                                                <Label
                                                    htmlFor={`role-${role.id}`}
                                                    className="cursor-pointer flex-1 font-normal text-sm"
                                                >
                                                    {role.name}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Los permisos se aplicarán al usuario solo en el hospital seleccionado.
                                </p>
                            </div>
                        )}
                    </div>

                    <Separator className="my-6" />

                    {/* Password Field */}
                    {!isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Dejar vacío para auto-generar"
                            />
                            <p className="text-xs text-muted-foreground">
                                Si no se especifica, se generará automáticamente
                            </p>
                        </div>
                    )}

                    {/* Status & Invitation */}
                    <div className="space-y-4">
                        {!isEditing && (
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/30">
                                <div className="space-y-1 flex-1">
                                    <Label className="text-sm font-semibold">Enviar Invitación</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Se enviará un email de invitación al usuario
                                    </p>
                                </div>
                                <Switch
                                    checked={sendInvitation}
                                    onCheckedChange={setSendInvitation}
                                />
                            </div>
                        )}

                        {isEditing && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-900/50">
                                    <div className="space-y-1 flex-1">
                                        <Label className="text-sm font-semibold">Estado de Acceso</Label>
                                        <div className="flex items-center gap-2">
                                            {isActive ? (
                                                <>
                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Usuario activo</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">Usuario inactivo</span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {isActive
                                                ? "El usuario puede acceder al sistema normalmente"
                                                : "El usuario NO puede iniciar sesión"}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={isActive}
                                        onCheckedChange={(value) => {
                                            if (!value && isActive) {
                                                setShowInactiveConfirm(true);
                                            } else {
                                                setIsActive(value);
                                            }
                                        }}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/30">
                                    <div className="space-y-1 flex-1">
                                        <Label className="text-sm font-semibold">Email Verificado</Label>
                                        <div className="flex items-center gap-2">
                                            {isVerified ? (
                                                <>
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Verificado</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Pendiente</span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {isVerified
                                                ? "El email ya ha sido verificado"
                                                : "Puedes verificar el email manualmente si el usuario no recibió el correo"}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={isVerified}
                                        onCheckedChange={setIsVerified}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>{isEditing ? "Actualizar" : "Crear"} Usuario</>
                            )}
                        </Button>
                    </div>
                </form>
            </SheetContent>

            {/* Confirmation Dialog for Inactive Status */}
            <AlertDialog open={showInactiveConfirm} onOpenChange={setShowInactiveConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            ¿Desactivar Usuario?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <div className="text-sm text-muted-foreground">
                                    Estás a punto de <strong>desactivar</strong> este usuario. Esto tendrá los siguientes efectos:
                                </div>
                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                                    <li>El usuario <strong>NO podrá iniciar sesión</strong></li>
                                    <li>Se bloqueará todo acceso al sistema</li>
                                    <li>Los datos del usuario se mantienen intactos</li>
                                    <li>Podrás reactivar el usuario en cualquier momento</li>
                                </ul>
                                <div className="font-medium text-sm mt-3">
                                    ¿Estás seguro de continuar?
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowInactiveConfirm(false)}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setIsActive(false);
                                setShowInactiveConfirm(false);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Sí, Desactivar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Sheet>
    );
}
