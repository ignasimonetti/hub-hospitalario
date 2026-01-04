
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save } from "lucide-react";
import { pocketbase } from "@/lib/auth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/modules/RichTextEditor";
import { LocationSelector } from "@/components/modules/expedientes/LocationSelector";

// Definición del esquema de validación
const formSchema = z.object({
    numero: z.string().min(1, "El número de expediente es obligatorio"),
    descripcion: z.string().optional(),
    estado: z.enum(["En trámite", "Finalizado", "Archivado", "Pendiente"]),
    prioridad: z.enum(["Alta", "Media", "Baja"]),
    ubicacion: z.string().optional(),
    observacion: z.string().optional(),
    // fechas se manejan automáticas o separadas
});

type FormValues = z.infer<typeof formSchema>;

interface ExpedienteFormProps {
    initialData?: any; // Tipo any por ahora, idealmente ExpedienteRecord
    isEditing?: boolean;
}

export function ExpedienteForm({ initialData, isEditing = false }: ExpedienteFormProps) {
    const router = useRouter();
    const { currentTenant, currentRole } = useWorkspace();
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            numero: initialData?.numero || "",
            descripcion: initialData?.descripcion || "",
            estado: initialData?.estado || "En trámite",
            prioridad: initialData?.prioridad || "Media",
            ubicacion: initialData?.ubicacion || "",
            observacion: initialData?.observacion || "",
        },
    });

    async function onSubmit(data: FormValues) {
        if (!currentTenant) {
            toast.error("No se ha seleccionado un espacio de trabajo (Tenant).");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...data,
                tenant: currentTenant.id,
                ultimo_movimiento: new Date().toISOString(),
                // Si es nuevo, asignamos fecha de inicio
                ...(isEditing ? {} : { fecha_inicio: new Date().toISOString() }),
                // Intentamos asignar created_by si el usuario actual existe
                // created_by: pocketbase.authStore.model?.id (Solo si agragaste el campo)
            };

            if (isEditing && initialData?.id) {
                await pocketbase.collection("expedientes").update(initialData.id, payload);
                toast.success("Expediente actualizado correctamente.");
            } else {
                await pocketbase.collection("expedientes").create(payload);
                toast.success("Expediente creado correctamente.");
            }

            router.push("/modules/expedientes");
            router.refresh();
        } catch (error: any) {
            console.error("Error saving expediente:", error);
            toast.error(error.message || "Error al guardar el expediente.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Descripción Corta */}
                        <FormField
                            control={form.control}
                            name="descripcion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 dark:text-slate-300">Asunto / Descripción Corta</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej: Solicitud de compra de insumos..."
                                            {...field}
                                            className="text-lg py-7 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Observación / Notas (RichText) */}
                        <FormField
                            control={form.control}
                            name="observacion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 dark:text-slate-300">Detalles y Observaciones</FormLabel>
                                    <FormControl>
                                        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-sm">
                                            <RichTextEditor
                                                content={field.value || ""}
                                                onChange={field.onChange}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Right Column: Metadata Card */}
                    <div className="space-y-6 flex flex-col">
                        <div className="bg-gray-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl space-y-6 relative z-10 backdrop-blur-sm">
                            <h3 className="font-bold text-xs text-slate-500 dark:text-slate-500 uppercase tracking-[0.1em] mb-4">Información del Registro</h3>

                            {/* Número de Expediente */}
                            <FormField
                                control={form.control}
                                name="numero"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700 dark:text-slate-300">Número de Expediente</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ej: EX-2025-..."
                                                {...field}
                                                className="font-mono bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Estado y Prioridad en Grid pequeño */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Estado */}
                                <FormField
                                    control={form.control}
                                    name="estado"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 dark:text-slate-300">Estado</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                                                        <SelectValue placeholder="Estado" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="En trámite">En trámite</SelectItem>
                                                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                                                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                                                    <SelectItem value="Archivado">Archivado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Prioridad */}
                                <FormField
                                    control={form.control}
                                    name="prioridad"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 dark:text-slate-300">Prioridad</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                                                        <SelectValue placeholder="Prioridad" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Alta">Alta</SelectItem>
                                                    <SelectItem value="Media">Media</SelectItem>
                                                    <SelectItem value="Baja">Baja</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Ubicacion */}
                            <FormField
                                control={form.control}
                                name="ubicacion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-700 dark:text-slate-300">Ubicación Actual</FormLabel>
                                        <FormControl>
                                            <LocationSelector
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                className="bg-white dark:bg-slate-950"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </div>

                        <div className="flex flex-col gap-3 pt-6 relative z-0">
                            <Button
                                type="submit"
                                disabled={loading}
                                size="lg"
                                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Guardar Cambios" : "Crear Expediente"}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => router.back()}
                                className="w-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    );
}
