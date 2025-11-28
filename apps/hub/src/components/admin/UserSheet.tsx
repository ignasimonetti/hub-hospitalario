"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createUser, updateUser } from "@/app/actions/users";
import { Upload, Loader2, AlertTriangle, User } from "lucide-react";
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
    const [showInactiveConfirm, setShowInactiveConfirm] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEditing = !!user;

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

            // Set avatar preview if exists
            if (user.avatar) {
                const avatarUrl = pocketbase.files.getURL(user, user.avatar, { thumb: '100x100' });
                setAvatarPreview(avatarUrl);
            } else {
                setAvatarPreview(null);
            }
        } else {
            setFirstName("");
            setLastName("");
            setEmail("");
            setPhone("");
            setDni("");
            setPassword("");
            setSendInvitation(true);
            setIsActive(true);
            setAvatarPreview(null);
        }
        setError(null);
    }, [user]);

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
        formData.append("sendInvitation", String(sendInvitation));

        if (!isEditing && password) {
            formData.append("password", password);
        }

        // Add avatar if changed
        const fileInput = fileInputRef.current;
        if (fileInput?.files?.[0]) {
            formData.append("avatar", fileInput.files[0]);
        }

        // Add tenant if available
        if (currentTenantId) {
            formData.append("tenantId", currentTenantId);
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
                            ? "Actualiza la información del usuario."
                            : "Crea un nuevo usuario en el sistema."}
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

                    {/* First Name */}
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

                    {/* Last Name */}
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

                    {/* Email */}
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

                    {/* Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+54 9 11 1234-5678"
                        />
                    </div>

                    {/* DNI */}
                    <div className="space-y-2">
                        <Label htmlFor="dni">DNI</Label>
                        <Input
                            id="dni"
                            value={dni}
                            onChange={(e) => setDni(e.target.value)}
                            placeholder="12345678"
                        />
                    </div>

                    {/* Password (only for new users) */}
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

                    {/* Send Invitation (only for new users) */}
                    {!isEditing && (
                        <div className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                            <div className="space-y-1 flex-1">
                                <Label className="text-sm font-semibold">Enviar Invitación</Label>
                                <p className="text-xs text-muted-foreground">
                                    {sendInvitation
                                        ? "Se enviará un email de invitación al usuario"
                                        : "El usuario puede acceder inmediatamente"}
                                </p>
                            </div>
                            <Switch
                                checked={sendInvitation}
                                onCheckedChange={setSendInvitation}
                            />
                        </div>
                    )}

                    {/* Active Switch (only for editing existing users) */}
                    {isEditing && (
                        <div className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-900/50">
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
                                <p className="text-xs text-muted-foreground">
                                    {isActive
                                        ? "El usuario puede acceder al sistema normalmente"
                                        : "El usuario NO puede iniciar sesión"}
                                </p>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={(value) => {
                                        if (!value && isActive) {
                                            setShowInactiveConfirm(true);
                                        } else {
                                            setIsActive(value);
                                        }
                                    }}
                                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                                />
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {isActive ? "ON" : "OFF"}
                                </span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <Separator />

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
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
                                    <li>El email permanece verificado (no se desverifica)</li>
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
