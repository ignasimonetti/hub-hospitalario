"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    Search,
    Trash2,
    AlertCircle,
    Plus,
    Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { searchProducts, createSupplyRequest } from "@/app/actions/supply";
import { useEffect, useRef } from "react";

export function SupplyRequestForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [motive, setMotive] = useState("");
    const [priority, setPriority] = useState("normal");
    const [items, setItems] = useState<any[]>([]);

    // Search State
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Search Logic (Real with Debounce)
    useEffect(() => {
        if (searchTerm.length > 1) {
            setIsSearching(true);
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

            searchTimeoutRef.current = setTimeout(async () => {
                const results = await searchProducts(searchTerm);
                setSearchResults(results);
                setIsSearching(false);
            }, 300); // 300ms debounce
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [searchTerm]);

    const addItem = (product: any) => {
        if (items.find(i => i.product_id === product.id)) return;

        setItems([...items, {
            product_id: product.id,
            name: product.name,
            quantity_requested: 1,
            sku: product.sku,
            unit: product.unit
        }]);
        setSearchTerm("");
        setSearchResults([]);
    };

    const updateQuantity = (index: number, val: number) => {
        const newItems = [...items];
        newItems[index].quantity_requested = val;
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return;

        setIsSubmitting(true);

        const result = await createSupplyRequest({
            requesting_sector: "Farmacia Central", // TODO: Get from user profile/context
            motive,
            priority,
            items: items.map(i => ({
                product_id: i.product_id,
                name: i.name,
                quantity: i.quantity_requested,
                sku: i.sku,
                unit: i.unit
            }))
        });

        if (result.success) {
            router.push("/modules/supply/requests");
        } else {
            alert("Error al crear la solicitud: " + result.error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            {/* LEFT COLUMN: FORM */}
            <div className="lg:col-span-8 flex flex-col gap-8 order-2 lg:order-1">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-slate-800 flex flex-col gap-8">

                    {/* Header Form */}
                    <div className="flex items-center gap-4 pb-6 border-b border-gray-100 dark:border-slate-800/50">
                        <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <FileTextIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Datos de la Solicitud</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium lowercase first-letter:uppercase">Complete los detalles para procesar el abastecimiento.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Sector Solicitante</label>
                            <Input
                                value="Farmacia Central"
                                readOnly
                                className="bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Prioridad</label>
                            <select
                                className="flex h-10 w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-sm shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 outline-none font-medium"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="normal">🔵 Normal</option>
                                <option value="urgente">🔴 Urgente</option>
                                <option value="baja">⚪ Baja</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Justificación / Motivo</label>
                        <Textarea
                            placeholder="Describa brevemente la necesidad..."
                            className="min-h-[120px] rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all focus:ring-2 focus:ring-blue-500/20"
                            value={motive}
                            onChange={(e) => setMotive(e.target.value)}
                            required
                        />
                    </div>

                    {/* Selected Items List */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-1 rounded-full bg-blue-600"></div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Items Solicitados ({items.length})</h3>
                        </div>

                        {items.length === 0 ? (
                            <div className="rounded-2xl border-2 border-dashed border-gray-100 dark:border-slate-800/50 p-12 text-center bg-gray-50/50 dark:bg-slate-800/20 group">
                                <Package className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-4 group-hover:scale-110 transition-transform" />
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">Usa el buscador a la derecha para agregar productos al pedido.</p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="bg-gray-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-gray-100 dark:border-slate-800/50">
                                        <tr>
                                            <th className="px-6 py-4">Producto</th>
                                            <th className="px-6 py-4 w-40 text-center">Cantidad</th>
                                            <th className="px-6 py-4 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 bg-white dark:bg-slate-950/50">
                                        {items.map((item, idx) => (
                                            <tr key={item.product_id} className="group hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.sku}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center">
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            value={item.quantity_requested}
                                                            onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 1)}
                                                            className="h-10 w-24 text-center rounded-lg border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(idx)}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold h-14 rounded-2xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                        size="lg"
                        disabled={isSubmitting || items.length === 0}
                    >
                        {isSubmitting ? "Procesando..." : "Enviar Solicitud de Pedido"}
                    </Button>
                </form>
            </div>

            {/* RIGHT COLUMN: SEARCH & CATALOG */}
            <div className="lg:col-span-4 flex flex-col gap-6 order-1 lg:order-2">
                {/* Search Box */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 p-6 sticky top-8 transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <Search className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 tracking-tight text-lg">Buscador de Insumos</h3>
                    </div>

                    <div className="relative mb-6">
                        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Nombre del producto o SKU..."
                            className="pl-10 h-11 rounded-xl border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all focus:ring-2 focus:ring-blue-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        {isSearching && (
                            <div className="absolute right-3.5 top-3.5 animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        )}
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                        {searchResults.length > 0 ? (
                            searchResults.map(prod => (
                                <div
                                    key={prod.id}
                                    className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer relative"
                                    onClick={() => addItem(prod)}
                                >
                                    <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 text-slate-400">
                                        <Package className="w-6 h-6 shrink-0" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{prod.name}</h4>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{prod.unit || prod.type}</span>
                                            <span className="text-[10px] font-mono text-slate-300 dark:text-slate-600 hidden group-hover:block">{prod.sku}</span>
                                        </div>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="w-4 h-4 text-blue-600" />
                                    </div>
                                </div>
                            ))
                        ) : searchTerm.length > 0 && !isSearching ? (
                            <div className="text-center py-12">
                                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm font-bold text-slate-400">No se encontraron productos.</p>
                                <p className="text-xs text-slate-400 mt-1">Prueba con otras palabras clave.</p>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-slate-800">
                                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                                </div>
                                <p className="text-sm font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Listo para buscar</p>
                                <p className="text-[10px] text-slate-400 mt-2 px-6">Escribe el nombre del insumo o medicamento que necesitas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function FileTextIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
    )
}
