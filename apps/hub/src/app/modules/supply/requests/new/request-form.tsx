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

// Mock Data for "Search" (until we connect the real catalog)
const MOCK_PRODUCTS = [
    { id: "1", name: "Amoxicilina 500mg", type: "Medicamento", stock: 420 },
    { id: "2", name: "Guantes de Látex (L)", type: "Descartable", stock: 1500 },
    { id: "3", name: "Solución Fisiológica 500ml", type: "Medicamento", stock: 80 }, // Low stock
    { id: "4", name: "Jeringa 10ml", type: "Descartable", stock: 2000 },
];

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

    // Search Logic (Mock)
    const handleSearch = (term: string) => {
        setSearchTerm(term);
        if (term.length > 1) {
            const results = MOCK_PRODUCTS.filter(p =>
                p.name.toLowerCase().includes(term.toLowerCase())
            );
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    const addItem = (product: any) => {
        if (items.find(i => i.product_id === product.id)) return;

        setItems([...items, {
            product_id: product.id,
            name: product.name,
            quantity_requested: 1,
            stock_snapshot: product.stock
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
        setIsSubmitting(true);

        // TODO: Connect to Server Action
        console.log("Submitting:", { motive, priority, items });

        // Simulate delay
        setTimeout(() => {
            setIsSubmitting(false);
            router.push("/modules/supply/requests");
        }, 1000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-full">
            {/* LEFT COLUMN: FORM */}
            <div className="lg:col-span-8 flex flex-col gap-6 order-2 lg:order-1">
                <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 shadow-sm border border-border flex flex-col gap-6">

                    {/* Header Form */}
                    <div className="flex items-center gap-2 pb-3 border-b border-border">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileTextIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground">Datos de la Solicitud</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Sector Solicitante</label>
                            <Input
                                value="Farmacia Central"
                                readOnly
                                className="bg-muted/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Prioridad</label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="normal">Normal</option>
                                <option value="urgente">Urgente</option>
                                <option value="baja">Baja</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Justificación / Motivo</label>
                        <Textarea
                            placeholder="Describa brevemente la necesidad..."
                            className="min-h-[100px]"
                            value={motive}
                            onChange={(e) => setMotive(e.target.value)}
                            required
                        />
                    </div>

                    {/* Selected Items List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">Items Solicitados ({items.length})</h3>
                        </div>

                        {items.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-8 text-center bg-muted/20">
                                <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">Usa el buscador a la derecha para agregar productos.</p>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-border overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                                        <tr>
                                            <th className="px-4 py-2">Producto</th>
                                            <th className="px-4 py-2 w-32">Cantidad</th>
                                            <th className="px-4 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-card">
                                        {items.map((item, idx) => (
                                            <tr key={item.product_id} className="group">
                                                <td className="px-4 py-2 font-medium">{item.name}</td>
                                                <td className="px-4 py-2">
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={item.quantity_requested}
                                                        onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 1)}
                                                        className="h-8 w-24"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(idx)}
                                                        className="text-muted-foreground hover:text-red-500 transition-colors"
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
                        className="w-full mt-4"
                        size="lg"
                        disabled={isSubmitting || items.length === 0}
                    >
                        {isSubmitting ? "Guardando..." : "Crear Solicitud"}
                    </Button>
                </form>
            </div>

            {/* RIGHT COLUMN: SEARCH & CATALOG */}
            <div className="lg:col-span-4 flex flex-col gap-6 order-1 lg:order-2">
                {/* Search Box */}
                <div className="bg-card rounded-xl shadow-sm border border-border p-4 sticky top-6">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar productos..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {searchResults.length > 0 ? (
                            searchResults.map(prod => (
                                <div key={prod.id} className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer" onClick={() => addItem(prod)}>
                                    <div className="p-2 bg-muted rounded-md group-hover:bg-primary/10">
                                        <Package className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm text-foreground truncate">{prod.name}</h4>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-xs text-muted-foreground">{prod.type}</span>
                                            <span className={`text-xs font-bold ${prod.stock < 100 ? 'text-red-500' : 'text-green-600'}`}>
                                                Stock: {prod.stock}
                                            </span>
                                        </div>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        ) : searchTerm.length > 0 ? (
                            <p className="text-sm text-center text-muted-foreground py-4">No se encontraron productos.</p>
                        ) : (
                            <div className="text-center py-8">
                                <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">Escribe para buscar en el catálogo.</p>
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
