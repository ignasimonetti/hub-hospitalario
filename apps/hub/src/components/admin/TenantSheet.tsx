"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { createTenant, updateTenant } from "@/app/actions/tenants";
import { Upload, Loader2, AlertTriangle } from "lucide-react";
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

interface TenantSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenant?: any | null;
    onSuccess: () => void;
}

export function TenantSheet({ open, onOpenChange, tenant, onSuccess }: TenantSheetProps) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [showInactiveConfirm, setShowInactiveConfirm] = useState(false);
    const [pendingInactiveChange, setPendingInactiveChange] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEditing = !!tenant;

    useEffect(() => {
        if (tenant) {
            setName(tenant.name || "");
            setSlug(tenant.slug || "");
            setDescription(tenant.description || "");
            setAddress(tenant.address || "");
            setPhone(tenant.phone || "");
            setEmail(tenant.email || "");
            setIsActive(tenant.is_active ?? true);

            // Set logo preview if exists
            if (tenant.logo) {
                const logoUrl = pocketbase.files.getURL(tenant, tenant.logo, { thumb: '100x100' });
                setLogoPreview(logoUrl);
            } else {
                setLogoPreview(null);
            }
        } else {
            setName("");
            setSlug("");
            setDescription("");
            setAddress("");
            setPhone("");
            setEmail("");
            setIsActive(true);
            setLogoPreview(null);
        }
        setError(null);
    }, [tenant]);

    // Auto-generate slug from name
    const handleNameChange = (newName: string) => {
        setName(newName);
        if (!isEditing || !slug) {
            const autoSlug = newName
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            setSlug(autoSlug);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleActiveChange = (newValue: boolean) => {
        if (!newValue && isActive) {
            // Trying to change from active to inactive - show confirmation
            setPendingInactiveChange(true);
            setShowInactiveConfirm(true);
        } else {
            // Changing to active or already inactive - allow directly
            setIsActive(newValue);
        }
    };

    const confirmInactiveChange = () => {
        setIsActive(false);
        setShowInactiveConfirm(false);
        setPendingInactiveChange(false);
    };

    const cancelInactiveChange = () => {
        setShowInactiveConfirm(false);
        setPendingInactiveChange(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        console.log('[TenantSheet] isActive state before submit:', isActive);

        const formData = new FormData();
        formData.append("name", name);
        formData.append("slug", slug);
        formData.append("description", description);
        formData.append("address", address);
        formData.append("phone", phone);
        formData.append("email", email);
        formData.append("is_active", String(isActive));

        console.log('[TenantSheet] FormData is_active:', formData.get('is_active'));

        // Add logo if changed
        const fileInput = fileInputRef.current;
        if (fileInput?.files?.[0]) {
            formData.append("logo", fileInput.files[0]);
        }

        try {
            let result;
            if (isEditing) {
                console.log('[TenantSheet] Updating tenant:', tenant.id);
                result = await updateTenant(tenant.id, formData);
            } else {
                console.log('[TenantSheet] Creating new tenant');
                result = await createTenant(formData);
            }

            if (result.success) {
                onSuccess();
                onOpenChange(false);
            } else {
                setError(result.error || "Error al guardar el hospital");
            }
        } catch (err: any) {
            setError(err.message || "Error inesperado");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl overflow-y-auto bg-white dark:bg-gray-950">
                <SheetHeader>
                    <SheetTitle>{isEditing ? "Editar Hospital" : "Nuevo Hospital"}</SheetTitle>
                    <SheetDescription>
                        {isEditing
                            ? "Actualiza la información del hospital."
                            : "Crea un nuevo hospital en la plataforma."}
                    </SheetDescription>
                </SheetHeader>

                <Separator className="my-4" />

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    {/* Logo Upload */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Logo del Hospital</Label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-gray-50 dark:bg-gray-900/50"
                        >
                            {logoPreview ? (
                                <div className="relative w-full h-full p-4">
                                    <img
                                        src={logoPreview}
                                        alt="Preview"
                                        className="w-full h-full object-contain rounded"
                                    />
                                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded flex items-center justify-center">
                                        <span className="text-white opacity-0 hover:opacity-100 text-sm font-medium">
                                            Cambiar imagen
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <Upload className="h-10 w-10 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Haz clic para subir
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            PNG, JPG o SVG (máx. 1MB)
                                        </p>
                                    </div>
                                </div>
                            )}
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Hospital *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Ej: Hospital Central"
                            required
                        />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug (Identificador único) *</Label>
                        <Input
                            id="slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="hospital-central"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Se usa en URLs y debe ser único. Se genera automáticamente.
                        </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Breve descripción del hospital"
                            maxLength={1000}
                        />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Ej: Av. Principal 123, Ciudad"
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Ej: +54 9 11 1234-5678"
                            type="tel"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="contacto@hospital.com"
                            type="email"
                        />
                    </div>

                    {/* Active Switch */}
                    <div className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-900/50">
                        <div className="space-y-1 flex-1">
                            <Label className="text-sm font-semibold">Estado del Hospital</Label>
                            <div className="flex items-center gap-2">
                                {isActive ? (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">Activo y operativo</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                        <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">Inactivo</span>
                                    </>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {isActive
                                    ? "Los usuarios pueden acceder sin restricciones"
                                    : "Acceso bloqueado para todos los usuarios"}
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <Switch
                                checked={isActive}
                                onCheckedChange={handleActiveChange}
                                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                            />
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {isActive ? "ON" : "OFF"}
                            </span>
                        </div>
                    </div>

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
                                <>{isEditing ? "Actualizar" : "Crear"} Hospital</>
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
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            ¿Desactivar Hospital?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <div className="text-sm text-muted-foreground">
                                    Estás a punto de <strong>desactivar</strong> el hospital. Esto tendrá los siguientes efectos:
                                </div>
                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                                    <li>Los usuarios <strong>NO podrán iniciar sesión</strong></li>
                                    <li>El acceso al sistema quedará <strong>bloqueado</strong></li>
                                    <li>Los datos se mantendrán intactos (no se eliminan)</li>
                                    <li>Podrás reactivar el hospital en cualquier momento</li>
                                </ul>
                                <div className="font-medium text-sm mt-3">
                                    ¿Estás seguro de continuar?
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelInactiveChange}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmInactiveChange}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            Sí, Desactivar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Sheet>
    );
}
