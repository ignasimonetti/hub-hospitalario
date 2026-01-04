"use client";

import { useState, useTransition, useEffect } from "react";
import {
    Plus,
    Search,
    Filter,
    Package,
    MoreHorizontal,
    Edit2,
    Trash2,
    AlertTriangle,
    ArrowUpDown,
    CheckCircle,
    Loader2,
    ArrowUpAz,
    ArrowDownAz,
    CalendarClock
} from "lucide-react";
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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SupplyProduct } from "@/types/supply";
import { ProductForm } from "./product-form";
import { deleteProduct } from "@/app/actions/supply";
import { toast } from "sonner";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface ProductListClientProps {
    initialItems: SupplyProduct[];
    categories: any[];
    totalItems: number;
}

export function ProductListClient({ initialItems, categories, totalItems }: ProductListClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
    const currentCategory = searchParams.get("c") || "all";
    const currentSort = searchParams.get("s") || "name";

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<SupplyProduct | null>(null);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Dynamic Counter logic
    const counterLabel = totalItems > initialItems.length
        ? `Viendo ${initialItems.length} de ${totalItems}`
        : `${totalItems} ${totalItems === 1 ? 'Producto' : 'Productos'}`;

    // Sync search term with URL with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (searchTerm) {
                params.set("q", searchTerm);
            } else {
                params.delete("q");
            }
            startTransition(() => {
                router.push(`${pathname}?${params.toString()}`);
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, pathname, router, searchParams]);

    const handleSortChange = (newSort: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("s", newSort);
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleCategoryChange = (catId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (catId === "all") {
            params.delete("c");
        } else {
            params.set("c", catId);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleEdit = (product: SupplyProduct) => {
        setEditingProduct(product);
        setIsSheetOpen(true);
    };

    const handleNew = () => {
        setEditingProduct(null);
        setIsSheetOpen(true);
    };

    const handleDelete = async () => {
        if (!productToDelete) return;

        setIsDeleting(true);
        try {
            const result = await deleteProduct(productToDelete);
            if (result.success) {
                toast.success("Operación Exitosa", {
                    description: "El producto ha sido eliminado del catálogo.",
                    icon: <CheckCircle className="h-5 w-5 text-emerald-500" />
                });
                setProductToDelete(null);
                router.refresh();
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast.error("Error", {
                description: "No se pudo eliminar el producto: " + error.message,
                icon: <AlertTriangle className="h-5 w-5 text-red-500" />
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFormSuccess = () => {
        setIsSheetOpen(false);
        router.refresh();
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm transition-all duration-300">
                <div className="relative flex-1 w-full group">
                    <div className="absolute right-3.5 top-2.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : counterLabel}
                    </div>
                    <Search className={`absolute left-3.5 top-3 h-4 w-4 transition-colors ${searchTerm ? 'text-blue-500' : 'text-slate-400'}`} />
                    <Input
                        placeholder="Buscar por nombre o SKU..."
                        className="w-full h-11 pl-10 pr-28 rounded-xl border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto">
                    {/* Category Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className={`flex-1 lg:flex-none h-11 rounded-xl border-gray-200 dark:border-slate-800 font-bold transition-all ${currentCategory !== 'all' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 text-blue-600' : 'text-slate-600 dark:text-slate-300'}`}>
                                <Filter className="mr-2 h-4 w-4" />
                                {currentCategory === 'all' ? 'Categorías' : categories.find(c => c.id === currentCategory)?.name || 'Filtrado'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px] rounded-xl">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Filtrar por</DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={currentCategory} onValueChange={handleCategoryChange}>
                                <DropdownMenuRadioItem value="all" className="font-bold">Todas las categorías</DropdownMenuRadioItem>
                                <DropdownMenuSeparator />
                                {categories.map(cat => (
                                    <DropdownMenuRadioItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Sort Selector */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex-1 lg:flex-none h-11 rounded-xl border-gray-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300">
                                <ArrowUpDown className="mr-2 h-4 w-4 text-slate-400" />
                                {currentSort === 'name' ? 'A-Z' : currentSort === '-name' ? 'Z-A' : currentSort === '-created' ? 'Nuevos' : 'Críticos'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px] rounded-xl">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Ordenar por</DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={currentSort} onValueChange={handleSortChange}>
                                <DropdownMenuRadioItem value="name" className="text-sm font-medium">
                                    <ArrowUpAz className="mr-2 h-4 w-4 text-blue-500" /> Nombre (A-Z)
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="-name" className="text-sm font-medium">
                                    <ArrowDownAz className="mr-2 h-4 w-4 text-blue-500" /> Nombre (Z-A)
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="-created" className="text-sm font-medium">
                                    <CalendarClock className="mr-2 h-4 w-4 text-emerald-500" /> Más recientes
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="-is_critical,name" className="text-sm font-medium">
                                    <AlertTriangle className="mr-2 h-4 w-4 text-red-500" /> Stock Crítico
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button onClick={handleNew} className="flex-1 lg:flex-none h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                        <Plus className="mr-2 h-5 w-5" />
                        Nuevo
                    </Button>
                </div>
            </div>

            {/* Content Table */}
            <div className={`rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden transition-all duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {initialItems.length === 0 ? (
                    <div className="p-20 text-center animate-in fade-in duration-500">
                        <div className="mx-auto h-24 w-24 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
                            <Package className="h-12 w-12 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">No se encontraron productos</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto font-medium text-lg">
                            {searchTerm ? "No hay resultados para tu búsqueda." : "Comienza agregando insumos al catálogo."}
                        </p>
                        {searchTerm && (
                            <Button onClick={() => setSearchTerm("")} variant="link" className="mt-4 text-blue-600 font-bold">
                                Limpiar búsqueda
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-5">Insumo</th>
                                    <th className="px-6 py-5">Categoría</th>
                                    <th className="px-6 py-5 text-center">Stock</th>
                                    <th className="px-6 py-5 text-right">Precio Est.</th>
                                    <th className="px-6 py-5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-200">
                                {initialItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-all group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${item.is_critical ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'} group-hover:scale-110 transition-transform`}>
                                                    <Package className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-slate-100 text-base leading-none mb-1.5 underline-offset-4 decoration-blue-500/30 group-hover:underline">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded w-fit">
                                                        {item.sku}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-sm">
                                                {categories.find(c => c.id === item.category)?.name || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-lg font-black leading-none ${(item.stock_current || 0) <= (item.alert_threshold || 0)
                                                    ? "text-red-500 animate-pulse"
                                                    : "text-slate-900 dark:text-slate-100"
                                                    }`}>
                                                    {item.stock_current || 0}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">{item.unit}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right font-mono font-bold text-slate-500 dark:text-slate-400">
                                            $ {(item.price_estimated || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[180px] rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl p-2">
                                                    <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Opciones</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEdit(item)} className="rounded-xl cursor-pointer py-2.5">
                                                        <Edit2 className="mr-2 h-4 w-4 text-blue-500" />
                                                        <span className="font-bold">Editar Insumo</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-2 bg-slate-100 dark:bg-slate-800" />
                                                    <DropdownMenuItem onClick={() => setProductToDelete(item.id)} className="rounded-xl text-red-600 dark:text-red-400 cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/30 py-2.5">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span className="font-bold">Eliminar</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Sheet for Create/Edit */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-xl p-0 border-l border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <SheetHeader className="px-6 py-8 border-b border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <SheetTitle className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter uppercase">
                            {editingProduct ? "Editar Insumo" : "Nuevo Insumo"}
                        </SheetTitle>
                        <SheetDescription className="text-slate-500 dark:text-slate-400 font-medium text-base">
                            {editingProduct
                                ? "Actualiza las especificaciones técnicas y niveles de stock."
                                : "Define las propiedades del nuevo material para el inventario."}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="h-[calc(100vh-160px)] overflow-y-auto">
                        <ProductForm
                            initialData={editingProduct}
                            categories={categories}
                            onSuccess={handleFormSuccess}
                            onCancel={() => setIsSheetOpen(false)}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Premium Confirmation Dialog */}
            <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <AlertDialogContent className="max-w-[420px] rounded-3xl p-0 border-none shadow-2xl overflow-hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                    <div className="h-1.5 w-full bg-red-600/20">
                        <div className="h-full bg-red-600 animate-pulse w-full" />
                    </div>

                    <div className="p-8">
                        <AlertDialogHeader>
                            <div className="flex justify-center mb-6">
                                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 ring-4 ring-red-50/50 dark:ring-red-900/10">
                                    <Trash2 className="h-8 w-8" />
                                </div>
                            </div>
                            <AlertDialogTitle className="text-2xl font-black text-center text-slate-900 dark:text-slate-100 tracking-tight leading-tight uppercase">
                                ¿Eliminar Insumo?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-center text-slate-500 dark:text-slate-400 text-base font-medium mt-3 leading-relaxed">
                                Esta operación es irreversible. El producto <span className="text-slate-900 dark:text-slate-100 font-bold underline decoration-red-500/30 underline-offset-4">dejará de existir</span> en el catálogo y registros de stock.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="flex flex-col gap-3 mt-8">
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete();
                                }}
                                disabled={isDeleting}
                                className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-red-600/20 border-none"
                            >
                                {isDeleting ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    "Confirmar Eliminación"
                                )}
                            </AlertDialogAction>
                            <AlertDialogCancel className="w-full h-12 rounded-xl border border-gray-200 dark:border-slate-800 font-bold text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-900 transition-all m-0 bg-transparent">
                                No, cancelar
                            </AlertDialogCancel>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
