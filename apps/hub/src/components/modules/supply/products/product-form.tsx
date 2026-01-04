"use client";

import { useState, useEffect } from "react";
import { Package, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { createProduct, updateProduct, checkProductAvailability } from "@/app/actions/supply";
import { SupplyProduct } from "@/types/supply";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProductFormProps {
    initialData?: Partial<SupplyProduct> | null;
    categories: any[];
    onSuccess: () => void;
    onCancel: () => void;
}

export function ProductForm({ initialData, categories, onSuccess, onCancel }: ProductFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Validation States
    const [name, setName] = useState(initialData?.name || "");
    const [sku, setSku] = useState(initialData?.sku || "");

    // Warning/Error States
    const [skuError, setSkuError] = useState<string | null>(null);
    const [nameWarning, setNameWarning] = useState<any[]>([]);
    const [isCheckingSku, setIsCheckingSku] = useState(false);
    const [isCheckingName, setIsCheckingName] = useState(false);

    // Debounce Logic for SKU
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (sku.length < 3) return;
            setIsCheckingSku(true);
            const check = await checkProductAvailability('sku', sku, initialData?.id);
            setSkuError(check.exists ? "Este SKU ya está registrado en el sistema." : null);
            setIsCheckingSku(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [sku, initialData?.id]);

    // Debounce Logic for Name
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (name.length < 3) return;
            setIsCheckingName(true);
            const check = await checkProductAvailability('name', name, initialData?.id);
            setNameWarning(check.matches);
            setIsCheckingName(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [name, initialData?.id]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (skuError) return; // Prevent submit if SKU duplicate

        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name"),
            sku: formData.get("sku"),
            category: formData.get("category"),
            unit: formData.get("unit"),
            description: formData.get("description"),
            alert_threshold: Number(formData.get("alert_threshold")) || 0,
            stock_current: Number(formData.get("stock_current")) || 0,
            price_estimated: Number(formData.get("price_estimated")) || 0,
            type: formData.get("type") as any,
            is_critical: formData.get("is_critical") === "on",
        };

        let result;
        if (initialData?.id) {
            result = await updateProduct(initialData.id, data);
        } else {
            result = await createProduct(data);
        }

        if (result.success) {
            toast.success(initialData?.id ? "Producto actualizado" : "Producto creado correctamente");
            router.refresh();
            onSuccess();
        } else {
            toast.error("Error al guardar: " + result.error);
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-1 py-4 space-y-6 custom-scrollbar">
                <div className="space-y-6">
                    {/* Name Field with Intelligent Suggestions */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-500">Nombre del Insumo <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Paracetamol 500mg"
                            required
                            className="h-11 font-medium bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20"
                        />
                        {/* Intelligent Name Warnings */}
                        {nameWarning.length > 0 && (
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-4 mt-2">
                                <div className="flex items-start gap-2 text-amber-600 dark:text-amber-500 mb-2">
                                    <AlertTriangle className="w-4 h-4 mt-0.5" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Posibles duplicados encontrados</span>
                                </div>
                                <div className="space-y-1">
                                    {nameWarning.map(match => (
                                        <div key={match.id} className="text-xs text-slate-600 dark:text-slate-400 font-medium pl-6">
                                            • {match.name} <span className="text-slate-400 dark:text-slate-600 font-mono text-[10px]">({match.sku})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sku" className="text-xs font-bold uppercase tracking-widest text-slate-500">SKU / Código <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Input
                                    id="sku"
                                    name="sku"
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value)}
                                    placeholder="MED-001"
                                    required
                                    className={`h-11 font-mono text-sm bg-gray-50 dark:bg-slate-900 ${skuError ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-slate-800'}`}
                                />
                                {isCheckingSku && (
                                    <div className="absolute right-3 top-3.5 h-4 w-4 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin"></div>
                                )}
                            </div>
                            {skuError && (
                                <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1">
                                    <X className="w-3 h-3" /> {skuError}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-xs font-bold uppercase tracking-widest text-slate-500">Categoría</Label>
                            <Select name="category" defaultValue={initialData?.category || undefined}>
                                <SelectTrigger className="h-11 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="unit" className="text-xs font-bold uppercase tracking-widest text-slate-500">Unidad de Medida</Label>
                        <Select name="unit" defaultValue={initialData?.unit || "unidad"}>
                            <SelectTrigger className="h-11 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unidad">Unidad (u)</SelectItem>
                                <SelectItem value="cja">Caja (cja)</SelectItem>
                                <SelectItem value="blister">Blister</SelectItem>
                                <SelectItem value="ampolla">Ampolla</SelectItem>
                                <SelectItem value="frasco">Frasco</SelectItem>
                                <SelectItem value="lt">Litro (l)</SelectItem>
                                <SelectItem value="kg">Kilo (kg)</SelectItem>
                                <SelectItem value="pack">Pack</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <Label htmlFor="type" className="text-xs font-bold uppercase tracking-widest text-slate-500">Tipo de Insumo <span className="text-red-500">*</span></Label>
                        <Select name="type" defaultValue={initialData?.type || "consumible"} required>
                            <SelectTrigger className="h-11 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                                <SelectValue placeholder="Seleccionar tipo..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="consumible">Consumible (Gasto)</SelectItem>
                                <SelectItem value="activo_fijo">Activo Fijo (Patrimonial)</SelectItem>
                                <SelectItem value="servicio">Servicio / Tercero</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-2 italic">
                            Determina el tratamiento contable y de stock.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-slate-500">Descripción</Label>
                        <Textarea
                            id="description"
                            name="description"
                            defaultValue={initialData?.description}
                            placeholder="Detalles adicionales del producto..."
                            className="bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 min-h-[100px]"
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-500" />
                        Inventario y Costos
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="stock_current" className="text-xs font-bold uppercase tracking-widest text-slate-500">Stock Inicial</Label>
                            <Input
                                id="stock_current"
                                name="stock_current"
                                type="number"
                                min="0"
                                defaultValue={initialData?.stock_current || 0}
                                className="h-11 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="alert_threshold" className="text-xs font-bold uppercase tracking-widest text-slate-500">Punto de Reposición (Alerta)</Label>
                            <Input
                                id="alert_threshold"
                                name="alert_threshold"
                                type="number"
                                min="0"
                                defaultValue={initialData?.alert_threshold || 0}
                                className="h-11 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                        <input
                            type="checkbox"
                            id="is_critical"
                            name="is_critical"
                            defaultChecked={initialData?.is_critical}
                            className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <div className="grid gap-1.5 leading-none">
                            <label
                                htmlFor="is_critical"
                                className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none cursor-pointer"
                            >
                                Marcar como Producto Crítico
                            </label>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Los productos críticos muestran un indicador visual rojo y tienen mayor visibilidad en el dashboard.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price_estimated" className="text-xs font-bold uppercase tracking-widest text-slate-500">Precio Estimado ($)</Label>
                        <Input
                            id="price_estimated"
                            name="price_estimated"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={initialData?.price_estimated || 0}
                            className="h-11 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 font-bold text-emerald-600 dark:text-emerald-400"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex gap-3 mt-auto">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 rounded-xl border-gray-200 dark:border-slate-800 font-bold text-slate-500">
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || !!skuError} className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? "Guardando..." : (initialData?.id ? "Actualizar Insumo" : "Crear Insumo")}
                </Button>
            </div>
        </form>
    );
}
